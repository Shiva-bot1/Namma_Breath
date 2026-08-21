import "./AqiHeader.css";

const RISK_STYLES = {
  good: { bg: "#eaf6ef", fg: "#3d7a58" },
  moderate: { bg: "#fff4de", fg: "#a06b00" },
  sensitive: { bg: "#fdebdc", fg: "#b25a1a" },
  unhealthy: { bg: "#fbe4e0", fg: "#c23f2a" },
  "very-unhealthy": { bg: "#f6dcda", fg: "#96271f" },
  hazardous: { bg: "#efd6d6", fg: "#5e1414" },
};

export default function AqiHeader({ data, loading, stationLabel }) {
  const style = data ? RISK_STYLES[data.risk_band] || RISK_STYLES.good : RISK_STYLES.good;

  return (
    <div className="aqi-header">
      <div>
        <p className="aqi-header-eyebrow">Namma Breath · live corridor reading</p>
        <h2 className="aqi-header-station">{stationLabel || "Select a corridor"}</h2>
      </div>
      {data && !loading ? (
        <div className="aqi-badge" style={{ background: style.bg, color: style.fg }}>
          <span className="aqi-badge-number">{data.aqi}</span>
          <span className="aqi-badge-label">{data.risk_label}</span>
        </div>
      ) : (
        <div className="aqi-badge aqi-badge-loading">
          <span className="aqi-badge-number">—</span>
          <span className="aqi-badge-label">Loading…</span>
        </div>
      )}
    </div>
  );
}
