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
from services.hospital_recommender import recommend_hospitals, DIAGNOSIS_CATALOG

app = FastAPI(
    title="AEGIS-JKN",
    description="Anomaly & Ethical Graph Insight System — Perisai Cerdas Penjaga Integritas Rujukan Faskes"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
DIST_DIR = os.path.join(FRONTEND_DIR, "dist")

if os.path.exists(os.path.join(DIST_DIR, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


_analysis_cache = None
_analysis_mtime = None


def _get_analysis(force_reload=False):
    """Load data, build graph, detect anomalies — with global in-memory caching."""
    global _analysis_cache, _analysis_mtime

    csv_path = os.path.normpath(
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'dataset_rujukan_nexus.csv')
    )
    current_mtime = os.path.getmtime(csv_path) if os.path.exists(csv_path) else None

    if not force_reload and _analysis_cache is not None and _analysis_mtime == current_mtime:
        return _analysis_cache

    df = load_dataset(force_reload=force_reload)
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

    _analysis_cache = (df, G, anomalies, anomaly_edges, graph_data, stats)
    _analysis_mtime = current_mtime
    return _analysis_cache


@app.on_event("startup")
async def startup_event():
    """Pre-warm cache and preload ML model so all API requests respond in < 1ms."""
    print("[AEGIS-JKN] Pre-warming cache and loading ML model...")
    _get_analysis()
    print("[AEGIS-JKN] Cache warmed successfully! Ready for instant requests.")


# ────────────────────────── ROUTES ──────────────────────────

@app.get("/")
async def serve_index():
    if os.path.exists(os.path.join(DIST_DIR, "index.html")):
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
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

    # Build XAI narrative with Real Distance & Travel Time metrics
    concentration_pct = round(edge_data.get('concentration', 0) * 100, 1)
    mild_pct = round(edge_data.get('mild_ratio', 0) * 100, 1)
    avg_dist = edge_data.get('avg_distance', 0)
    real_dist = edge_data.get('real_distance_km', round(avg_dist * 1.25, 1))
    travel_time = edge_data.get('travel_time_minutes', max(6, int(round((real_dist / 28.0) * 60))))
    nearest_hospital = edge_data.get('nearest_hospital', target)
    nearest_dist = edge_data.get('nearest_distance_km', 3.1)
    nearest_time = edge_data.get('nearest_travel_time_min', 8)
    time_penalty = edge_data.get('time_penalty_minutes', max(0, travel_time - nearest_time))
    count = edge_data.get('count', 0)

    if matching_anomaly:
        narrative = (
            f"Deteksi Kolusi & Inefisiensi Rujukan: {concentration_pct}% rujukan dari {source} "
            f"diarahkan ke {target} dengan estimasi waktu tempuh {travel_time} menit ({real_dist} km jalan darat). "
            f"Rujukan ini melompati {nearest_hospital} yang hanya berjarak {nearest_dist} km ({nearest_time} menit), "
            f"menyebabkan pemborosan waktu tempuh pasien hingga +{time_penalty} menit pada {mild_pct}% kasus penyakit non-spesialistik."
        )
    else:
        narrative = (
            f"Alur Rujukan Normal: Rujukan dari {source} menuju {target} "
            f"dengan estimasi waktu tempuh {travel_time} menit ({real_dist} km jalan darat) "
            f"terdistribusi secara wajar ({count} transaksi)."
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
            "real_distance_km": real_dist,
            "travel_time_minutes": travel_time,
            "nearest_hospital": nearest_hospital,
            "nearest_distance_km": nearest_dist,
            "nearest_travel_time_min": nearest_time,
            "time_penalty_minutes": time_penalty,
            "min_distance_km": edge_data.get('min_distance', 0),
            "max_distance_km": edge_data.get('max_distance', 0),
            "icd_breakdown": edge_data.get('icd_breakdown', {}),
        },
        "anomaly": matching_anomaly,
        "transactions": tx_list,
    })


# ────────────────────── REAL ROAD ROUTING API (OSRM) ──────────────────────

_route_cache = {}

@app.get("/api/route")
async def get_road_route(lat1: float, lng1: float, lat2: float, lng2: float):
    """
    Get real street polyline geometry and travel time between two coordinates using OSRM.
    Results are cached in memory for instant delivery.
    """
    import urllib.request
    cache_key = f"{round(lat1, 4)},{round(lng1, 4)}_{round(lat2, 4)},{round(lng2, 4)}"
    if cache_key in _route_cache:
        return JSONResponse(content=_route_cache[cache_key])

    url = f"https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AEGIS-JKN/1.0"})
        with urllib.request.urlopen(req, timeout=4) as response:
            data = json.loads(response.read().decode('utf-8'))
            if data.get("routes"):
                r = data["routes"][0]
                leaflet_coords = [[pt[1], pt[0]] for pt in r["geometry"]["coordinates"]]
                res = {
                    "coordinates": leaflet_coords,
                    "distance_km": round(r["distance"] / 1000.0, 2),
                    "duration_minutes": max(5, round(r["duration"] / 60.0)),
                    "status": "ok"
                }
                _route_cache[cache_key] = res
                return JSONResponse(content=res)
    except Exception:
        pass

    # Fallback to direct coords
    fallback = {
        "coordinates": [[lat1, lng1], [lat2, lng2]],
        "distance_km": round((((lat2-lat1)**2 + (lng2-lng1)**2)**0.5) * 111 * 1.25, 1),
        "duration_minutes": 25,
        "status": "fallback"
    }
    return JSONResponse(content=fallback)


# ────────────────────── AI SMART HOSPITAL RECOMMENDER ──────────────────────

@app.get("/api/diagnoses")
async def get_diagnoses():
    """Return available ICD-10 diagnosis catalog for recommendation UI."""
    return JSONResponse(content=DIAGNOSIS_CATALOG)


@app.get("/api/recommend")
async def get_hospital_recommendation(clinic: str, icd: str):
    """
    AI Smart Recommendation: Suggest best hospital destinations for a patient from clinic with icd code.
    Considers:
    - Tier appropriateness (Tipe A, B, C, D)
    - Real road travel time
    - Facility anti-fraud integrity
    """
    analysis = _get_analysis()
    df = analysis[0]
    anomaly_edges = analysis[3]
    res = recommend_hospitals(clinic, icd, anomaly_edges, df)
    return JSONResponse(content=res)


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
    print("\n[AEGIS-JKN] Server Starting...")
    print(f"[AEGIS-JKN] Frontend path: {FRONTEND_DIR}")
    print(f"[AEGIS-JKN] Open browser at: http://localhost:8000\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
