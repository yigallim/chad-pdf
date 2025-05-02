import axios from "axios";

export const BASE_API_URL = "http://127.0.0.1:5000/api";

const apiClient = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
