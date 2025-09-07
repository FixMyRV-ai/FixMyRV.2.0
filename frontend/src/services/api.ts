import Helpers from "@/config/helpers";
import { User } from "@/types/auth";
import axios from "axios";
interface UserState {
  user: User | null;
  state: {
    token: string | null;
  };
}

// Define Base API URL
const BASE_URL = Helpers.apiUrl || "https://api.example.com";

// Create an Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // Send cookies if needed
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from Zustand store or localStorage
    const state: UserState = JSON.parse(localStorage.getItem("user") || "{}");
    const token = state?.state?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for handling session expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized (session expired)
    if (error.response?.status === 401) {
      // Clear user data
      localStorage.removeItem("user");
      
      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
