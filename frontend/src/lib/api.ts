import axios from "axios";

const apiBaseUrl = (
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:5000" : "")
).replace(/\/$/, "");

const api = axios.create({
  baseURL: apiBaseUrl || undefined,
  withCredentials: true,
});

export default api;
