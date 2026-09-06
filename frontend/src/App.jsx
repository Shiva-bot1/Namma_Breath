import { useState, useEffect, useCallback, useRef } from "react";
import { getStations, getAqi, getTrend, getAdvice, IS_DEPLOYED } from "./api/client";
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
import AboutView from "./components/AboutView";
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

  const [connectionStatus, setConnectionStatus] = useState("connecting"); // "connecting" | "connected" | "error"
  const [showConnectingBanner, setShowConnectingBanner] = useState(false);
  const failCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // Attempts to load the station list, retrying quietly in the background
  // with increasing delays instead of immediately showing an error. This
  // matters most right after a fresh deploy — Render's free tier can take
  // 20-30s to wake up from an idle sleep, and that's normal, not a bug.
  const connectWithRetry = useCallback((attempt = 0) => {
    getStations()
      .then((data) => {
        if (!mountedRef.current) return;
        setStations(data);
        if (data.length) setStationId((prev) => prev ?? data[0].id);
        setConnectionStatus("connected");
        failCountRef.current = 0;
      })
      .catch(() => {
        if (!mountedRef.current) return;
        const delay = Math.min(1500 + attempt * 1500, 6000); // 1.5s, 3s, 4.5s, 6s, 6s...
        setConnectionStatus((prev) => (prev === "connected" ? "connected" : "connecting"));
        retryTimeoutRef.current = setTimeout(() => connectWithRetry(attempt + 1), delay);
      });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connectWithRetry();
    const flickerGuard = setTimeout(() => {
      if (mountedRef.current) setShowConnectingBanner(true);
    }, 700);
    return () => {
      mountedRef.current = false;
      clearTimeout(flickerGuard);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [connectWithRetry]);

  // If a later request fails (e.g. connection dropped after initially
  // working), don't flash an error on a single blip — only escalate after
  // a couple of consecutive failures, and keep retrying station-list
  // fetches in the background so it recovers on its own once the backend
  // responds again.
  const reportRequestOutcome = useCallback((succeeded) => {
    if (succeeded) {
      failCountRef.current = 0;
      setConnectionStatus("connected");
      return;
    }
    failCountRef.current += 1;
    if (failCountRef.current >= 2) {
      setConnectionStatus("error");
      if (!retryTimeoutRef.current) {
        retryTimeoutRef.current = setTimeout(() => {
          retryTimeoutRef.current = null;
          connectWithRetry();
        }, 4000);
      }
    }
  }, [connectWithRetry]);

  const refreshAqi = useCallback((id, language) => {
    setAqiLoading(true);
    getAqi(id, language)
      .then((data) => {
        setAqiData(data);
        reportRequestOutcome(true);
      })
      .catch(() => reportRequestOutcome(false))
      .finally(() => setAqiLoading(false));
  }, [reportRequestOutcome]);

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
        reportRequestOutcome(true);
      })
      .catch(() => reportRequestOutcome(false))
      .finally(() => setAdviceLoading(false));
  }, [reportRequestOutcome]);

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

      {connectionStatus === "connecting" && showConnectingBanner && (
        <div className="app-banner-connecting">
          <span className="connecting-dot" />
          {IS_DEPLOYED
            ? "Connecting to the server… this can take up to 30 seconds if it's been idle."
            : "Connecting to the backend…"}
        </div>
      )}

      {connectionStatus === "error" && (
        <div className="app-banner-error">
          {IS_DEPLOYED ? (
            "Having trouble reaching the server. Retrying automatically — this page will recover on its own once it responds."
          ) : (
            <>
              Can't reach the backend at <code>localhost:5000</code>. Make sure{" "}
              <code>python app.py</code> is running in the backend folder — retrying automatically.
            </>
          )}
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

        {tab === "about" && <AboutView text={text} />}
      </main>

      <footer className="app-footer">
        <p>{text.footer}</p>
      </footer>
    </div>
  );
}
