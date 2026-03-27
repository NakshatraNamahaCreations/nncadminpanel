import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const getBranchReports = async (queryString = "") => {
  try {
    const token = localStorage.getItem("nnc_token");
    const url = queryString
      ? `${API_BASE}/api/branch-reports?${queryString}`
      : `${API_BASE}/api/branch-reports`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("Get branch reports service error:", error);
    throw error?.response?.data || error;
  }
};
