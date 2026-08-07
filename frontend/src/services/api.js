import axios from "axios";

console.log("VITE_API_BASE_URL =", import.meta.env.VITE_API_BASE_URL);

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

console.log("Axios Base URL =", API.defaults.baseURL);

export default API;
