import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.0.4:3000", // seu backend real
  timeout: 8000,
});

export default api;
