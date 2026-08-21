// Axios instance configured for LeetLab production & development
import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL;
const baseURL = rawBaseUrl
  ? (rawBaseUrl.endsWith("/api/v1") ? rawBaseUrl : `${rawBaseUrl.replace(/\/$/, "")}/api/v1`)
  : (import.meta.env.MODE === "development" ? "http://localhost:8081/api/v1" : "/api/v1");

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});
