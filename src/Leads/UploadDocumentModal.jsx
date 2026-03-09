import React, { useEffect, useMemo, useState } from "react";
import "./UploadDocumentModal.css";

const TYPES = [
  { key: "Invoice", title: "Invoice", sub: "Tax invoice for closed deal", icon: "📄" },
  { key: "Quotation", title: "Quotation", sub: "Proposal / price quote", icon: "📋" },
  { key: "MoM", title: "MoM", sub: "Minutes of meeting notes", icon: "📝" },
  { key: "Client Input", title: "Client Input", sub: "Assets, content, brief from client", icon: "📦" },
];

export default function UploadDocumentModal({
  open,
  onClose,
  apiBase,
  leadId,
  leadName = "",
  onUploaded,
}) {
  const [docType, setDocType] = useState("Invoice");
  const [documentDate, setDocumentDate] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const canUpload = useMemo(() => {
    return !!leadId && !!name.trim() && !!file && !saving;
  }, [leadId, name, file, saving]);

  useEffect(() => {
    if (!open) return;
    setDocType("Invoice");
    setDocumentDate("");
    setName("");
    setNotes("");
    setFile(null);
    setSaving(false);
  }, [open]);

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  const pickFile = (e) => {
    try {
      const f = e.target.files?.[0];
      if (!f) return;

      // 25MB limit client-side too
      if (f.size > 25 * 1024 * 1024) {
        alert("File too large. Max 25MB");
        e.target.value = "";
        return;
      }
      setFile(f);
    } catch (err) {
      alert(err?.message || "Unable to select file");
    }
  };

  const upload = async () => {
    try {
      if (!canUpload) return;

      setSaving(true);

      const fd = new FormData();
      fd.append("docType", docType);
      fd.append("documentDate", documentDate);
      fd.append("name", name);
      fd.append("notes", notes);
      fd.append("file", file);

      const res = await fetch(`${apiBase}/api/leads/${leadId}/documents/upload`, {
        method: "POST",
        body: fd,
      });

      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Upload failed");

      onUploaded?.(json.data);
      onClose?.();
    } catch (err) {
      alert(err?.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="udmOverlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="udmModal" role="dialog" aria-modal="true" aria-label="Upload Document">
        <div className="udmHead">
          <div className="udmTitle">📎 Upload Document</div>
          <button className="udmClose" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="udmBody">
          <div className="udmLabel">Document Type <span className="udmReq">*</span></div>

          <div className="udmTypeGrid">
            {TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`udmTypeCard ${docType === t.key ? "active" : ""}`}
                onClick={() => setDocType(t.key)}
              >
                <div className="udmTypeIcon">{t.icon}</div>
                <div className="udmTypeText">
                  <div className="udmTypeTitle">{t.title}</div>
                  <div className="udmTypeSub">{t.sub}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="udmRow2">
            <div>
              <div className="udmLabel">Link to Client/Lead</div>
              <div className="udmSelectFake">
                {leadName ? leadName : "Selected lead"}
              </div>
            </div>

            <div>
              <div className="udmLabel">Document Date</div>
              <input
                className="udmInput"
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
              />
            </div>
          </div>

          <div className="udmLabel">Document Name / Reference</div>
          <input
            className="udmInput"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. INV-2026-057 or Project Kickoff MoM"
          />

          <div className="udmLabel">Notes / Description</div>
          <input
            className="udmInput"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional context about this document"
          />

          <div className="udmLabel">Select File <span className="udmReq">*</span></div>

          <label className={`udmDrop ${file ? "hasFile" : ""}`}>
            <input type="file" onChange={pickFile} hidden />
            <div className="udmClip">📎</div>
            <div className="udmDropMain">
              <div className="udmDropTitle">{file ? file.name : "Click to select file"}</div>
              <div className="udmDropSub">PDF, DOCX, XLSX, ZIP, Images (max 25MB)</div>
            </div>
          </label>
        </div>

        <div className="udmFoot">
          <button className="udmBtn ghost" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="udmBtn primary" type="button" onClick={upload} disabled={!canUpload}>
            {saving ? "Uploading..." : "↑ Upload Document"}
          </button>
        </div>
      </div>
    </div>
  );
}