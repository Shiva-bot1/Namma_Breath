import axios from "axios";

// In local dev this falls back to your Flask server on :5000.
// In production (Vercel), set VITE_API_URL to your Render backend URL,
// e.g. https://namma-breath-api.onrender.com
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Lets the UI show a different message for "you forgot to start the local
// backend" vs "the deployed backend is waking up / temporarily down".
export const IS_DEPLOYED = Boolean(import.meta.env.VITE_API_URL);
export const API_BASE_URL = BASE_URL;

const client = axios.create({ baseURL: BASE_URL, timeout: 8000 });

export const getHealth = () => client.get("/api/health").then((r) => r.data);

export const getStations = () => client.get("/api/stations").then((r) => r.data);

export const getAqi = (stationId, lang = "en") =>
  client.get(`/api/aqi/${stationId}`, { params: { lang } }).then((r) => r.data);

export const getTrend = (stationId) =>
  client.get(`/api/trend/${stationId}`).then((r) => r.data);

export const getAdvice = (payload) =>
  client.post("/api/advice", payload).then((r) => r.data);

export const getHistory = (days = 7) =>
  client.get("/api/history", { params: { days } }).then((r) => r.data);

export const clearHistory = () => client.delete("/api/history").then((r) => r.data);
