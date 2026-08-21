import "./AdviceCard.css";

export default function AdviceCard({ advice, loading, title = "03 — Your advisory" }) {
  if (loading) {
    return (
      <div className="advice-card advice-loading">
        <div className="skeleton-line skeleton-wide" />
        <div className="skeleton-line" />
        <div className="skeleton-line skeleton-short" />
      </div>
    );
  }

  if (!advice) {
    return (
      <div className="advice-card advice-empty">
        Pick a corridor and your commute details to get a personalized read on today's exposure.
      </div>
    );
  }

  return (
    <div className="advice-card">
      <h3 className="section-eyebrow">{title}</h3>
      <p className="advice-headline">{advice.llm_summary || advice.headline}</p>

      <ul className="advice-tips">
        {advice.tips.map((tip, i) => (
          <li key={i} className="advice-tip">
            <span className="tip-marker" />
            {tip}
          </li>
        ))}
      </ul>

      <div className="advice-meta">
        <span>
          AQI <strong>{advice.aqi}</strong> · {advice.risk_label}
        </span>
        <span className={`data-badge data-badge-${advice.data_source}`}>
          {advice.data_source === "live" ? "● live data" : "○ mock data"}
        </span>
      </div>
    </div>
  );
}
