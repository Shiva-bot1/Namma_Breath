import "./ExposureRing.css";

const RISK_COLORS = {
  good: "#7fa88e",
  moderate: "#f4a300",
  sensitive: "#f08a3c",
  unhealthy: "#e8543e",
  "very-unhealthy": "#b5302b",
  hazardous: "#7a1f1f",
};

/**
 * ExposureRing — the signature visual for Namma Breath.
 * A radial gauge that fills proportionally to the personal exposure score
 * (0-100+) and shifts color across the risk spectrum. Designed to be
 * glanceable: you shouldn't need to read a number to understand your risk.
 */
export default function ExposureRing({ score = 0, riskBand = "good", loading = false }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const color = RISK_COLORS[riskBand] || RISK_COLORS.good;

  return (
    <div className={`ring-wrap ${loading ? "ring-loading" : ""}`}>
      <svg viewBox="0 0 200 200" className="ring-svg">
        <circle cx="100" cy="100" r={radius} className="ring-track" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          className="ring-progress"
          style={{
            stroke: color,
            strokeDasharray: circumference,
            strokeDashoffset: loading ? circumference : offset,
          }}
        />
        {/* Breath-mark ticks around the ring, subtle structural detail */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
          const x1 = 100 + (radius + 10) * Math.cos(angle);
          const y1 = 100 + (radius + 10) * Math.sin(angle);
          const x2 = 100 + (radius + 14) * Math.cos(angle);
          const y2 = 100 + (radius + 14) * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="ring-tick" />;
        })}
      </svg>
      <div className="ring-center">
        <span className="ring-number">{loading ? "—" : Math.round(clamped)}</span>
        <span className="ring-label">exposure score</span>
      </div>
    </div>
  );
}
