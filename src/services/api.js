import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
export const API_URL = `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("nnc_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.error("Request interceptor error:", error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error(
      "API response error:",
      error?.response?.data || error.message || error
    );
    return Promise.reject(error);
  }
);

export const loginAdmin = async (payload) => {
  try {
    const response = await api.post("/auth/login", payload);
    return response;
  } catch (error) {
    console.error("loginAdmin error:", error);
    throw error;
  }
};

export const getProfile = async () => {
  try {
    const response = await api.get("/auth/profile");
    return response;
  } catch (error) {
    console.error("getProfile error:", error);
    throw error;
  }
};

export const getDashboardData = async () => {
  try {
    const response = await api.get("/dashboard");
    return response;
  } catch (error) {
    console.error("getDashboardData error:", error);
    throw error;
  }
};

// If your backend is app.use("/api/leads", leadRoutes)
// then these should call /leads, not /pipeline
export const getPipelineBoard = async (params) => {
  try {
    const response = await api.get("/leads/board", { params });
    return response;
  } catch (error) {
    console.error("getPipelineBoard error:", error);
    throw error;
  }
};

export const createLead = async (payload) => {
  try {
    const response = await api.post("/leads", payload);
    return response;
  } catch (error) {
    console.error("createLead error:", error);
    throw error;
  }
};

export default api;