import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function getDashboardData() {
  try {
    const response = await axios.get(`${API_BASE}/dashboard/summary`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("getDashboardData error:", error);
    throw error;
  }
}