import { useState, useEffect, useCallback } from "react";
import { getAdvice } from "../api/client";
import ExposureRing from "./ExposureRing";
import CommuteControls from "./CommuteControls";
import "./CompareView.css";

function RouteResult({ label, advice, loading, stationName }) {
  return (
    <div className="compare-card">
      <p className="compare-card-label">{label}</p>
      <h4 className="compare-card-station">{stationName || "—"}</h4>
      <ExposureRing
        score={advice?.exposure_score ?? 0}
        riskBand={advice?.risk_band ?? "good"}
        loading={loading}
      />
      {advice && !loading && (
        <div className="compare-card-detail">
          <span className="compare-card-aqi">AQI {advice.aqi}</span>
          <span className="compare-card-risk">{advice.risk_label}</span>
        </div>
      )}
    </div>
  );
}

export default function CompareView({ stations, lang, text }) {
  const [stationA, setStationA] = useState(stations[0]?.id);
  const [stationB, setStationB] = useState(stations[1]?.id);
  const [transport, setTransport] = useState("two-wheeler");
  const [mask, setMask] = useState("none");
  const [timeOfDay, setTimeOfDay] = useState("morning-peak");

  const [adviceA, setAdviceA] = useState(null);
  const [adviceB, setAdviceB] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!stationA || !stationB) return;
    setLoading(true);
    Promise.all([
      getAdvice({ station_id: stationA, transport, mask, time_of_day: timeOfDay, lang, skip_log: true }),
      getAdvice({ station_id: stationB, transport, mask, time_of_day: timeOfDay, lang, skip_log: true }),
    ])
      .then(([a, b]) => {
        setAdviceA(a);
        setAdviceB(b);
      })
      .finally(() => setLoading(false));
  }, [stationA, stationB, transport, mask, timeOfDay, lang]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const diff =
    adviceA && adviceB ? Math.abs(adviceA.exposure_score - adviceB.exposure_score).toFixed(1) : null;
  const betterRoute =
    adviceA && adviceB
      ? adviceA.exposure_score < adviceB.exposure_score
        ? adviceA.station_name
        : adviceB.station_name
      : null;

  return (
    <div className="compare-view">
      <p className="compare-intro">{text.compareIntro}</p>

      <div className="compare-selectors">
        <select className="compare-select" value={stationA} onChange={(e) => setStationA(e.target.value)}>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <span className="compare-vs">vs</span>
        <select className="compare-select" value={stationB} onChange={(e) => setStationB(e.target.value)}>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="panel">
        <CommuteControls
          transport={transport}
          mask={mask}
          timeOfDay={timeOfDay}
          sectionTitle={text.commuteTitle}
          labels={{ transport: text.transport, mask: text.mask, timeOfDay: text.timeOfDay }}
          onChange={({ transport: t, mask: m, timeOfDay: tod }) => {
            if (t) setTransport(t);
            if (m) setMask(m);
            if (tod) setTimeOfDay(tod);
          }}
        />
      </div>

      <div className="compare-results">
        <RouteResult
          label={text.compareRouteA}
          advice={adviceA}
          loading={loading}
          stationName={stations.find((s) => s.id === stationA)?.name}
        />
        <RouteResult
          label={text.compareRouteB}
          advice={adviceB}
          loading={loading}
          stationName={stations.find((s) => s.id === stationB)?.name}
        />
      </div>

      {diff && !loading && (
        <div className="compare-verdict">
          <strong>{betterRoute}</strong> has {text.compareWinner} — a difference of{" "}
          <strong>{diff} points</strong> under these commute conditions.
        </div>
      )}
    </div>
  );
}
