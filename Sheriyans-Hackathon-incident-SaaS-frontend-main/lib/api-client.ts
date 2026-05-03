import axios from "axios";

// Use relative URL for production (Vercel rewrites), fallback to Render URL for local dev
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

if (typeof window !== "undefined") {
  console.log("API Base URL:", baseURL);
}

const apiClient = axios.create({
  baseURL,
  withCredentials: true, // Still send cookies if available
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Add Authorization header with token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token on 401
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
      }
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
