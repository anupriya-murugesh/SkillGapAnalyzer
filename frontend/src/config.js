// Determine the API base URL:
// 1. If VITE_BACKEND_URL is explicitly configured (e.g. in Netlify, Vercel, or .env), use it.
// 2. In local development, use '' so requests route through the Vite proxy to http://127.0.0.1:8000,
//    eliminating CORS and Windows IPv6 localhost (::1 vs 127.0.0.1) connection failures.
// 3. In production fallback, default to 'http://127.0.0.1:8000'.
const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.DEV) {
    return '';
  }
  return 'http://127.0.0.1:8000';
};

export const API_BASE_URL = getBackendUrl();
export const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';
