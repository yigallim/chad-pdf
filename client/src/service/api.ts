import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use((response) => response);

export default apiClient;
