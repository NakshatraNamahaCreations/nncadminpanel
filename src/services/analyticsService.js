import axios from "axios";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";

export const getAnalytics = async () => {
  try {
    const response = await axios.get(`${API_BASE}/api/analytics`);
    return response.data;
  } catch (error) {
    console.error("getAnalytics service error:", error);
    throw new Error(error?.response?.data?.message || "Failed to fetch analytics");
  }
};