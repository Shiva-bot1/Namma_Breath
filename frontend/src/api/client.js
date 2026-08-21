import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const client = axios.create({ baseURL: API_URL, timeout: 8000 });

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
