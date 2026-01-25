import axios from "axios";
import { useAuthStore } from "@/stores/auth.store";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

/**
 * Axios instance with automatic Bearer token injection
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add Authorization header
api.interceptors.request.use(
  (config) => {
    const tokens = useAuthStore.getState().tokens;
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 - user needs to re-authenticate
    if (error.response?.status === 401) {
      console.log("[API] Unauthorized - token may be expired");
      // Could trigger logout here if needed
    }
    return Promise.reject(error);
  },
);
