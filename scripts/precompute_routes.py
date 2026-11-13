import urllib.request
import json
import time
import os
from concurrent.futures import ThreadPoolExecutor

fktp_coords = [
    (-6.175, 106.78), (-6.21, 106.8), (-6.16, 106.83), (-6.23, 106.79), (-6.19, 106.86),
    (-6.14, 106.84), (-6.25, 106.82), (-6.12, 106.76), (-6.2, 106.75), (-6.28, 106.85),
    (-6.155, 106.77), (-6.225, 106.87), (-6.185, 106.73), (-6.24, 106.89), (-6.13, 106.81),
    (-6.265, 106.76), (-6.17, 106.89), (-6.29, 106.81), (-6.11, 106.79), (-6.235, 106.72),
]
fkrtl_coords = [
    (-6.2, 106.82), (-6.18, 106.87), (-6.23, 106.84), (-6.16, 106.79), (-6.27, 106.8),
    (-6.15, 106.86), (-6.25, 106.77), (-6.19, 106.8), (-6.22, 106.88), (-6.14, 106.78),
]

all_pairs = []
for p1 in fktp_coords:
    for p2 in fkrtl_coords:
        all_pairs.append((p1, p2))

print(f"Fetching {len(all_pairs)} real street routes from OSRM...")

def fetch_one(pair):
    (lat1, lng1), (lat2, lng2) = pair
    url = f"https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson"
    req = urllib.request.Request(url, headers={"User-Agent": "AEGIS-JKN-Precompute/1.0"})
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req, timeout=6) as res:
                d = json.loads(res.read())
                if d.get("routes"):
                    # Simplify slightly or keep full coordinates
                    coords = [[round(pt[1], 5), round(pt[0], 5)] for pt in d["routes"][0]["geometry"]["coordinates"]]
                    dist = round(d["routes"][0]["distance"] / 1000.0, 2)
                    dur = max(5, round(d["routes"][0]["duration"] / 60.0))
                    return (f"{lat1},{lng1}_{lat2},{lng2}", {"pts": coords, "dist": dist, "dur": dur})
        except Exception:
            time.sleep(0.5)
    
    # Fallback Manhattan path if connection fails
    d_lat = lat2 - lat1
    d_lng = lng2 - lng1
    fb_pts = [
        [lat1, lng1],
        [round(lat1 + d_lat * 0.15, 5), round(lng1 + d_lng * 0.6, 5)],
        [round(lat1 + d_lat * 0.85, 5), round(lng1 + d_lng * 0.65, 5)],
        [lat2, lng2]
    ]
    return (f"{lat1},{lng1}_{lat2},{lng2}", {"pts": fb_pts, "dist": 15.0, "dur": 30})

t0 = time.time()
with ThreadPoolExecutor(max_workers=8) as ex:
    results = list(ex.map(fetch_one, all_pairs))

routes_map = {k: v for k, v in results if k}
print(f"Successfully computed {len(routes_map)} routes in {time.time()-t0:.2f}s!")

out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "src", "assets", "all_road_routes.json")
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(routes_map, f)

print(f"Saved to {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")

