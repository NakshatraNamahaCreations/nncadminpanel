import React, { useState } from "react";
import "./UploadDocumentModal.css";

const initialState = {
  type: "invoice",
  linkedLead: "",
  date: "",
  name: "",
  notes: "",
  file: null,
};

export default function UploadDocumentModal({ open, onClose, onSave }) {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleChange = (e) => {
    try {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    } catch (error) {
      console.error("handleChange error:", error);
    }
  };

  const handleFileChange = (e) => {
    try {
      const file = e.target.files?.[0] || null;
      setForm((prev) => ({ ...prev, file }));
    } catch (error) {
      console.error("handleFileChange error:", error);
    }
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();

      if (!form.type || !form.linkedLead || !form.date || !form.name || !form.file) {
        alert("Please fill all required fields");
        return;
      }

      setSubmitting(true);
      await onSave(form);
      setForm(initialState);
      onClose();
    } catch (error) {
      console.error("handleSubmit error:", error);
      alert(error?.message || "Failed to upload document");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="udmOverlay">
      <div className="udmModal">
        <div className="udmHeader">
          <h3>Upload Document</h3>
          <button
            type="button"
            className="udmClose"
            onClick={onClose}
            disabled={submitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="udmForm">
          <div className="udmGrid">
            <div className="udmField">
              <label>Document Type</label>
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="invoice">Invoice</option>
                <option value="quotation">Quotation</option>
                <option value="mom">MoM</option>
                <option value="client_input">Client Input</option>
              </select>
            </div>

            <div className="udmField">
              <label>Linked Lead</label>
              <input
                type="text"
                name="linkedLead"
                value={form.linkedLead}
                onChange={handleChange}
                placeholder="Enter lead/client name"
              />
            </div>

            <div className="udmField">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </div>

            <div className="udmField">
              <label>Document Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter document name"
              />
            </div>
          </div>

          <div className="udmField">
            <label>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Optional notes"
            />
          </div>

          <div className="udmField">
            <label>Choose File</label>
            <input type="file" name="file" onChange={handleFileChange} />
          </div>

          <div className="udmActions">
            <button
              type="button"
              className="udmBtnGhost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button type="submit" className="udmBtnPrimary" disabled={submitting}>
              {submitting ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}