import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getHistory, clearHistory } from "../api/client";
import "./HistoryView.css";

function barColor(score) {
  if (score >= 75) return "#e8543e";
  if (score >= 45) return "#f4a300";
  return "#7fa88e";
}

function HistoryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="history-tooltip">
      <div className="history-tooltip-day">{d.day}</div>
      <div>avg {d.avg_exposure} · {d.count} checks</div>
    </div>
  );
}

export default function HistoryView({ text }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getHistory(7)
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleClear = () => {
    clearHistory().then(load);
  };

  if (loading) {
    return <div className="history-loading">Loading history…</div>;
  }

  const hasData = data?.daily?.length > 0;

  return (
    <div className="history-view">
      <p className="history-intro">{text.historyIntro}</p>

      {!hasData ? (
        <div className="history-empty">{text.historyEmpty}</div>
      ) : (
        <>
          <div className="panel">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.daily} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#4a534f", fontFamily: "IBM Plex Mono" }}
                  tickFormatter={(d) => d.slice(5)}
                  axisLine={{ stroke: "#d7e6e3" }}
                  tickLine={false}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip content={<HistoryTooltip />} />
                <Bar dataKey="avg_exposure" radius={[6, 6, 0, 0]}>
                  {data.daily.map((d, i) => (
                    <Cell key={i} fill={barColor(d.avg_exposure)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="history-entries">
            {data.entries.slice(0, 8).map((e) => (
              <div key={e.id} className="history-entry">
                <span className="history-entry-station">{e.station_name}</span>
                <span className="history-entry-meta">
                  {e.transport} · {e.mask} · AQI {e.aqi}
                </span>
                <span
                  className="history-entry-score"
                  style={{ color: barColor(e.exposure_score) }}
                >
                  {e.exposure_score}
                </span>
              </div>
            ))}
          </div>

          <button className="history-clear-btn" onClick={handleClear} type="button">
            {text.historyClear}
          </button>
        </>
      )}
    </div>
  );
}
