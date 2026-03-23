import axios from "axios";
import type { RegisterData } from "@/context/AuthContext";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
  withCredentials: true,
});

// Attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("bv_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired token
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("bv_token");
      localStorage.removeItem("bv_user");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

export const loginAPI = (
  email: string,
  password: string,
  walletAddress?: string
) =>
  API.post("/users/login", {
    email,
    password,
    walletAddress,
  });

export const registerAPI = (data: RegisterData) =>
  API.post("/users/register", data);

export const logoutAPI = () =>
  API.post("/users/logout");

export default API
