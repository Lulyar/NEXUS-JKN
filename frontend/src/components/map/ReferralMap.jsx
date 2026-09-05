import { useEffect, useRef } from "react";
import L from "leaflet";

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

function getRouteKey(source, target) {
  return `${String(source)}|||${String(target)}`;
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

    console.log("NEXUS-JKN GRAPH:", {
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

    console.log("NEXUS-JKN EDGES:", {
      normal: normalEdges.length,
      priority: priorityEdges.length,
    });

    /*
     * ===================================================
     * 3. DRAW NORMAL RELATIONS
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
        const line = L.polyline([sourceCoords, targetCoords], {
          color: "#475569",

          /*
           * Lebih terlihat daripada sebelumnya.
           */
          weight: 2,

          opacity: 0.55,

          dashArray: "7 8",

          lineCap: "round",
          lineJoin: "round",

          interactive: true,
        });

        const count = edge?.count ?? edge?.referral_count ?? edge?.total ?? 0;

        line.bindTooltip(
          `
            <strong>Rujukan Normal</strong>
            <br/>
            ${escapeHtml(getNodeName(source))}
            →
            ${escapeHtml(getNodeName(target))}
            <br/>
            ${escapeHtml(count)}
            rujukan
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
     * 4. DRAW PRIORITY RELATIONS
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
        /*
         * -----------------------------------------------
         * Glow
         * -----------------------------------------------
         */

        const glow = L.polyline([sourceCoords, targetCoords], {
          color: "#ef4444",
          weight: 12,
          opacity: 0.16,
          lineCap: "round",
          interactive: false,
        });

        glow.addTo(layer);

        /*
         * -----------------------------------------------
         * Garis utama
         * -----------------------------------------------
         */

        const line = L.polyline([sourceCoords, targetCoords], {
          color: "#ef4444",
          weight: 5,
          opacity: 1,

          /*
           * Garis solid agar jelas.
           */
          dashArray: null,

          lineCap: "round",
          lineJoin: "round",

          interactive: true,
        });

        const count = edge?.count ?? edge?.referral_count ?? edge?.total ?? 0;

        line.bindTooltip(
          `
            <strong style="color:#dc2626">
              PRIORITAS REVIEW
            </strong>
            <br/>
            ${escapeHtml(getNodeName(source))}
            →
            ${escapeHtml(getNodeName(target))}
            <br/>
            ${escapeHtml(count)}
            rujukan
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

        /*
         * Simpan untuk animasi.
         */

        animationPaths.push({
          sourceCoords,
          targetCoords,
        });
      },
    );

    /*
     * ===================================================
     * 5. ANIMASI ALIRAN RUJUKAN
     * ===================================================
     *
     * Titik putih bergerak dari FKTP → FKRTL
     * pada relasi prioritas.
     */

    if (animationPaths.length > 0) {
      const particles = animationPaths.map(({ sourceCoords, targetCoords }) => {
        const particle = L.circleMarker(sourceCoords, {
          radius: 4,
          color: "#ffffff",
          weight: 2,
          fillColor: "#ef4444",
          fillOpacity: 1,

          /*
           * Supaya berada di atas garis.
           */
          interactive: false,
        });

        particle.addTo(layer);

        return {
          particle,
          sourceCoords,
          targetCoords,

          /*
           * Posisi awal random
           * supaya beberapa garis tidak
           * bergerak bersamaan.
           */
          progress: Math.random(),
        };
      });

      let lastTime = performance.now();

      const animate = (time) => {
        const delta = Math.min(time - lastTime, 50);

        lastTime = time;

        particles.forEach((item) => {
          /*
           * Kecepatan animasi.
           */

          item.progress += delta * 0.00025;

          if (item.progress >= 1) {
            item.progress = 0;
          }

          const lat =
            item.sourceCoords[0] +
            (item.targetCoords[0] - item.sourceCoords[0]) * item.progress;

          const lng =
            item.sourceCoords[1] +
            (item.targetCoords[1] - item.sourceCoords[1]) * item.progress;

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
      console.warn("NEXUS-JKN: graph.edges kosong.", graph);
    }

    if (
      edges.length > 0 &&
      normalEdges.length === 0 &&
      priorityEdges.length === 0
    ) {
      console.warn(
        "NEXUS-JKN: edges ada tetapi tidak ada edge yang berhasil digambar.",
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

      <div className="pointer-events-none absolute bottom-3 left-3 z-[500]">
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
              ? "block w-4 border-t-[2px] border-red-500"
              : "block w-4 border-t border-dashed border-slate-500"
          }
        />
      </div>

      <span className="text-[10px] font-medium text-slate-700">{label}</span>
    </div>
  );
}
