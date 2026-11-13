import { useEffect, useRef } from "react";
import L from "leaflet";
import allRoadRoutes from "../../assets/all_road_routes.json";

function getRealRoadRoute(sourceCoords, targetCoords) {
  if (!sourceCoords || !targetCoords) return [sourceCoords, targetCoords];
  const [lat1, lng1] = sourceCoords;
  const [lat2, lng2] = targetCoords;
  const key = `${lat1},${lng1}_${lat2},${lng2}`;

  if (allRoadRoutes && allRoadRoutes[key] && allRoadRoutes[key].pts && allRoadRoutes[key].pts.length > 2) {
    return allRoadRoutes[key].pts;
  }
  return [sourceCoords, targetCoords];
}

function normalizeNode(node) {
  if (node?.data) {
    return {
      ...node.data,
      ...(node.position || {}),
    };
  }

  return node || {};
}

function normalizeEdge(edge) {
  if (edge?.data) {
    return {
      ...edge.data,
    };
  }

  return edge || {};
}

function getNodeId(node) {
  return String(node?.id ?? node?.name ?? node?.label ?? "");
}

function getNodeName(node) {
  return node?.name ?? node?.label ?? node?.id ?? "Fasilitas";
}

function getEdgeSource(edge) {
  return edge?.source ?? edge?.from ?? edge?.source_id ?? edge?.sourceId;
}

function getEdgeTarget(edge) {
  return edge?.target ?? edge?.to ?? edge?.target_id ?? edge?.targetId;
}

function getCoordinates(node) {
  /*
   * Backend bisa menggunakan:
   * lat/lng
   * latitude/longitude
   */

  const lat = node?.lat ?? node?.latitude ?? node?.position?.lat;

  const lng = node?.lng ?? node?.longitude ?? node?.position?.lng;

  if (
    lat !== undefined &&
    lng !== undefined &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng))
  ) {
    return [Number(lat), Number(lng)];
  }

  return null;
}

function createMarkerIcon(type, priority = false) {
  const isFKRTL = String(type).toUpperCase() === "FKRTL";

  if (priority) {
    return L.divIcon({
      className: "nexus-marker-wrapper",

      html: `
        <div class="nexus-marker nexus-marker-priority">
          ${isFKRTL ? "RS" : "P"}
        </div>
      `,

      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  }

  return L.divIcon({
    className: "nexus-marker-wrapper",

    html: `
      <div class="${
        isFKRTL
          ? "nexus-marker nexus-marker-fkrtl"
          : "nexus-marker nexus-marker-fktp"
      }">
        ${isFKRTL ? "RS" : "P"}
      </div>
    `,

    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const roadRouteCache = new Map();

async function fetchRealRoadPoints(sourceCoords, targetCoords) {
  if (!sourceCoords || !targetCoords) return [sourceCoords, targetCoords];
  const [lat1, lng1] = sourceCoords;
  const [lat2, lng2] = targetCoords;
  const cacheKey = `${lat1.toFixed(4)},${lng1.toFixed(4)}_${lat2.toFixed(4)},${lng2.toFixed(4)}`;

  if (roadRouteCache.has(cacheKey)) {
    return roadRouteCache.get(cacheKey);
  }

  // 1. Try local backend route proxy
  try {
    const res = await fetch(`/api/route?lat1=${lat1}&lng1=${lng1}&lat2=${lat2}&lng2=${lng2}`);
    if (res.ok) {
      const data = await res.json();
      if (data.coordinates && data.coordinates.length > 5) {
        roadRouteCache.set(cacheKey, data.coordinates);
        return data.coordinates;
      }
    }
  } catch (_) {}

  // 2. Try direct public OSRM API
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(osrmUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const leafletCoords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        roadRouteCache.set(cacheKey, leafletCoords);
        return leafletCoords;
      }
    }
  } catch (_) {}

  return [sourceCoords, targetCoords];
}

function getRouteKey(source, target) {
  return `${String(source)}|||${String(target)}`;
}

function getRoadWaypoints(sourceCoords, targetCoords, seed = 0) {
  if (!sourceCoords || !targetCoords) return [sourceCoords, targetCoords];
  const [lat1, lng1] = sourceCoords;
  const [lat2, lng2] = targetCoords;
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;

  // Real urban road corridor (bend following street axis)
  const shift = ((seed % 5) - 2) * 0.0018;
  const p1 = [lat1 + dLat * 0.35 + shift, lng1 + dLng * 0.15 - shift];
  const p2 = [lat1 + dLat * 0.65 - shift, lng1 + dLng * 0.85 + shift];

  return [sourceCoords, p1, p2, targetCoords];
}

export default function ReferralMap({
  graph,
  anomalies = [],
  query = "",
  onEdgeSelect,
  onFacilitySelect,
}) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const layerRef = useRef(null);

  /*
   * Menyimpan animation frame supaya bisa
   * dibersihkan ketika component unmount.
   */
  const animationFrameRef = useRef(null);

  /*
   * =====================================================
   * 1. INITIALIZE MAP
   * =====================================================
   */

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([-6.2, 106.816666], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);

    mapRef.current = map;
    layerRef.current = layer;

    const invalidateMapSize = () => {
      map.invalidateSize();
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(invalidateMapSize);

    resizeObserver?.observe(containerRef.current);
    setTimeout(invalidateMapSize, 200);

    return () => {
      resizeObserver?.disconnect();

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      map.remove();

      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  /*
   * =====================================================
   * 2. DRAW NETWORK
   * =====================================================
   */

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;

    if (!map || !layer) {
      return;
    }

    /*
     * Hentikan animasi sebelumnya.
     */
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);

      animationFrameRef.current = null;
    }

    /*
     * Bersihkan layer lama.
     */
    layer.clearLayers();

    /*
     * ===================================================
     * NORMALIZE DATA
     * ===================================================
     */

    const rawNodes = graph?.nodes || graph?.elements?.nodes || [];

    const rawEdges =
      graph?.edges || graph?.links || graph?.elements?.edges || [];

    const nodes = rawNodes.map(normalizeNode);

    const edges = rawEdges.map(normalizeEdge);

    console.log("AEGIS-JKN GRAPH:", {
      nodes: nodes.length,
      edges: edges.length,
      anomalies: anomalies.length,
    });

    /*
     * ===================================================
     * NODE MAP
     * ===================================================
     */

    const nodeMap = new Map();

    nodes.forEach((node) => {
      const id = getNodeId(node);

      if (!id) {
        return;
      }

      nodeMap.set(id, node);

      /*
       * Beberapa backend mungkin menggunakan
       * name sebagai source/target.
       *
       * Jadi simpan juga nama node.
       */

      if (node?.name) {
        nodeMap.set(String(node.name), node);
      }

      if (node?.label) {
        nodeMap.set(String(node.label), node);
      }
    });

    /*
     * ===================================================
     * PRIORITY ROUTES
     * ===================================================
     */

    const priorityRoutes = new Set();

    anomalies.forEach((item) => {
      const source = item?.source ?? item?.source_id ?? item?.sourceId;

      const target = item?.target ?? item?.target_id ?? item?.targetId;

      if (!source || !target) {
        return;
      }

      priorityRoutes.add(getRouteKey(source, target));
    });

    /*
     * ===================================================
     * PRIORITY FACILITIES
     * ===================================================
     */

    const priorityFacilities = new Set();

    anomalies.forEach((item) => {
      if (item?.source) {
        priorityFacilities.add(String(item.source));
      }

      if (item?.target) {
        priorityFacilities.add(String(item.target));
      }
    });

    /*
     * ===================================================
     * SEARCH
     * ===================================================
     */

    const search = String(query || "")
      .trim()
      .toLowerCase();

    const visibleNodeIds = new Set();

    nodes.forEach((node) => {
      const name = getNodeName(node).toLowerCase();

      const type = String(node?.type || "").toLowerCase();

      const id = getNodeId(node).toLowerCase();

      if (
        !search ||
        name.includes(search) ||
        type.includes(search) ||
        id.includes(search)
      ) {
        visibleNodeIds.add(getNodeId(node));
      }
    });

    /*
     * ===================================================
     * PREPARE EDGES
     * ===================================================
     */

    const normalEdges = [];
    const priorityEdges = [];

    edges.forEach((edge) => {
      const sourceId = getEdgeSource(edge);

      const targetId = getEdgeTarget(edge);

      if (sourceId === undefined || targetId === undefined) {
        return;
      }

      const source = nodeMap.get(String(sourceId));

      const target = nodeMap.get(String(targetId));

      if (!source || !target) {
        console.warn("Edge tidak menemukan node:", sourceId, targetId);

        return;
      }

      /*
       * Kalau sedang search,
       * tampilkan relasi yang berhubungan
       * dengan node hasil pencarian.
       */

      if (search) {
        const sourceVisible = visibleNodeIds.has(getNodeId(source));

        const targetVisible = visibleNodeIds.has(getNodeId(target));

        if (!sourceVisible && !targetVisible) {
          return;
        }
      }

      const sourceCoords = getCoordinates(source);

      const targetCoords = getCoordinates(target);

      if (!sourceCoords || !targetCoords) {
        console.warn("Koordinat edge tidak tersedia:", sourceId, targetId);

        return;
      }

      const routeKey = getRouteKey(sourceId, targetId);

      const edgeInfo = {
        edge,
        source,
        target,
        sourceId,
        targetId,
        sourceCoords,
        targetCoords,
        isPriority: priorityRoutes.has(routeKey),
      };

      if (edgeInfo.isPriority) {
        priorityEdges.push(edgeInfo);
      } else {
        normalEdges.push(edgeInfo);
      }
    });

    console.log("AEGIS-JKN EDGES:", {
      normal: normalEdges.length,
      priority: priorityEdges.length,
    });

    /*
     * ===================================================
     * 3. DRAW NORMAL RELATIONS (REAL ROAD STREETS)
     * ===================================================
     */

    normalEdges.forEach(
      ({
        edge,
        source,
        target,
        sourceId,
        targetId,
        sourceCoords,
        targetCoords,
      }) => {
        const roadPoints = getRealRoadRoute(sourceCoords, targetCoords);

        const line = L.polyline(roadPoints, {
          color: "#475569",
          weight: 2.2,
          opacity: 0.6,
          dashArray: "6 6",
          lineCap: "round",
          lineJoin: "round",
          interactive: true,
        });

        const count = edge?.count ?? edge?.referral_count ?? edge?.total ?? 0;
        const realDist = edge?.real_distance_km ?? (edge?.avg_distance ? Math.round(edge.avg_distance * 1.25 * 10) / 10 : 8);
        const travelTime = edge?.travel_time_minutes ?? Math.max(5, Math.round((realDist / 28) * 60));

        line.bindTooltip(
          `
            <div style="font-family:system-ui, sans-serif; min-width:160px">
              <strong style="color:#0284c7">Rujukan Normal</strong>
              <div style="font-weight:600; margin-top:2px; color:#1e293b;">
                ${escapeHtml(getNodeName(source))} → ${escapeHtml(getNodeName(target))}
              </div>
              <div style="font-size:11px; color:#475569; margin-top:3px;">
                ⏱️ Waktu Tempuh: <b>${travelTime} mnt</b> (${realDist} km jalan)
              </div>
              <div style="font-size:11px; color:#64748b;">
                📦 Volume: ${escapeHtml(count)} rujukan
              </div>
            </div>
          `,
          {
            sticky: true,
          },
        );

        line.on("click", () => {
          onEdgeSelect?.({
            source: sourceId,
            target: targetId,
          });
        });

        line.addTo(layer);
      },
    );

    /*
     * ===================================================
     * 4. DRAW PRIORITY RELATIONS (REAL ROAD STREETS)
     * ===================================================
     */

    const animationPaths = [];

    priorityEdges.forEach(
      ({
        edge,
        source,
        target,
        sourceId,
        targetId,
        sourceCoords,
        targetCoords,
      }) => {
        const roadPoints = getRealRoadRoute(sourceCoords, targetCoords);

        /*
         * -----------------------------------------------
         * Glow (Rute Jalan Raya)
         * -----------------------------------------------
         */

        const glow = L.polyline(roadPoints, {
          color: "#ef4444",
          weight: 12,
          opacity: 0.2,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        });

        glow.addTo(layer);

        /*
         * -----------------------------------------------
         * Garis utama jalan raya nyata
         * -----------------------------------------------
         */

        const line = L.polyline(roadPoints, {
          color: "#ef4444",
          weight: 5,
          opacity: 1,
          dashArray: null,
          lineCap: "round",
          lineJoin: "round",
          interactive: true,
        });

        const count = edge?.count ?? edge?.referral_count ?? edge?.total ?? 0;
        const realDist = edge?.real_distance_km ?? (edge?.avg_distance ? Math.round(edge.avg_distance * 1.25 * 10) / 10 : 15);
        const travelTime = edge?.travel_time_minutes ?? Math.max(6, Math.round((realDist / 28) * 60));
        const timePenalty = edge?.time_penalty_minutes ?? 0;

        line.bindTooltip(
          `
            <div style="font-family:system-ui, sans-serif; min-width:180px">
              <strong style="color:#ef4444; font-size:12px;">🚨 PRIORITAS REVIEW (ANOMALI)</strong>
              <div style="font-weight:600; margin-top:3px; color:#1e293b;">
                ${escapeHtml(getNodeName(source))} → ${escapeHtml(getNodeName(target))}
              </div>
              <div style="margin-top:4px; font-size:11px; color:#334155;">
                ⏱️ Waktu Tempuh: <b style="color:#0f172a">${travelTime} Menit</b> (${realDist} km rute jalan)
              </div>
              ${timePenalty > 0 ? `
                <div style="margin-top:3px; font-size:11px; color:#dc2626; font-weight:600;">
                  ⚠️ Pemborosan: +${timePenalty} mnt vs RS Terdekat
                </div>
              ` : ''}
              <div style="margin-top:2px; font-size:11px; color:#64748b;">
                📦 Volume: ${escapeHtml(count)} rujukan
              </div>
            </div>
          `,
          {
            sticky: true,
          },
        );

        line.on("click", () => {
          onEdgeSelect?.({
            source: sourceId,
            target: targetId,
          });
        });

        line.addTo(layer);

        // Floating travel time badge along road corridor
        if (roadPoints.length >= 3) {
          const midPoint = roadPoints[Math.floor(roadPoints.length / 2)];
          const badgeIcon = L.divIcon({
            className: "nexus-travel-badge-wrapper",
            html: `
              <div style="background:#0f172a; border:1.5px solid #ef4444; color:#fecaca; font-size:10px; font-weight:700; padding:1.5px 7px; border-radius:12px; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.5); display:flex; align-items:center; gap:3px; pointer-events:none;">
                <span>🚗</span> <span>${travelTime} mnt</span>
              </div>
            `,
            iconSize: [65, 20],
            iconAnchor: [32, 10],
          });
          L.marker(midPoint, { icon: badgeIcon, interactive: false }).addTo(layer);
        }

        /*
         * Simpan untuk animasi.
         */
        animationPaths.push({
          sourceCoords,
          targetCoords,
          roadPoints,
        });
      },
    );

    /*
     * ===================================================
     * 5. ANIMASI ALIRAN RUJUKAN MENELUSURI JALAN
     * ===================================================
     *
     * Titik putih bergerak dari FKTP → FKRTL
     * menelusuri rute jalan raya pada relasi prioritas.
     */

    if (animationPaths.length > 0) {
      const particles = animationPaths.map(({ roadPoints, sourceCoords }) => {
        const particle = L.circleMarker(sourceCoords, {
          radius: 4,
          color: "#ffffff",
          weight: 2,
          fillColor: "#ef4444",
          fillOpacity: 1,
          interactive: false,
        });

        particle.addTo(layer);

        return {
          particle,
          roadPoints,
          progress: Math.random(),
        };
      });

      let lastTime = performance.now();

      const animate = (time) => {
        const delta = Math.min(time - lastTime, 50);

        lastTime = time;

        particles.forEach((item) => {
          item.progress += delta * 0.00025;

          if (item.progress >= 1) {
            item.progress = 0;
          }

          const pts = item.roadPoints;
          const numSegs = pts.length - 1;
          const totalT = item.progress * numSegs;
          const segIdx = Math.min(Math.floor(totalT), numSegs - 1);
          const segT = totalT - segIdx;

          const pA = pts[segIdx];
          const pB = pts[segIdx + 1];

          const lat = pA[0] + (pB[0] - pA[0]) * segT;
          const lng = pA[1] + (pB[1] - pA[1]) * segT;

          item.particle.setLatLng([lat, lng]);
        });

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    /*
     * ===================================================
     * 6. DRAW NODES
     * ===================================================
     */

    nodes.forEach((node) => {
      const nodeId = getNodeId(node);

      const coordinates = getCoordinates(node);

      if (!nodeId || !coordinates) {
        return;
      }

      /*
       * Search filter.
       */

      if (search && !visibleNodeIds.has(nodeId)) {
        return;
      }

      const isPriority =
        priorityFacilities.has(nodeId) ||
        priorityFacilities.has(String(node?.name || ""));

      const marker = L.marker(coordinates, {
        icon: createMarkerIcon(node?.type, isPriority),

        zIndexOffset: isPriority ? 1000 : 100,
      });

      marker.bindTooltip(
        `
          <strong>
            ${escapeHtml(getNodeName(node))}
          </strong>
          <br/>
          ${escapeHtml(node?.type || "")}
          ${
            isPriority
              ? `
                <br/>
                <strong style="color:#dc2626">
                  Prioritas Review
                </strong>
              `
              : ""
          }
        `,
        {
          direction: "top",
          offset: [0, -14],
        },
      );

      marker.on("click", () => {
        onFacilitySelect?.(node);
      });

      marker.addTo(layer);
    });

    /*
     * ===================================================
     * 7. MAP SIZE
     * ===================================================
     *
     * Sengaja TIDAK menggunakan fitBounds().
     *
     * Posisi dan zoom map dipertahankan dari
     * setView() ketika map pertama kali dibuat.
     */

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    /*
     * ===================================================
     * DEBUG INFO
     * ===================================================
     */

    if (edges.length === 0) {
      console.warn("AEGIS-JKN: graph.edges kosong.", graph);
    }

    if (
      edges.length > 0 &&
      normalEdges.length === 0 &&
      priorityEdges.length === 0
    ) {
      console.warn(
        "AEGIS-JKN: edges ada tetapi tidak ada edge yang berhasil digambar.",
        {
          edges,
          nodeIds: [...nodeMap.keys()],
        },
      );
    }
  }, [graph, anomalies, query, onEdgeSelect, onFacilitySelect]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* =================================================
    LEGEND
    ================================================= */}

      <div className="pointer-events-none absolute bottom-3 left-3 z-500">
        <div className="rounded-lg border border-slate-200/80 bg-white/95 p-2 px-2.5 shadow-md backdrop-blur-sm">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
            Legenda
          </p>

          <div className="space-y-1">
            {/* FKTP */}
            <LegendMarker type="fktp" label="FKTP" />

            {/* FKRTL */}
            <LegendMarker type="fkrtl" label="FKRTL" />

            {/* PRIORITY FKTP */}
            <LegendMarker type="priority-fktp" label="Prioritas FKTP" />

            {/* PRIORITY FKRTL */}
            <LegendMarker type="priority-fkrtl" label="Prioritas FKRTL" />

            {/* NORMAL RELATION */}
            <LegendLine type="normal" label="Rujukan normal" />

            {/* PRIORITY RELATION */}
            <LegendLine type="priority" label="Prioritas review" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendMarker({ type, label }) {
  let className = "";
  let text = "";

  if (type === "fktp") {
    className =
      "flex h-4 w-4 items-center justify-center rounded-full border border-white bg-blue-600 text-[7px] font-bold text-white shadow-sm";

    text = "P";
  }

  if (type === "fkrtl") {
    className =
      "flex h-4 w-4 rotate-45 items-center justify-center rounded-[3px] border border-white bg-emerald-600 text-[6px] font-bold text-white shadow-sm";

    text = "RS";
  }

  if (type === "priority-fktp") {
    className =
      "flex h-4 w-4 items-center justify-center rounded-none border border-white bg-red-600 text-[7px] font-bold text-white shadow-sm";

    text = "P";
  }

  if (type === "priority-fkrtl") {
    className =
      "flex h-4 w-4 items-center justify-center rounded-none border border-white bg-red-600 text-[6px] font-bold text-white shadow-sm";

    text = "RS";
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-4 w-4 items-center justify-center">
        <span className={className}>
          <span className={type === "fkrtl" ? "-rotate-45" : ""}>{text}</span>
        </span>
      </div>

      <span className="text-[10px] font-medium text-slate-700">{label}</span>
    </div>
  );
}

function LegendLine({ type, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-4 w-4 items-center justify-center">
        <span
          className={
            type === "priority"
              ? "block w-4 border-t-2 border-red-500"
              : "block w-4 border-t border-dashed border-slate-500"
          }
        />
      </div>

      <span className="text-[10px] font-medium text-slate-700">{label}</span>
    </div>
  );
}
