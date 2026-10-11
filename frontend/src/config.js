const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
export const API_BASE_URL = rawBackendUrl.replace(/\/+$/, '');
export const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';
