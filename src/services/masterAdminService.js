import axios from "axios";

const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";

const getHeaders = () => {
  try {
    const token = localStorage.getItem("nnc_token");
    return {
      Authorization: `Bearer ${token}`,
    };
  } catch (error) {
    console.error("getHeaders error:", error);
    return {};
  }
};

export const getMasterAdminDashboard = async () => {
  try {
    const response = await axios.get(`${API_BASE}/api/master-admin/dashboard`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("getMasterAdminDashboard error:", error);
    throw error;
  }
};

export const createMasterAdminUser = async (payload) => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/master-admin/users`,
      payload,
      {
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("createMasterAdminUser error:", error);
    throw error;
  }
};

export const updateMasterAdminUser = async (id, payload) => {
  try {
    const response = await axios.put(
      `${API_BASE}/api/master-admin/users/${id}`,
      payload,
      {
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("updateMasterAdminUser error:", error);
    throw error;
  }
};

export const deleteMasterAdminUser = async (id) => {
  try {
    const response = await axios.delete(
      `${API_BASE}/api/master-admin/users/${id}`,
      {
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("deleteMasterAdminUser error:", error);
    throw error;
  }
};