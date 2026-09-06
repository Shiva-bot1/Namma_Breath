import "./StationSelector.css";

export default function StationSelector({ stations, selected, onSelect, title = "01 — Your commute corridor" }) {
  return (
    <div className="station-selector">
      <h3 className="section-eyebrow">{title}</h3>
      <div className="station-grid">
        {stations.map((s) => (
          <button
            key={s.id}
            className={`station-chip ${selected === s.id ? "station-chip-active" : ""}`}
            onClick={() => onSelect(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
