import React from "react";
import { FileText, Trash2, Download } from "lucide-react";
import { API_BASE_URL } from "../../services/api";
import "./DocCard.css";

function getTypeLabel(type) {
  try {
    if (type === "invoice") return "Invoice";
    if (type === "quotation") return "Quotation";
    if (type === "mom") return "MoM";
    if (type === "client_input") return "Client Input";
    return type || "Document";
  } catch (error) {
    console.error("getTypeLabel error:", error);
    return "Document";
  }
}

function getTypeClass(type) {
  try {
    if (type === "invoice") return "green";
    if (type === "quotation") return "blue";
    if (type === "mom") return "yellow";
    if (type === "client_input") return "purple";
    return "blue";
  } catch (error) {
    console.error("getTypeClass error:", error);
    return "blue";
  }
}

function formatDate(dateValue) {
  try {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    console.error("formatDate error:", error);
    return "";
  }
}

function formatFileSize(bytes) {
  try {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  } catch (error) {
    console.error("formatFileSize error:", error);
    return "0 KB";
  }
}

export default function DocCard({ doc, onDelete }) {
  return (
    <div className="docCard">
      <div className="docCardIcon">
        <FileText size={34} />
      </div>

      <div className="docCardBody">
        <h4 className="docCardTitle">{doc.name}</h4>
        <p className="docCardMeta">
          {doc.linkedLead} • {formatFileSize(doc.fileSize)} • {formatDate(doc.date)}
        </p>

        <span className={`docCardBadge ${getTypeClass(doc.type)}`}>
          {getTypeLabel(doc.type)}
        </span>
      </div>

      <div className="docCardActions">
        <a
          href={`${API_BASE_URL}${doc.fileUrl}`}
          target="_blank"
          rel="noreferrer"
          className="docIconBtn"
          title="View / Download"
        >
          <Download size={16} />
        </a>

        <button
          type="button"
          className="docIconBtn danger"
          title="Delete"
          onClick={() => onDelete(doc._id)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}