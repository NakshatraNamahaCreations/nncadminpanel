import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://nncadminbackend.onrender.com/api";

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