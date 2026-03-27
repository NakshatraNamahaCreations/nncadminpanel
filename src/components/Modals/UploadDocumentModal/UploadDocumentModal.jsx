import React, { useEffect, useState } from "react";
import { toast } from "../../../utils/toast";
import "./UploadDocumentModal.css";

const getInitialState = () => ({
  type: "invoice",
  linkedLead: "",
  date: "",
  name: "",
  notes: "",
  file: null,
});

export default function UploadDocumentModal({
  open,
  onClose,
  onSave,
  leadOptions = [],
  leadsLoading = false,
}) {
  const [form, setForm] = useState(getInitialState());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      if (open) {
        setForm(getInitialState());
      }
    } catch (error) {
      console.error("modal reset error:", error);
    }
  }, [open]);

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
        toast.warning("Please fill all required fields");
        return;
      }

      setSubmitting(true);
      await onSave(form);
      setForm(getInitialState());
      onClose();
    } catch (error) {
      console.error("handleSubmit error:", error);
      toast.error(error?.message || "Failed to upload document");
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
              <select
                name="linkedLead"
                value={form.linkedLead}
                onChange={handleChange}
                disabled={leadsLoading}
              >
                <option value="">
                  {leadsLoading ? "Loading leads..." : "Select lead"}
                </option>

                {leadOptions.map((lead) => {
                  const label = `${lead.name}${lead.phone ? ` - ${lead.phone}` : ""}${
                    lead.business ? ` (${lead.business})` : ""
                  }`;

                  return (
                    <option key={lead._id} value={lead.name}>
                      {label}
                    </option>
                  );
                })}
              </select>
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
            <input
              type="file"
              name="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg,.webp"
            />
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