import React, { useEffect, useMemo, useState } from "react";
import { toast } from "../../../utils/toast";
import "./AddLeadModal.css";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";

const initial = {
  name: "",
  phone: "",
  email: "",
  business: "",
  location: "",
  requirements: "",
  branch: "Mysore",
  source: "WhatsApp",
  stage: "Lead Capture",
  bant: "1/4",
  priority: "Hot",
  value: "",
  days: "0d",
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
    () => ["Lead Capture", "Reachable", "Qualified", "Proposal", "Closed"],
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

      setReps(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("fetchReps error:", err);
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
      console.error("open effect error:", err);
    }
  }, [open]);

  useEffect(() => {
    try {
      if (!open) {
        setForm(initial);
        setTouched({});
        setSaving(false);
        setShowAddRep(false);
        setNewRepName("");
        setAddingRep(false);
      }
    } catch (err) {
      console.error("reset effect error:", err);
    }
  }, [open]);

  useEffect(() => {
    const onEsc = (e) => {
      try {
        if (e.key === "Escape") onClose?.();
      } catch (err) {
        console.error("esc error:", err);
      }
    };

    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  const setField = (key, value) => {
    try {
      setForm((prev) => ({ ...prev, [key]: value }));
    } catch (err) {
      console.error("setField error:", err);
    }
  };

  const markTouched = (key) => {
    try {
      setTouched((prev) => ({ ...prev, [key]: true }));
    } catch (err) {
      console.error("markTouched error:", err);
    }
  };

  const errors = useMemo(() => {
    const e = {};

    try {
      if (!String(form.name || "").trim()) {
        e.name = "Name is required";
      }

      if (!String(form.phone || "").trim()) {
        e.phone = "Phone is required";
      } else if (!/^[\d+\s-]{7,20}$/.test(form.phone)) {
        e.phone = "Enter valid phone";
      }

      if (String(form.email || "").trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email.trim())) {
          e.email = "Enter valid email";
        }
      }

      if (!form.branch) {
        e.branch = "Branch is required";
      }

      if (form.value !== "" && Number.isNaN(Number(form.value))) {
        e.value = "Enter valid amount";
      }

      if (form.days && !/^\d+\s*d$/i.test(form.days.trim())) {
        e.days = "Use format like 0d, 3d, 12d";
      }

      if (String(form.requirements || "").trim().length > 2000) {
        e.requirements = "Maximum 2000 characters allowed";
      }
    } catch (err) {
      console.error("errors useMemo error:", err);
    }

    return e;
  }, [form]);

  const canSave = Object.keys(errors).length === 0 && !saving;

  const handleBackdropClick = (e) => {
    try {
      if (e.target?.dataset?.backdrop === "true") {
        onClose?.();
      }
    } catch (err) {
      console.error("handleBackdropClick error:", err);
    }
  };

  const handleAddRep = async () => {
    try {
      if (!String(newRepName || "").trim()) {
        toast.warning("Rep name is required");
        return;
      }

      setAddingRep(true);

      const res = await fetch(`${API_BASE}/api/reps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: String(newRepName || "").trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to add rep");
      }

      await fetchReps();
      setField("rep", json.data?.name || "");
      setNewRepName("");
      setShowAddRep(false);
    } catch (err) {
      console.error("handleAddRep error:", err);
      toast.error(err?.message || "Unable to add rep");
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

      setShowAddRep(false);
      setField("rep", value);
    } catch (err) {
      console.error("handleRepChange error:", err);
    }
  };

  const handleSubmit = async () => {
    try {
      setTouched({
        name: true,
        phone: true,
        email: true,
        branch: true,
        value: true,
        days: true,
        requirements: true,
      });

      if (Object.keys(errors).length > 0) {
        return;
      }

      setSaving(true);

      const bantScore = Number(String(form.bant || "0/4").split("/")[0]) || 0;

      const payload = {
        name: String(form.name || "").trim(),
        phone: String(form.phone || "").trim(),
        email: String(form.email || "").trim(),
        business: String(form.business || "").trim(),
        location: String(form.location || "").trim(),
        requirements: String(form.requirements || "").trim(),

        branch: form.branch || "Mysore",
        source: form.source || "WhatsApp",
        stage: form.stage || "Lead Capture",
        priority: form.priority || "Hot",
        value: form.value === "" ? 0 : Number(form.value),
        days: String(form.days || "0d").trim(),
        rep: String(form.rep || "").trim(),

        bantDetails: {
          budgetMin: bantScore >= 1 ? 1 : 0,
          budgetMax: bantScore >= 1 ? 1 : 0,
          authorityName: bantScore >= 2 ? "Authority Added" : "",
          need: bantScore >= 3 ? "Need Added" : "",
          timeline: bantScore >= 4 ? "Timeline Added" : "",
        },
      };

      await onSave?.(payload);
    } catch (err) {
      console.error("handleSubmit error:", err);
      toast.error(err?.message || "Unable to save lead");
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
              label="Email"
              value={form.email}
              placeholder="example@gmail.com"
              onChange={(v) => setField("email", v)}
              onBlur={() => markTouched("email")}
              error={touched.email ? errors.email : ""}
            />

            <Field
              label="Business"
              value={form.business}
              placeholder="e.g. Healthcare, Retail"
              onChange={(v) => setField("business", v)}
            />

            <Field
              label="Location"
              value={form.location}
              placeholder="e.g. Mysore"
              onChange={(v) => setField("location", v)}
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

            <div className="almField">
              <div className="almLabelRow">
                <label className="almLabel">Rep</label>
              </div>

              <select
                className="almSelect"
                value={form.rep || ""}
                onChange={(e) => handleRepChange(e.target.value)}
              >
                <option value="">{loadingReps ? "Loading reps..." : "Select rep..."}</option>

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
                          console.error("cancel add rep error:", err);
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

            <TextAreaField
              label="Requirements"
              value={form.requirements}
              placeholder="Enter client requirements..."
              onChange={(v) => setField("requirements", v)}
              onBlur={() => markTouched("requirements")}
              error={touched.requirements ? errors.requirements : ""}
              className="almFieldFull"
            />
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

function TextAreaField({
  label,
  required,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  className = "",
}) {
  return (
    <div className={`almField ${className}`}>
      <div className="almLabelRow">
        <label className="almLabel">
          {label} {required ? <span className="almReq">*</span> : null}
        </label>
        {error ? <span className="almErr">{error}</span> : null}
      </div>

      <textarea
        className={`almTextarea ${error ? "isError" : ""}`}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}