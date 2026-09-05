export default function MapLegend() {
  return (
    <div className="nexus-map-legend">
      <div className="nexus-map-legend-title">Legenda Jaringan</div>

      <div className="nexus-map-legend-item">
        <span className="nexus-map-legend-dot nexus-map-legend-dot-fktp" />
        <span>FKTP</span>
      </div>

      <div className="nexus-map-legend-item">
        <span className="nexus-map-legend-dot nexus-map-legend-dot-fkrtl" />
        <span>FKRTL</span>
      </div>

      <div className="nexus-map-legend-item">
        <span className="nexus-map-legend-line" />
        <span>Relasi rujukan</span>
      </div>

      <div className="nexus-map-legend-item">
        <span className="nexus-map-legend-line-risk" />
        <span>Prioritas pemeriksaan</span>
      </div>

      <div className="nexus-map-legend-item">
        <span className="nexus-map-legend-dot nexus-map-legend-dot-risk" />
        <span>Faskes berisiko tinggi</span>
      </div>
    </div>
  );
}
