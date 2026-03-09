import React, { useEffect, useMemo, useState } from "react";
import "./AddLeadModal.css";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";

const initial = {
  name: "",
  phone: "",
  business: "",
  branch: "Mysore",
  source: "WhatsApp",
  stage: "Lead Capture",
  bant: "1/4",
  priority: "Hot",
  value: "",
  days: "0d",
  docs: 0,
  rep: "",
};

export default function AddLeadModal({ open, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({});

  const [reps, setReps] = useState([]);
  const [loadingReps, setLoadingReps] = useState(false);

  const [showAddRep, setShowAddRep] = useState(false);
  const [newRepName, setNewRepName] = useState("");
  const [addingRep, setAddingRep] = useState(false);

  const branches = useMemo(() => ["Bangalore", "Mysore", "Mumbai"], []);
  const sources = useMemo(
    () => ["WhatsApp", "Website", "Call", "Instagram", "Referral"],
    []
  );
  const stages = useMemo(
    () => ["Lead Capture", "Contacted", "Qualified", "Proposal", "Won", "Lost"],
    []
  );
  const bants = useMemo(() => ["0/4", "1/4", "2/4", "3/4", "4/4"], []);
  const priorities = useMemo(() => ["Hot", "Warm", "Cold"], []);

  const fetchReps = async () => {
    try {
      setLoadingReps(true);

      const res = await fetch(`${API_BASE}/api/reps`);
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to fetch reps");
      }

      setReps(json.data || []);
    } catch (err) {
      console.error(err);
      setReps([]);
    } finally {
      setLoadingReps(false);
    }
  };

  useEffect(() => {
    try {
      if (open) {
        fetchReps();
      }
    } catch (err) {
      console.error(err);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setForm(initial);
      setTouched({});
      setSaving(false);
      setShowAddRep(false);
      setNewRepName("");
      setAddingRep(false);
    }
  }, [open]);

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const markTouched = (k) => setTouched((p) => ({ ...p, [k]: true }));

  const errors = useMemo(() => {
    const e = {};

    if (!String(form.name || "").trim()) e.name = "Name is required";

    if (!String(form.phone || "").trim()) {
      e.phone = "Phone is required";
    } else if (!/^[\d+\s-]{7,20}$/.test(form.phone)) {
      e.phone = "Enter valid phone";
    }

    if (!form.branch) e.branch = "Branch is required";

    if (form.value !== "" && Number.isNaN(Number(form.value))) {
      e.value = "Enter valid amount";
    }

    if (form.days && !/^\d+\s*d$/i.test(form.days.trim())) {
      e.days = "Use format like 0d, 3d, 12d";
    }

    if (form.docs !== "" && Number.isNaN(Number(form.docs))) {
      e.docs = "Enter valid number";
    }

    return e;
  }, [form]);

  const canSave = Object.keys(errors).length === 0 && !saving;

  const handleBackdropClick = (e) => {
    if (e.target?.dataset?.backdrop === "true") onClose?.();
  };

  const handleAddRep = async () => {
  try {
    if (!String(newRepName || "").trim()) {
      alert("Rep name is required");
      return;
    }

    setAddingRep(true);

    const url = `${API_BASE}/api/reps`;
    console.log("Adding rep URL:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: String(newRepName || "").trim(),
      }),
    });

    console.log("Add rep status:", res.status);

    const json = await res.json();
    console.log("Add rep response:", json);

    if (!res.ok || !json?.success) {
      throw new Error(json?.message || "Failed to add rep");
    }

    await fetchReps();
    setField("rep", json.data?.name || "");
    setNewRepName("");
    setShowAddRep(false);
  } catch (err) {
    console.error("handleAddRep error:", err);
    alert(err?.message || "Unable to add rep");
  } finally {
    setAddingRep(false);
  }
};
  const handleRepChange = (value) => {
    try {
      if (value === "__add_new__") {
        setShowAddRep(true);
        return;
      }

      setField("rep", value);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    try {
      setTouched({
        name: true,
        phone: true,
        branch: true,
        value: true,
        days: true,
        docs: true,
      });

      if (Object.keys(errors).length) return;

      setSaving(true);

      const payload = {
        name: String(form.name || "").trim(),
        phone: String(form.phone || "").trim(),
        business: String(form.business || "").trim(),
        branch: form.branch || "Mysore",
        source: form.source || "Referral",
        stage: form.stage || "Lead Capture",
        bant: form.bant || "1/4",
        priority: form.priority || "Hot",
        value: form.value === "" ? 0 : Number(form.value),
        days: String(form.days || "0d").trim(),
        docs: Number(form.docs || 0),
        rep: String(form.rep || "").trim(),
      };

      await onSave?.(payload);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Unable to save lead");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="almOverlay" data-backdrop="true" onMouseDown={handleBackdropClick}>
      <div className="almModal" role="dialog" aria-modal="true" aria-label="Add New Lead">
        <div className="almHeader">
          <div className="almTitle">Add New Lead</div>
          <button className="almClose" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="almBody">
          <div className="almGrid">
            <Field
              label="Name"
              required
              value={form.name}
              placeholder="e.g. Arjun's Dental Clinic"
              onChange={(v) => setField("name", v)}
              onBlur={() => markTouched("name")}
              error={touched.name ? errors.name : ""}
            />

            <Field
              label="Phone"
              required
              value={form.phone}
              placeholder="+91 98765 43210"
              onChange={(v) => setField("phone", v)}
              onBlur={() => markTouched("phone")}
              error={touched.phone ? errors.phone : ""}
            />

            <Field
              label="Business"
              value={form.business}
              placeholder="e.g. Healthcare, Retail"
              onChange={(v) => setField("business", v)}
            />

            <SelectField
              label="Branch"
              required
              value={form.branch}
              options={branches}
              onChange={(v) => setField("branch", v)}
              onBlur={() => markTouched("branch")}
              error={touched.branch ? errors.branch : ""}
            />

            <SelectField
              label="Source"
              value={form.source}
              options={sources}
              onChange={(v) => setField("source", v)}
            />

            <SelectField
              label="Stage"
              value={form.stage}
              options={stages}
              onChange={(v) => setField("stage", v)}
            />

            <SelectField
              label="BANT"
              value={form.bant}
              options={bants}
              onChange={(v) => setField("bant", v)}
            />

            <SelectField
              label="Priority"
              value={form.priority}
              options={priorities}
              onChange={(v) => setField("priority", v)}
            />

            <Field
              label="Value (₹)"
              value={form.value}
              placeholder="12300"
              type="number"
              onChange={(v) => setField("value", v)}
              onBlur={() => markTouched("value")}
              error={touched.value ? errors.value : ""}
            />

            <Field
              label="Days"
              value={form.days}
              placeholder="0d"
              onChange={(v) => setField("days", v)}
              onBlur={() => markTouched("days")}
              error={touched.days ? errors.days : ""}
            />

            <Field
              label="Docs"
              value={String(form.docs)}
              placeholder="0"
              type="number"
              onChange={(v) => setField("docs", v)}
              onBlur={() => markTouched("docs")}
              error={touched.docs ? errors.docs : ""}
            />

            <div className="almField">
              <div className="almLabelRow">
                <label className="almLabel">Rep</label>
              </div>

              <select
                className="almSelect"
                value={form.rep || ""}
                onChange={(e) => handleRepChange(e.target.value)}
              >
                <option value="">
                  {loadingReps ? "Loading reps..." : "Select rep..."}
                </option>

                {reps.map((rep) => (
                  <option key={rep._id} value={rep.name}>
                    {rep.name}
                  </option>
                ))}

                <option value="__add_new__">+ Add New Rep</option>
              </select>

              {showAddRep ? (
                <div className="almInlineAdd">
                  <input
                    className="almInput"
                    value={newRepName}
                    placeholder="Enter rep name"
                    onChange={(e) => setNewRepName(e.target.value)}
                  />

                  <div className="almInlineBtns">
                    <button
                      className="almMiniBtn ghost"
                      type="button"
                      onClick={() => {
                        try {
                          setShowAddRep(false);
                          setNewRepName("");
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      disabled={addingRep}
                    >
                      Cancel
                    </button>

                    <button
                      className="almMiniBtn primary"
                      type="button"
                      onClick={handleAddRep}
                      disabled={addingRep}
                    >
                      {addingRep ? "Adding..." : "Add"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="almFooter">
          <button className="almBtn ghost" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="almBtn primary" type="button" onClick={handleSubmit} disabled={!canSave}>
            {saving ? "Saving..." : "Save Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  type = "text",
}) {
  return (
    <div className="almField">
      <div className="almLabelRow">
        <label className="almLabel">
          {label} {required ? <span className="almReq">*</span> : null}
        </label>
        {error ? <span className="almErr">{error}</span> : null}
      </div>

      <input
        className={`almInput ${error ? "isError" : ""}`}
        value={value ?? ""}
        type={type}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}

function SelectField({ label, required, value, options, onChange, onBlur, error }) {
  return (
    <div className="almField">
      <div className="almLabelRow">
        <label className="almLabel">
          {label} {required ? <span className="almReq">*</span> : null}
        </label>
        {error ? <span className="almErr">{error}</span> : null}
      </div>

      <select
        className={`almSelect ${error ? "isError" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      >
        {options.map((opt) => (
          <option key={String(opt)} value={opt}>
            {opt === "" ? "Select..." : opt}
          </option>
        ))}
      </select>
    </div>
  );
}