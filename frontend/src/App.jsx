import { useState, useEffect, useCallback } from "react";
import { getStations, getAqi, getTrend, getAdvice } from "./api/client";
import { UI_TEXT } from "./i18n";
import logoIcon from "./assets/logo-icon.png";
import AqiHeader from "./components/AqiHeader";
import ExposureRing from "./components/ExposureRing";
import StationSelector from "./components/StationSelector";
import CommuteControls from "./components/CommuteControls";
import AdviceCard from "./components/AdviceCard";
import TrendChart from "./components/TrendChart";
import LanguageToggle from "./components/LanguageToggle";
import TabNav from "./components/TabNav";
import CompareView from "./components/CompareView";
import HistoryView from "./components/HistoryView";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("advisor");
  const [lang, setLang] = useState("en");
  const text = UI_TEXT[lang];

  const [stations, setStations] = useState([]);
  const [stationId, setStationId] = useState(null);

  const [transport, setTransport] = useState("two-wheeler");
  const [mask, setMask] = useState("none");
  const [timeOfDay, setTimeOfDay] = useState("morning-peak");

  const [aqiData, setAqiData] = useState(null);
  const [aqiLoading, setAqiLoading] = useState(false);

  const [trendData, setTrendData] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);

  const [advice, setAdvice] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  const [connectionError, setConnectionError] = useState(false);

  // Load station list once on mount
  useEffect(() => {
    getStations()
      .then((data) => {
        setStations(data);
        if (data.length) setStationId(data[0].id);
      })
      .catch(() => setConnectionError(true));
  }, []);

  const refreshAqi = useCallback((id, language) => {
    setAqiLoading(true);
    getAqi(id, language)
      .then((data) => {
        setAqiData(data);
        setConnectionError(false);
      })
      .catch(() => setConnectionError(true))
      .finally(() => setAqiLoading(false));
  }, []);

  const refreshTrend = useCallback((id) => {
    setTrendLoading(true);
    getTrend(id)
      .then((data) => setTrendData(data.hours))
      .catch(() => {})
      .finally(() => setTrendLoading(false));
  }, []);

  const refreshAdvice = useCallback((id, t, m, tod, language) => {
    setAdviceLoading(true);
    getAdvice({ station_id: id, transport: t, mask: m, time_of_day: tod, lang: language })
      .then((data) => {
        setAdvice(data);
        setConnectionError(false);
      })
      .catch(() => setConnectionError(true))
      .finally(() => setAdviceLoading(false));
  }, []);

  // Whenever the station changes, refresh AQI + trend + advice
  useEffect(() => {
    if (!stationId) return;
    refreshAqi(stationId, lang);
    refreshTrend(stationId);
    refreshAdvice(stationId, transport, mask, timeOfDay, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId]);

  // Whenever commute inputs or language change, refresh AQI label + advice
  useEffect(() => {
    if (!stationId) return;
    refreshAqi(stationId, lang);
    refreshAdvice(stationId, transport, mask, timeOfDay, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transport, mask, timeOfDay, lang]);

  const handleControlsChange = ({ transport: t, mask: m, timeOfDay: tod }) => {
    if (t) setTransport(t);
    if (m) setMask(m);
    if (tod) setTimeOfDay(tod);
  };

  const selectedStation = stations.find((s) => s.id === stationId);

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-brand">
          <img src={logoIcon} alt="Namma Breath" className="app-brand-logo" />
          <span className="app-brand-name">Namma Breath</span>
        </div>
        <div className="app-topbar-right">
          <p className="app-tagline">{text.tagline}</p>
          <LanguageToggle lang={lang} onChange={setLang} />
        </div>
      </header>

      {connectionError && (
        <div className="app-banner-error">
          Can't reach the backend at <code>localhost:5000</code>. Make sure{" "}
          <code>python app.py</code> is running in the backend folder.
        </div>
      )}

      <TabNav active={tab} onChange={setTab} labels={text} />

      <main className="app-main">
        {tab === "advisor" && (
          <>
            <section className="hero-card">
              <AqiHeader
                data={aqiData}
                loading={aqiLoading}
                stationLabel={selectedStation?.name}
              />
              <div className="hero-ring-row">
                <ExposureRing
                  score={advice?.exposure_score ?? 0}
                  riskBand={advice?.risk_band ?? "good"}
                  loading={adviceLoading}
                />
                <p className="hero-ring-caption">{text.ringCaption}</p>
              </div>
            </section>

            <section className="layout-grid">
              <div className="layout-col">
                <div className="panel">
                  <StationSelector
                    stations={stations}
                    selected={stationId}
                    onSelect={setStationId}
                    title={text.corridorTitle}
                  />
                </div>
                <div className="panel">
                  <CommuteControls
                    transport={transport}
                    mask={mask}
                    timeOfDay={timeOfDay}
                    onChange={handleControlsChange}
                    sectionTitle={text.commuteTitle}
                    labels={{ transport: text.transport, mask: text.mask, timeOfDay: text.timeOfDay }}
                  />
                </div>
              </div>

              <div className="layout-col">
                <AdviceCard advice={advice} loading={adviceLoading} title={text.advisoryTitle} />
                <TrendChart hours={trendData} loading={trendLoading} />
              </div>
            </section>
          </>
        )}

        {tab === "compare" && stations.length > 0 && (
          <CompareView stations={stations} lang={lang} text={text} />
        )}

        {tab === "history" && <HistoryView text={text} />}
      </main>

      <footer className="app-footer">
        <p>{text.footer}</p>
      </footer>
    </div>
  );
}
