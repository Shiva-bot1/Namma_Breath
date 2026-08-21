import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import "./TrendChart.css";

function formatHour(h) {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="trend-tooltip">
      <div className="trend-tooltip-time">{formatHour(label)}</div>
      <div className="trend-tooltip-aqi">AQI {payload[0].value}</div>
    </div>
  );
}

export default function TrendChart({ hours, loading }) {
  if (loading || !hours) {
    return <div className="trend-chart trend-chart-loading">Loading 24-hour pattern…</div>;
  }

  const currentHour = new Date().getHours();

  return (
    <div className="trend-chart">
      <h3 className="section-eyebrow">24-hour pattern for this corridor</h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={hours} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="aqiFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4a300" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f4a300" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="hour"
            tickFormatter={formatHour}
            interval={3}
            tick={{ fontSize: 11, fill: "#4a534f", fontFamily: "IBM Plex Mono" }}
            axisLine={{ stroke: "#d7e6e3" }}
            tickLine={false}
          />
          <YAxis hide domain={[0, "dataMax + 20"]} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={currentHour} stroke="#0b5d57" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="aqi"
            stroke="#f4a300"
            strokeWidth={2.5}
            fill="url(#aqiFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="trend-caption">
        Dashed line marks now. Peaks align with morning &amp; evening traffic congestion.
      </p>
    </div>
  );
}
