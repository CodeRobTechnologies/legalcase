import axios from "axios";

/** Backend base URL — required in production (Vercel build env). */
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:5000" : "")
).replace(/\/$/, "");

export function isApiConfigured(): boolean {
  return Boolean(API_BASE_URL);
}

if (import.meta.env.PROD && !API_BASE_URL) {
  console.error(
    "VITE_API_URL is not set. Set it in Vercel (e.g. your Railway URL) and redeploy."
  );
}

const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  withCredentials: true,
});

export default api;
