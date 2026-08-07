import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api",
});

// Debug
console.log("Axios Base URL:", API.defaults.baseURL);

// Attach JWT token automatically
API.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem("readpulse_user");

    console.log("Stored User:", storedUser);

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);

        console.log("Parsed User:", user);
        console.log("JWT Token:", user.token);

        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (err) {
        console.error("Failed to parse user from localStorage:", err);
      }
    } else {
      console.warn("No user found in localStorage");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Log every response
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error");

    if (error.config) {
      console.log("URL:", error.config.url);
      console.log("Method:", error.config.method);
      console.log("Authorization:", error.config.headers?.Authorization);
    }

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Response:", error.response.data);
    }

    return Promise.reject(error);
  }
);

export default API;
