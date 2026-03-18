import React, { useMemo } from "react";
import "./DocCard.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const formatTypeLabel = (type) => {
  if (type === "invoice") return "Invoice";
  if (type === "quotation") return "Quotation";
  if (type === "mom") return "MoM";
  if (type === "client_input") return "Client Input";
  return "Document";
};

const formatFileSize = (size) => {
  const fileSize = Number(size || 0);
  if (fileSize < 1024) return `${fileSize} B`;
  if (fileSize < 1024 * 1024) return `${(fileSize / 1024).toFixed(1)} KB`;
  return `${(fileSize / 1024 / 1024).toFixed(2)} MB`;
};

export default function DocCard({ doc, onDelete }) {
  const fileUrl = useMemo(() => {
    try {
      if (!doc?.fileUrl) return "#";
      if (doc.fileUrl.startsWith("http")) return doc.fileUrl;
      return `${API_BASE}${doc.fileUrl}`;
    } catch (error) {
      console.error("fileUrl error:", error);
      return "#";
    }
  }, [doc]);

  const formattedDate = useMemo(() => {
    try {
      if (!doc?.date) return "-";
      return new Date(doc.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      console.error("formattedDate error:", error);
      return "-";
    }
  }, [doc]);

  return (
    <div className="docCard">
      <div className="docCardTop">
        <span className={`docType ${doc?.type || ""}`}>
          {formatTypeLabel(doc?.type)}
        </span>
        <span className="docDate">{formattedDate}</span>
      </div>

      <div className="docCardBody">
        <h4 className="docTitle">{doc?.name || "Untitled Document"}</h4>
        <p className="docLead">{doc?.linkedLead || "No linked lead"}</p>
        <p className="docFileName">{doc?.originalFileName || "No file attached"}</p>
        <p className="docNotes">{doc?.notes || "No notes added"}</p>
      </div>

      <div className="docMeta">
        <span>{formatFileSize(doc?.fileSize)}</span>
        <span>{doc?.mimeType || "Unknown type"}</span>
      </div>

      <div className="docActions">
        <a href={fileUrl} target="_blank" rel="noreferrer" className="docBtn view">
          View
        </a>

        <a
          href={fileUrl}
          download={doc?.originalFileName || true}
          className="docBtn download"
        >
          Download
        </a>

        <button
          type="button"
          className="docBtn delete"
          onClick={() => onDelete(doc._id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}