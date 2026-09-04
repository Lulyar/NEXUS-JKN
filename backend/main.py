import asyncio
import json
import os
import sys

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.data_loader import load_dataset, get_summary_stats
from services.graph_engine import build_referral_graph, graph_to_cytoscape
from services.anomaly_detector import detect_anomalies

app = FastAPI(title="NEXUS-JKN", description="Network Explorer & Unusual Syndicate-detector")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


def _get_analysis():
    """Load data, build graph, detect anomalies — with caching via data_loader."""
    df = load_dataset()
    G = build_referral_graph(df)
    anomalies, anomaly_edges = detect_anomalies(G)
    graph_data = graph_to_cytoscape(G, anomaly_edges)
    stats = get_summary_stats(df)
    stats["total_anomali"] = len(anomalies)
    stats["fraud_rate"] = round(
        sum(a['count'] for a in anomalies) / len(df) * 100, 1
    ) if anomalies else 0.0
    stats["faskes_terindikasi"] = len(
        set(a['source'] for a in anomalies) | set(a['target'] for a in anomalies)
    )
    return df, G, anomalies, anomaly_edges, graph_data, stats


# ────────────────────────── ROUTES ──────────────────────────

@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


@app.get("/api/graph")
async def get_graph():
    """Return graph data in Cytoscape.js format."""
    _, _, _, _, graph_data, _ = _get_analysis()
    return JSONResponse(content=graph_data)


@app.get("/api/anomalies")
async def get_anomalies():
    """Return detected anomalies list."""
    _, _, anomalies, _, _, _ = _get_analysis()
    return JSONResponse(content={"anomalies": anomalies, "count": len(anomalies)})


@app.get("/api/stats")
async def get_stats():
    """Return summary statistics."""
    _, _, _, _, _, stats = _get_analysis()
    return JSONResponse(content=stats)


@app.get("/api/audit/{source}/{target}")
async def get_audit_evidence(source: str, target: str):
    """Return detailed audit evidence for a specific edge."""
    df, G, anomalies, _, _, _ = _get_analysis()

    # URL decode the source/target names
    from urllib.parse import unquote
    source = unquote(source)
    target = unquote(target)

    if not G.has_edge(source, target):
        return JSONResponse(content={"error": "Edge not found"}, status_code=404)

    edge_data = G[source][target]

    # Get individual transactions for this edge
    mask = (df['faskes_asal'] == source) & (df['faskes_tujuan'] == target)
    transactions = df[mask].sort_values('timestamp', ascending=False).head(50)
    tx_list = transactions.to_dict(orient='records')
    for tx in tx_list:
        tx['timestamp'] = str(tx['timestamp'])

    # Find matching anomaly entry
    matching_anomaly = None
    for a in anomalies:
        if a['source'] == source and a['target'] == target:
            matching_anomaly = a
            break

    # Build XAI narrative
    concentration_pct = round(edge_data.get('concentration', 0) * 100, 1)
    mild_pct = round(edge_data.get('mild_ratio', 0) * 100, 1)
    avg_dist = edge_data.get('avg_distance', 0)
    count = edge_data.get('count', 0)

    narrative = (
        f"Deteksi Kolusi: {concentration_pct}% rujukan dari {source} "
        f"diarahkan ke {target}, dengan {mild_pct}% kasus berdiagnosis "
        f"penyakit ringan pada jarak rata-rata {avg_dist} km. "
        f"Total {count} transaksi teridentifikasi dalam periode ini."
    )

    return JSONResponse(content={
        "source": source,
        "target": target,
        "narrative": narrative,
        "edge_metrics": {
            "count": count,
            "concentration_pct": concentration_pct,
            "mild_diagnosis_pct": mild_pct,
            "avg_distance_km": avg_dist,
            "min_distance_km": edge_data.get('min_distance', 0),
            "max_distance_km": edge_data.get('max_distance', 0),
            "icd_breakdown": edge_data.get('icd_breakdown', {}),
        },
        "anomaly": matching_anomaly,
        "transactions": tx_list,
    })


# ────────────────────── WEBSOCKET LIVE STREAM ──────────────────────

@app.websocket("/ws/live-stream")
async def live_stream(ws: WebSocket):
    """
    Stream CSV data row by row to simulate real-time transaction feed.
    Client sends: { "action": "start", "speed": 1 }  (speed in seconds)
    Client sends: { "action": "pause" }
    Client sends: { "action": "resume" }
    Client sends: { "action": "stop" }
    Client sends: { "action": "set_speed", "speed": 0.5 }
    """
    await ws.accept()

    df = load_dataset()
    _, _, anomalies, anomaly_edges, _, _ = _get_analysis()

    paused = False
    speed = 1.0  # seconds between each row
    idx = 0
    streaming = False

    try:
        while True:
            # Check for client commands (non-blocking when streaming)
            if streaming and not paused:
                try:
                    msg = await asyncio.wait_for(ws.receive_text(), timeout=speed)
                    cmd = json.loads(msg)
                    action = cmd.get("action", "")

                    if action == "pause":
                        paused = True
                        await ws.send_json({"type": "status", "status": "paused"})
                        continue
                    elif action == "stop":
                        streaming = False
                        idx = 0
                        await ws.send_json({"type": "status", "status": "stopped"})
                        continue
                    elif action == "set_speed":
                        speed = max(0.05, float(cmd.get("speed", 1.0)))
                        await ws.send_json({"type": "status", "status": "speed_changed", "speed": speed})
                        continue
                except asyncio.TimeoutError:
                    pass  # No message received, continue streaming
            else:
                # Blocking wait for client commands when not streaming or paused
                msg = await ws.receive_text()
                cmd = json.loads(msg)
                action = cmd.get("action", "")

                if action == "start":
                    streaming = True
                    paused = False
                    idx = 0
                    speed = max(0.05, float(cmd.get("speed", 1.0)))
                    await ws.send_json({
                        "type": "status",
                        "status": "started",
                        "total_rows": len(df),
                        "speed": speed
                    })
                    continue
                elif action == "resume":
                    paused = False
                    await ws.send_json({"type": "status", "status": "resumed"})
                    continue
                elif action == "stop":
                    streaming = False
                    idx = 0
                    await ws.send_json({"type": "status", "status": "stopped"})
                    continue
                elif action == "set_speed":
                    speed = max(0.05, float(cmd.get("speed", 1.0)))
                    await ws.send_json({"type": "status", "status": "speed_changed", "speed": speed})
                    continue

            # Stream the next row
            if streaming and not paused and idx < len(df):
                row = df.iloc[idx]
                is_fraud = (row['faskes_asal'], row['faskes_tujuan']) in anomaly_edges

                await ws.send_json({
                    "type": "transaction",
                    "index": idx + 1,
                    "total": len(df),
                    "data": {
                        "id_rujukan": row['id_rujukan'],
                        "id_pasien": row['id_pasien'],
                        "faskes_asal": row['faskes_asal'],
                        "faskes_tujuan": row['faskes_tujuan'],
                        "kode_icd10": row['kode_icd10'],
                        "tingkat_faskes_tujuan": row['tingkat_faskes_tujuan'],
                        "jarak_km": float(row['jarak_km']),
                        "timestamp": str(row['timestamp']),
                    },
                    "is_fraud": bool(is_fraud),
                })
                idx += 1

            elif streaming and idx >= len(df):
                await ws.send_json({"type": "status", "status": "completed"})
                streaming = False
                idx = 0

    except WebSocketDisconnect:
        pass


# ────────────────────────── MAIN ──────────────────────────

if __name__ == "__main__":
    import uvicorn
    print("\n[NEXUS-JKN] Server Starting...")
    print(f"[NEXUS-JKN] Frontend path: {FRONTEND_DIR}")
    print(f"[NEXUS-JKN] Open browser at: http://localhost:8000\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
