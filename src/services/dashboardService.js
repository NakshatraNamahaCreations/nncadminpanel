import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function getDashboardData() {
  try {
    const token = localStorage.getItem("nnc_token");
    const response = await axios.get(`${API_BASE}/api/dashboard/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("getDashboardData error:", error);
    throw error;
  }
}
