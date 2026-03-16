import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getAnalytics = async () => {
  try {
    const token = localStorage.getItem("nnc_token");

    const response = await axios.get(`${API_BASE}/analytics`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Get analytics service error:", error);
    throw error?.response?.data || error;
  }
};