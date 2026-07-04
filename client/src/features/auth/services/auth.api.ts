import axios from "axios";

const AUTH_API_URL = "http://localhost:3000/api/v1";

const api = axios.create({
  baseURL: AUTH_API_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or unauthorized request. Clearing session...");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_id");
      sessionStorage.clear();

      // Avoid infinite redirects if already on signin or signup pages
      const currentPath = window.location.pathname;
      if (currentPath !== "/signin" && currentPath !== "/signup" && currentPath !== "/") {
        window.location.href = "/signin";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
