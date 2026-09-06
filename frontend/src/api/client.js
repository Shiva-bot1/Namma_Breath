import axios from "axios";

// In local dev this falls back to your Flask server on :5000.
// In production (Vercel), set VITE_API_URL to your Render backend URL,
// e.g. https://namma-breath-api.onrender.com
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const FALLBACK_STATIONS = [
  { id: "silk-board", name: "Silk Board Junction", lat: 12.9172, lng: 77.6228 },
  { id: "hebbal", name: "Hebbal", lat: 13.0355, lng: 77.597 },
  { id: "mysuru-road", name: "Mysuru Road", lat: 12.9581, lng: 77.5346 },
  { id: "hosur-road", name: "Hosur Road", lat: 12.9082, lng: 77.6476 },
  { id: "peenya", name: "Peenya (Industrial)", lat: 13.0281, lng: 77.5199 },
  { id: "jayanagar", name: "Jayanagar", lat: 12.9308, lng: 77.5838 },
  { id: "whitefield", name: "Whitefield", lat: 12.9698, lng: 77.75 },
  { id: "electronic-city", name: "Electronic City", lat: 12.8452, lng: 77.6602 },
];

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
