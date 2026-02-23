import axios from "axios";

// Create Axios instance
const api = axios.create({
    baseURL: "/api", // Proxy through Vite
});

// Add a helper to handle potential self-signed cert errors in development?
// In browser, the user must accept the cert manually.
// We can intercept errors to log them friendly.

api.interceptors.response.use(
    response => response,
    error => {
        console.error("API Error:", error);
        return Promise.reject(error);
    }
);

export default api;
