// Determine the API base URL:
// 1. If VITE_BACKEND_URL is explicitly configured, use it.
// 2. Otherwise default to '' so all calls route relatively (/api/...) without attempting to query localhost.
const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || '';
export const API_BASE_URL = rawBackendUrl.replace(/\/+$/, '');
export const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';
