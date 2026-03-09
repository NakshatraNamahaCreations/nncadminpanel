import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Topbar from "../components/Topbar/Topbar";
import DocCard from "../components/DocCard/DocCard";
import { API_BASE_URL } from "../services/api";
import "./Documents.css";

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    invoices: 0,
    quotations: 0,
    moms: 0,
    clientInputs: 0,
    totalStorage: 0,
    totalDocuments: 0,
  });
  const [activeType, setActiveType] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async (typeValue = activeType, searchValue = search) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (typeValue && typeValue !== "all") {
        params.append("type", typeValue);
      }

      if (searchValue && searchValue.trim()) {
        params.append("search", searchValue.trim());
      }

      const response = await fetch(
        `${API_BASE_URL}/api/documents?${params.toString()}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch documents");
      }

      setDocuments(result.data || []);
    } catch (error) {
      console.error("fetchDocuments error:", error);
      alert(error?.message || "Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/stats`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch stats");
      }

      setStats(result.data || {});
    } catch (error) {
      console.error("fetchStats error:", error);
    }
  };

  const handleUploadDocument = async (payload) => {
    try {
      const formData = new FormData();
      formData.append("type", payload.type);
      formData.append("linkedLead", payload.linkedLead);
      formData.append("date", payload.date);
      formData.append("name", payload.name);
      formData.append("notes", payload.notes || "");
      formData.append("file", payload.file);

      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to upload document");
      }

      await fetchDocuments(activeType, search);
      await fetchStats();
      alert("Document uploaded successfully");
    } catch (error) {
      console.error("handleUploadDocument error:", error);
      alert(error?.message || "Failed to upload document");
      throw error;
    }
  };

  const handleDelete = async (id) => {
    try {
      const ok = window.confirm("Are you sure you want to delete this document?");
      if (!ok) return;

      const response = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete document");
      }

      await fetchDocuments(activeType, search);
      await fetchStats();
      alert("Document deleted successfully");
    } catch (error) {
      console.error("handleDelete error:", error);
      alert(error?.message || "Failed to delete document");
    }
  };

  useEffect(() => {
    try {
      fetchDocuments("all", "");
      fetchStats();
    } catch (error) {
      console.error("Documents useEffect error:", error);
    }
  }, []);

  const handleFilterClick = async (typeValue) => {
    try {
      setActiveType(typeValue);
      await fetchDocuments(typeValue, search);
    } catch (error) {
      console.error("handleFilterClick error:", error);
    }
  };

  const handleSearchChange = async (value) => {
    try {
      setSearch(value);
      await fetchDocuments(activeType, value);
    } catch (error) {
      console.error("handleSearchChange error:", error);
    }
  };

  const totalStorageInMB = useMemo(() => {
    try {
      return `${((stats.totalStorage || 0) / 1024 / 1024).toFixed(2)} MB`;
    } catch (error) {
      console.error("totalStorageInMB error:", error);
      return "0 MB";
    }
  }, [stats]);

  return (
    <div className="docsLayout">
      <Sidebar active="Documents" />

      <div className="docsPage">
        <Topbar
          title="Documents"
          roleLabel="Master Admin"
          onUploadDocument={handleUploadDocument}
          showUpload={true}
          showAddLead={true}
          showLogout={false}
          uploadLabel="Upload"
          addLeadLabel="Add Lead"
        >
          <input
            className="docsSearch"
            type="text"
            placeholder="Search leads, docs..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </Topbar>

        <div className="docsTabs">
          <button
            className={`docsTab ${activeType === "all" ? "active" : ""}`}
            onClick={() => handleFilterClick("all")}
          >
            All ({stats.totalDocuments || 0})
          </button>
          <button
            className={`docsTab ${activeType === "invoice" ? "active" : ""}`}
            onClick={() => handleFilterClick("invoice")}
          >
            Invoices ({stats.invoices || 0})
          </button>
          <button
            className={`docsTab ${activeType === "quotation" ? "active" : ""}`}
            onClick={() => handleFilterClick("quotation")}
          >
            Quotations ({stats.quotations || 0})
          </button>
          <button
            className={`docsTab ${activeType === "mom" ? "active" : ""}`}
            onClick={() => handleFilterClick("mom")}
          >
            MoM ({stats.moms || 0})
          </button>
          <button
            className={`docsTab ${activeType === "client_input" ? "active" : ""}`}
            onClick={() => handleFilterClick("client_input")}
          >
            Client Inputs ({stats.clientInputs || 0})
          </button>
        </div>

        <div className="docsMain">
          <div className="docsGridWrap">
            {loading ? (
              <div className="docsEmpty">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="docsEmpty">No documents found</div>
            ) : (
              <div className="docsGrid">
                {documents.map((doc) => (
                  <DocCard key={doc._id} doc={doc} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>

          <div className="docsSidebarCard">
            <h3>Document Stats</h3>

            <div className="statItem green">
              <span>Invoices</span>
              <b>{stats.invoices || 0}</b>
            </div>

            <div className="statItem blue">
              <span>Quotations</span>
              <b>{stats.quotations || 0}</b>
            </div>

            <div className="statItem yellow">
              <span>MoMs</span>
              <b>{stats.moms || 0}</b>
            </div>

            <div className="statItem purple">
              <span>Client Inputs</span>
              <b>{stats.clientInputs || 0}</b>
            </div>

            <div className="statFooter">
              <span>Total Storage</span>
              <b>{totalStorageInMB}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}