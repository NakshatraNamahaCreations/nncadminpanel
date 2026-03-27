import React, { useEffect, useMemo, useState } from "react";
import { toast } from "../utils/toast";
import Sidebar from "../components/Sidebar/Sidebar";
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
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async (typeValue = "all", searchValue = "") => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (typeValue && typeValue !== "all") {
        params.append("type", typeValue);
      }

      if (searchValue && searchValue.trim()) {
        params.append("search", searchValue.trim());
      }

      const url = `${API_BASE_URL}/api/documents${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch documents");
      }

      setDocuments(result.data || []);
    } catch (error) {
      console.error("fetchDocuments error:", error);
      toast.error(error?.message || "Failed to fetch documents");
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

      await fetchDocuments(activeType, "");
      await fetchStats();

      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("handleDelete error:", error);
      toast.error(error?.message || "Failed to delete document");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          fetchDocuments("all", ""),
          fetchStats(),
        ]);
      } catch (error) {
        console.error("Documents init error:", error);
      }
    };

    init();
  }, []);

  const handleFilterClick = async (typeValue) => {
    try {
      setActiveType(typeValue);
      await fetchDocuments(typeValue, "");
    } catch (error) {
      console.error("handleFilterClick error:", error);
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
