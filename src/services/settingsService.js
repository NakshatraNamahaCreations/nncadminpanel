import axios from "axios";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";

export const changePassword = async (payload) => {
  try {
    const token = localStorage.getItem("nnc_token");

    const response = await axios.put(
      `${API_BASE}/api/auth/change-password`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("changePassword service error:", error);
    throw error;
  }
};
