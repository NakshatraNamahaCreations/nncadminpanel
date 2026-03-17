import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./PaymentTracker.css";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const fmtINR = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const daysLeft = (d) => {
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const PRIORITY_OPTIONS = ["HOT", "WARM", "WATCH", "DONE"];
const STATUS_OPTIONS = [
  "Pending",
  "Partial",
  "Paid",
  "Followed Up",
  "Not Finalised",
  "Declined",
];
const PAYMENT_MODES = ["NEFT", "RTGS", "UPI", "Cheque", "Cash", "IMPS", "Wire"];
const CATEGORIES = [
  "Website Development",
  "Mobile App",
  "E-Commerce",
  "Web Platform",
  "Digital Marketing",
  "2D Animation",
  "CRM / Software",
  "Corporate Video",
  "SEO",
  "3D + AR Website",
  "Website + CRM",
  "Website + App",
  "Other",
];

const priCfg = {
  HOT: { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", label: "🔴 HOT" },
  WARM: { color: "#F97316", bg: "#FFF7ED", border: "#FED7AA", label: "🟡 WARM" },
  WATCH: { color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE", label: "🔵 WATCH" },
  DONE: { color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0", label: "✅ DONE" },
};

const stsCfg = {
  Pending: { color: "#B91C1C", bg: "#FEF2F2" },
  Partial: { color: "#C2410C", bg: "#FFF7ED" },
  Paid: { color: "#15803D", bg: "#F0FDF4" },
  "Followed Up": { color: "#3730A3", bg: "#EEF2FF" },
  "Not Finalised": { color: "#6D28D9", bg: "#F5F3FF" },
  Declined: { color: "#6B7280", bg: "#F9FAFB" },
};

const secCfg = {
  HOT: { label: "🔴 Hot — Urgent Follow-Up", bg: "#FEF2F2", fg: "#B91C1C" },
  WARM: { label: "🟡 Warm — Follow Up This Week", bg: "#FFF7ED", fg: "#C2410C" },
  WATCH: { label: "🔵 Watching — Not Yet Finalised", bg: "#EEF2FF", fg: "#3730A3" },
  DONE: { label: "✅ Done — Fully Collected", bg: "#F0FDF4", fg: "#15803D" },
};

const getClientStatus = (received, totalValue, currentStatus) => {
  const total = Number(totalValue || 0);
  const rec = Number(received || 0);

  if (currentStatus === "Declined" || currentStatus === "Not Finalised") {
    return currentStatus;
  }
  if (total > 0 && rec >= total) return "Paid";
  if (rec > 0 && rec < total) return "Partial";
  return "Pending";
};

const blankClient = () => ({
  id: uid(),
  client: "",
  contact: "",
  city: "",
  category: "",
  project: "",
  proposalDate: "",
  totalValue: "",
  received: 0,
  deadline: "",
  status: "Pending",
  priority: "HOT",
  lastFollowUp: "",
  nextAction: "",
  notes: "",
});

const blankPayment = () => ({
  id: uid(),
  date: "",
  clientId: "",
  client: "",
  project: "",
  invoice: "",
  amount: "",
  mode: "NEFT",
  tds: false,
  tdsAmt: "",
  netAmount: 0,
  tdsStatus: "N/A",
  remarks: "",
});

function ClientForm({ data, onChange, onSave, onCancel, title }) {
  return (
    <div className="pt-modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="pt-modal-title">{title}</div>

      <div className="pt-form-grid">
        <div className="pt-form-field">
          <label className="pt-label">Client Name *</label>
          <input
            className="pt-input"
            placeholder="e.g. ABC Pvt Ltd"
            value={data.client}
            onChange={(e) => onChange({ ...data, client: e.target.value })}
          />
        </div>

        <div className="pt-form-field">
          <label className="pt-label">Contact Person</label>
          <input
            className="pt-input"
            placeholder="e.g. Mr. Rajesh Kumar"
            value={data.contact || ""}
            onChange={(e) => onChange({ ...data, contact: e.target.value })}
          />
        </div>
      </div>

      <div className="pt-form-grid">
        <div className="pt-form-field">
          <label className="pt-label">City / Location</label>
          <input
            className="pt-input"
            placeholder="e.g. Bangalore"
            value={data.city || ""}
            onChange={(e) => onChange({ ...data, city: e.target.value })}
          />
        </div>

        <div className="pt-form-field">
          <label className="pt-label">Service Category</label>
          <select
            className="pt-input"
            value={data.category || ""}
            onChange={(e) => onChange({ ...data, category: e.target.value })}
          >
            <option value="">Select category...</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-form-field">
        <label className="pt-label">Project Description</label>
        <textarea
          className="pt-input pt-textarea"
          placeholder="Brief description of the project scope..."
          value={data.project || ""}
          onChange={(e) => onChange({ ...data, project: e.target.value })}
        />
      </div>

      <div className="pt-form-grid">
        <div className="pt-form-field">
          <label className="pt-label">Total Value (₹) *</label>
          <input
            className="pt-input"
            type="number"
            placeholder="0"
            value={data.totalValue || ""}
            onChange={(e) => onChange({ ...data, totalValue: e.target.value })}
          />
        </div>

        <div className="pt-form-field">
          <label className="pt-label">Amount Received (₹)</label>
          <input
            className="pt-input"
            type="number"
            placeholder="0"
            value={data.received || ""}
            onChange={(e) => onChange({ ...data, received: e.target.value })}
          />
        </div>
      </div>

      <div className="pt-form-grid">
        <div className="pt-form-field">
          <label className="pt-label">Proposal Date</label>
          <input
            className="pt-input"
            type="date"
            value={data.proposalDate || ""}
            onChange={(e) => onChange({ ...data, proposalDate: e.target.value })}
          />
        </div>

        <div className="pt-form-field">
          <label className="pt-label">Follow-up Deadline</label>
          <input
            className="pt-input"
            type="date"
            value={data.deadline || ""}
            onChange={(e) => onChange({ ...data, deadline: e.target.value })}
          />
        </div>
      </div>

      <div className="pt-form-grid">
        <div className="pt-form-field">
          <label className="pt-label">Priority</label>
          <select
            className="pt-input"
            value={data.priority || "HOT"}
            onChange={(e) => onChange({ ...data, priority: e.target.value })}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {priCfg[p].label}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-form-field">
          <label className="pt-label">Payment Status</label>
          <select
            className="pt-input"
            value={data.status || "Pending"}
            onChange={(e) => onChange({ ...data, status: e.target.value })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-form-field">
        <label className="pt-label">Next Action</label>
        <textarea
          className="pt-input pt-textarea pt-textarea-sm"
          placeholder="What needs to happen next?"
          value={data.nextAction || ""}
          onChange={(e) => onChange({ ...data, nextAction: e.target.value })}
        />
      </div>

      <div className="pt-form-grid">
        <div className="pt-form-field">
          <label className="pt-label">Last Follow-up Date</label>
          <input
            className="pt-input"
            type="date"
            value={data.lastFollowUp || ""}
            onChange={(e) => onChange({ ...data, lastFollowUp: e.target.value })}
          />
        </div>

        <div className="pt-form-field">
          <label className="pt-label">Notes</label>
          <input
            className="pt-input"
            placeholder="Any additional notes..."
            value={data.notes || ""}
            onChange={(e) => onChange({ ...data, notes: e.target.value })}
          />
        </div>
      </div>

      <div className="pt-modal-actions">
        <button className="pt-btn pt-btn-primary pt-grow" onClick={onSave}>
          ✓ Save
        </button>
        <button className="pt-btn pt-btn-light pt-grow" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function PaymentForm({
  newPayment,
  setNewPayment,
  savePayment,
  setShowAddPayment,
  clients,
  handlePaymentClientChange,
}) {
  return (
    <div className="pt-modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="pt-modal-title">💰 Log New Payment</div>

      <div className="pt-form-grid">
        <div className="pt-form-field">
          <label className="pt-label">Date Received *</label>
          <input
            className="pt-input"
            type="date"
            value={newPayment.date}
            onChange={(e) =>
              setNewPayment((p) => ({ ...p, date: e.target.value }))
            }
          />
        </div>

        <div className="pt-form-field">
          <label className="pt-label">Invoice Number</label>
          <input
            className="pt-input"
            placeholder="INV-2026-XXX"
            value={newPayment.invoice}
            onChange={(e) =>
              setNewPayment((p) => ({ ...p, invoice: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="pt-form-field">
        <label className="pt-label">Client *</label>
        <select
          className="pt-input"
          value={newPayment.clientId}
          onChange={(e) => handlePaymentClientChange(e.target.value)}
        >
          <option value="">Select client...</option>
          {clients.map((c) => (
            <option key={c._id || c.id} value={c._id || c.id}>
              {c.client}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-form-field">
        <label className="pt-label">Project / Scope</label>
        <input
          className="pt-input"
          placeholder="e.g. 50% advance — website development"
          value={newPayment.project}
          onChange={(e) =>
            setNewPayment((p) => ({ ...p, project: e.target.value }))
          }
        />
      </div>

      <div className="pt-form-grid">
        <div className="pt-form-field">
          <label className="pt-label">Amount Received (₹) *</label>
          <input
            className="pt-input"
            type="number"
            placeholder="0"
            value={newPayment.amount}
            onChange={(e) =>
              setNewPayment((p) => ({ ...p, amount: e.target.value }))
            }
          />
        </div>

        <div className="pt-form-field">
          <label className="pt-label">Payment Mode</label>
          <select
            className="pt-input"
            value={newPayment.mode}
            onChange={(e) =>
              setNewPayment((p) => ({ ...p, mode: e.target.value }))
            }
          >
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-checkbox-row">
        <input
          type="checkbox"
          id="tds-check"
          checked={newPayment.tds}
          onChange={(e) =>
            setNewPayment((p) => ({ ...p, tds: e.target.checked, tdsAmt: "" }))
          }
        />
        <label htmlFor="tds-check" className="pt-label pt-label-inline">
          TDS Deducted by Client?
        </label>
      </div>

      {newPayment.tds && (
        <div className="pt-form-field">
          <label className="pt-label">TDS Amount (₹)</label>
          <input
            className="pt-input"
            type="number"
            placeholder="0"
            value={newPayment.tdsAmt}
            onChange={(e) =>
              setNewPayment((p) => ({ ...p, tdsAmt: e.target.value }))
            }
          />
        </div>
      )}

      <div className="pt-form-field">
        <label className="pt-label">Remarks</label>
        <textarea
          className="pt-input pt-textarea"
          placeholder="Any notes about this payment..."
          value={newPayment.remarks}
          onChange={(e) =>
            setNewPayment((p) => ({ ...p, remarks: e.target.value }))
          }
        />
      </div>

      <div className="pt-modal-actions">
        <button className="pt-btn pt-btn-primary pt-grow" onClick={savePayment}>
          ✓ Save Payment
        </button>
        <button
          className="pt-btn pt-btn-light pt-grow"
          onClick={() => setShowAddPayment(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function PaymentTracker() {
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState("tracker");
  const [search, setSearch] = useState("");
  const [filterPri, setFilterPri] = useState("ALL");
  const [filterSts, setFilterSts] = useState("ALL");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState(blankClient());
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState(blankPayment());
  const [sortField, setSortField] = useState("deadline");
  const [sortDir, setSortDir] = useState("asc");
  const [notif, setNotif] = useState(null);
  const [loading, setLoading] = useState(false);

  const toast = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3000);
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/payment-tracker/clients`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch clients");
      setClients(data.data || []);
    } catch (error) {
      console.error("fetchClients error:", error);
      toast("⚠ Failed to load clients");
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/payment-tracker/payments`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch payments");
      setPayments(data.data || []);
    } catch (error) {
      console.error("fetchPayments error:", error);
      toast("⚠ Failed to load payments");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchClients(), fetchPayments()]);
      } catch (error) {
        console.error("init error:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const confirmed = clients.filter((c) => c.priority !== "WATCH");
  const totalPipeline = confirmed.reduce((s, c) => s + Number(c.totalValue || 0), 0);
  const totalReceived = clients.reduce((s, c) => s + Number(c.received || 0), 0);
  const totalOutstanding = confirmed.reduce(
    (s, c) => s + (Number(c.totalValue || 0) - Number(c.received || 0)),
    0
  );
  const watchValue = clients
    .filter((c) => c.priority === "WATCH")
    .reduce((s, c) => s + Number(c.totalValue || 0), 0);

  const collectionPct =
    totalPipeline > 0 ? Math.round((totalReceived / totalPipeline) * 100) : 0;

  const filtered = useMemo(() => {
    let d = [...clients];

    if (search) {
      const q = search.toLowerCase();
      d = d.filter((c) =>
        [c.client, c.contact, c.city, c.category, c.project, c.nextAction]
          .some((f) => (f || "").toLowerCase().includes(q))
      );
    }

    if (filterPri !== "ALL") d = d.filter((c) => c.priority === filterPri);
    if (filterSts !== "ALL") d = d.filter((c) => c.status === filterSts);

    d.sort((a, b) => {
      let va = a[sortField];
      let vb = b[sortField];

      if (sortField === "deadline") {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      } else if (sortField === "totalValue" || sortField === "received") {
        va = Number(va || 0);
        vb = Number(vb || 0);
      } else {
        va = String(va || "").toLowerCase();
        vb = String(vb || "").toLowerCase();
      }

      if (va === vb) return 0;
      return sortDir === "asc" ? (va > vb ? 1 : -1) : va < vb ? 1 : -1;
    });

    return d;
  }, [clients, search, filterPri, filterSts, sortField, sortDir]);

  const grouped = useMemo(() => {
    const g = {};
    ["HOT", "WARM", "WATCH", "DONE"].forEach((p) => {
      g[p] = filtered.filter((c) => c.priority === p);
    });
    return g;
  }, [filtered]);

  const sort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const saveNewClient = async () => {
    try {
      if (!newClient.client || !newClient.totalValue) {
        toast("⚠ Client name and total value are required");
        return;
      }

      const payload = {
        ...newClient,
        totalValue: Number(newClient.totalValue || 0),
        received: Number(newClient.received || 0),
      };

      payload.status = getClientStatus(
        payload.received,
        payload.totalValue,
        payload.status
      );

      const res = await fetch(`${API_BASE}/api/payment-tracker/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add client");

      setClients((prev) => [...prev, data.data]);
      setNewClient(blankClient());
      setShowAddClient(false);
      toast("✓ Client added successfully");
    } catch (error) {
      console.error("saveNewClient error:", error);
      toast(error.message || "⚠ Failed to add client");
    }
  };

  const openEdit = (c) => {
    setEditData({ ...c, id: c._id || c.id });
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    try {
      const clientId = editData._id || editData.id;

      const updated = {
        ...editData,
        totalValue: Number(editData.totalValue || 0),
        received: Number(editData.received || 0),
      };

      updated.status = getClientStatus(
        updated.received,
        updated.totalValue,
        updated.status
      );

      const res = await fetch(`${API_BASE}/api/payment-tracker/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update client");

      setClients((prev) =>
        prev.map((c) => ((c._id || c.id) === clientId ? data.data : c))
      );

      if ((selectedClient?._id || selectedClient?.id) === clientId) {
        setSelectedClient(data.data);
      }

      setShowEditModal(false);
      setEditData(null);
      toast("✓ Client updated successfully");
    } catch (error) {
      console.error("saveEdit error:", error);
      toast(error.message || "⚠ Failed to update client");
    }
  };

  const deleteClient = async (id) => {
    try {
      if (!window.confirm("Delete this client?")) return;

      const res = await fetch(`${API_BASE}/api/payment-tracker/clients/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete client");

      setClients((prev) => prev.filter((c) => (c._id || c.id) !== id));
      setPayments((prev) => prev.filter((p) => (p.clientId?._id || p.clientId) !== id));
      setSelectedClient(null);
      toast("✓ Client removed");
    } catch (error) {
      console.error("deleteClient error:", error);
      toast(error.message || "⚠ Failed to delete client");
    }
  };

  const savePayment = async () => {
    try {
      if (!newPayment.date || !newPayment.clientId || !newPayment.amount) {
        toast("⚠ Date, Client and Amount are required");
        return;
      }

      const clientObj = clients.find((c) => (c._id || c.id) === newPayment.clientId);
      if (!clientObj) {
        toast("⚠ Selected client not found");
        return;
      }

      const amt = Number(newPayment.amount || 0);
      const tdsAmt = newPayment.tds ? Number(newPayment.tdsAmt || 0) : 0;

      if (amt <= 0) {
        toast("⚠ Amount must be greater than 0");
        return;
      }

      if (tdsAmt > amt) {
        toast("⚠ TDS amount cannot exceed payment amount");
        return;
      }

      const outstanding =
        Number(clientObj.totalValue || 0) - Number(clientObj.received || 0);

      if (amt > outstanding && outstanding > 0) {
        toast(`⚠ Payment exceeds outstanding balance of ${fmtINR(outstanding)}`);
        return;
      }

      const payload = {
        ...newPayment,
        clientId: newPayment.clientId,
        client: clientObj.client,
        project: newPayment.project || clientObj.project || "",
        amount: amt,
        tdsAmt,
        netAmount: amt - tdsAmt,
        tdsStatus: newPayment.tds ? "Pending" : "N/A",
      };

      const res = await fetch(`${API_BASE}/api/payment-tracker/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save payment");

      setPayments((prev) => [data.data.payment, ...prev]);
      setClients((prev) =>
        prev.map((c) =>
          (c._id || c.id) === (data.data.client._id || data.data.client.id)
            ? data.data.client
            : c
        )
      );

      if ((selectedClient?._id || selectedClient?.id) === (clientObj._id || clientObj.id)) {
        setSelectedClient(data.data.client);
      }

      setNewPayment(blankPayment());
      setShowAddPayment(false);
      toast(`✓ Payment of ${fmtINR(amt)} logged for ${clientObj.client}`);
    } catch (error) {
      console.error("savePayment error:", error);
      toast(error.message || "⚠ Failed to save payment");
    }
  };

  const handlePaymentClientChange = (clientId) => {
    const clientObj = clients.find((c) => (c._id || c.id) === clientId);
    setNewPayment((prev) => ({
      ...prev,
      clientId,
      client: clientObj?.client || "",
      project: clientObj?.project || "",
    }));
  };

  const renderTracker = () => (
    <div className="pt-panel">
      <div className="pt-toolbar">
        <div className="pt-search">
          <span className="pt-search-icon">⌕</span>
          <input
            className="pt-search-input"
            placeholder="Search client, city, category, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="pt-select" value={filterPri} onChange={(e) => setFilterPri(e.target.value)}>
          <option value="ALL">All Priorities</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {priCfg[p].label}
            </option>
          ))}
        </select>

        <select className="pt-select" value={filterSts} onChange={(e) => setFilterSts(e.target.value)}>
          <option value="ALL">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <span className="pt-count-text">
          {filtered.length} of {clients.length} clients
        </span>

        <button
          className="pt-btn pt-btn-primary"
          onClick={() => {
            setNewClient(blankClient());
            setShowAddClient(true);
          }}
        >
          + Add Client
        </button>

        <button
          className="pt-btn pt-btn-accent"
          onClick={() => {
            setNewPayment(blankPayment());
            setShowAddPayment(true);
          }}
        >
          + Log Payment
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="pt-table-wrap">
          <div className="pt-empty">
            <div className="pt-empty-icon">📋</div>
            <div className="pt-empty-title">No clients yet</div>
            <div className="pt-empty-sub">Add your first client to start tracking payments</div>
            <button
              className="pt-btn pt-btn-primary"
              onClick={() => {
                setNewClient(blankClient());
                setShowAddClient(true);
              }}
            >
              + Add First Client
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-table-wrap">
          <div className="pt-table-scroll">
            <table className="pt-table">
              <thead>
                <tr>
                  {[
                    ["#", "index"],
                    ["Client", "client"],
                    ["Category", "category"],
                    ["Total Value", "totalValue"],
                    ["Received", "received"],
                    ["Balance", "balance"],
                    ["Deadline", "deadline"],
                    ["Days Left", "days"],
                    ["Status", "status"],
                    ["Priority", "priority"],
                    ["Next Action", "action"],
                    ["", "actions"],
                  ].map(([label, field]) => (
                    <th
                      key={field}
                      className="pt-th"
                      onClick={() =>
                        ["totalValue", "received", "deadline", "client"].includes(field) &&
                        sort(field)
                      }
                    >
                      {label}
                      {["totalValue", "received", "deadline", "client"].includes(field) && (
                        <span className="pt-sort-indicator">
                          {sortField === field ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {["HOT", "WARM", "WATCH", "DONE"].map((pri) => {
                  const rows = grouped[pri];
                  if (!rows || rows.length === 0) return null;

                  const cfg = secCfg[pri];

                  return (
                    <React.Fragment key={pri}>
                      <tr>
                        <td colSpan={12} className="pt-sec-hdr" style={{ background: cfg.bg, color: cfg.fg }}>
                          {cfg.label} — {rows.length} client{rows.length > 1 ? "s" : ""}
                        </td>
                      </tr>

                      {rows.map((c, i) => {
                        const rowId = c._id || c.id;
                        const bal = Number(c.totalValue || 0) - Number(c.received || 0);
                        const dl = c.deadline ? daysLeft(c.deadline) : null;
                        const pct =
                          Number(c.totalValue) > 0
                            ? Math.round((Number(c.received) / Number(c.totalValue)) * 100)
                            : 0;

                        const pc = priCfg[c.priority];
                        const sc = stsCfg[c.status] || stsCfg.Pending;

                        let dlColor = "#94A3B8";
                        let dlBg = "#F8FAFC";

                        if (dl !== null) {
                          if (dl < 0 || dl <= 3) {
                            dlColor = "#EF4444";
                            dlBg = "#FEF2F2";
                          } else if (dl <= 7) {
                            dlColor = "#F97316";
                            dlBg = "#FFF7ED";
                          } else {
                            dlColor = "#22C55E";
                            dlBg = "#F0FDF4";
                          }
                        }

                        return (
                          <tr key={rowId} className="pt-tr">
                            <td className="pt-td pt-muted-sm">{i + 1}</td>

                            <td className="pt-td">
                              <div className="pt-client-name">{c.client}</div>
                              {c.contact && <div className="pt-mini">{c.contact}</div>}
                              {c.city && <div className="pt-mini pt-light">{c.city}</div>}
                            </td>

                            <td className="pt-td">
                              {c.category ? (
                                <span className="pt-pill blue">{c.category}</span>
                              ) : (
                                <span className="pt-dash">—</span>
                              )}
                            </td>

                            <td className="pt-td pt-strong">{fmtINR(c.totalValue)}</td>

                            <td className="pt-td">
                              {Number(c.received) > 0 ? (
                                <>
                                  <span className="pt-green-strong">{fmtINR(c.received)}</span>
                                  <div className="pt-progress">
                                    <div className="pt-progress-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                                  </div>
                                </>
                              ) : (
                                <span className="pt-dash">—</span>
                              )}
                            </td>

                            <td className="pt-td">
                              <span className={bal > 0 ? "pt-red-strong" : "pt-green-strong"}>
                                {fmtINR(bal)}
                              </span>
                            </td>

                            <td className="pt-td">{fmtDate(c.deadline)}</td>

                            <td className="pt-td">
                              {dl !== null ? (
                                <span className="pt-badge" style={{ background: dlBg, color: dlColor }}>
                                  {dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? "Today" : `${dl}d`}
                                </span>
                              ) : (
                                <span className="pt-dash">—</span>
                              )}
                            </td>

                            <td className="pt-td">
                              <span className="pt-badge" style={{ background: sc.bg, color: sc.color }}>
                                {c.status}
                              </span>
                            </td>

                            <td className="pt-td">
                              <span
                                className="pt-badge"
                                style={{
                                  background: pc.bg,
                                  color: pc.color,
                                  border: `1px solid ${pc.border}`,
                                }}
                              >
                                {pc.label}
                              </span>
                            </td>

                            <td className="pt-td pt-action-col">
                              {c.nextAction || <span className="pt-dash">—</span>}
                            </td>

                            <td className="pt-td">
                              <div className="pt-action-buttons">
                                <button className="pt-btn-sm pt-btn-sm-blue" onClick={() => openEdit(c)}>
                                  Edit
                                </button>
                                <button className="pt-btn-sm pt-btn-sm-gray" onClick={() => setSelectedClient(c)}>
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderPaymentLog = () => (
    <div className="pt-panel">
      <div className="pt-toolbar">
        <span className="pt-count-text">
          {payments.length} payment record{payments.length !== 1 ? "s" : ""}
        </span>
        <button
          className="pt-btn pt-btn-primary pt-ml-auto"
          onClick={() => {
            setNewPayment(blankPayment());
            setShowAddPayment(true);
          }}
        >
          + Log New Payment
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="pt-table-wrap">
          <div className="pt-empty">
            <div className="pt-empty-icon">💰</div>
            <div className="pt-empty-title">No payments logged yet</div>
            <div className="pt-empty-sub">Record every payment received to track collections</div>
            <button
              className="pt-btn pt-btn-primary"
              onClick={() => {
                setNewPayment(blankPayment());
                setShowAddPayment(true);
              }}
            >
              + Log First Payment
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-table-wrap">
          <div className="pt-table-scroll">
            <table className="pt-table">
              <thead>
                <tr>
                  {[
                    "#",
                    "Date",
                    "Client",
                    "Project",
                    "Invoice",
                    "Amount",
                    "Mode",
                    "TDS?",
                    "TDS Amt",
                    "Net to NNC",
                    "TDS Cert",
                    "Remarks",
                  ].map((h) => (
                    <th key={h} className="pt-th pt-th-static">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p._id || p.id} className="pt-tr">
                    <td className="pt-td pt-muted-sm">{i + 1}</td>
                    <td className="pt-td">{fmtDate(p.date)}</td>
                    <td className="pt-td pt-strong">{p.client}</td>
                    <td className="pt-td">{p.project}</td>
                    <td className="pt-td">
                      {p.invoice ? <span className="pt-pill green">{p.invoice}</span> : <span className="pt-dash">—</span>}
                    </td>
                    <td className="pt-td pt-green-strong">{fmtINR(p.amount)}</td>
                    <td className="pt-td">{p.mode}</td>
                    <td className="pt-td">
                      <span className="pt-badge" style={{ background: p.tds ? "#FFF7ED" : "#F0FDF4", color: p.tds ? "#C2410C" : "#15803D" }}>
                        {p.tds ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="pt-td">{p.tdsAmt > 0 ? fmtINR(p.tdsAmt) : "—"}</td>
                    <td className="pt-td pt-strong">{fmtINR(p.netAmount)}</td>
                    <td className="pt-td">
                      <span className="pt-badge">{p.tdsStatus}</span>
                    </td>
                    <td className="pt-td">{p.remarks || "—"}</td>
                  </tr>
                ))}

                <tr className="pt-total-row">
                  <td colSpan={5} className="pt-td pt-strong">TOTAL</td>
                  <td className="pt-td pt-green-strong">
                    {fmtINR(payments.reduce((s, p) => s + Number(p.amount || 0), 0))}
                  </td>
                  <td colSpan={3} className="pt-td" />
                  <td className="pt-td pt-strong">
                    {fmtINR(payments.reduce((s, p) => s + Number(p.netAmount || 0), 0))}
                  </td>
                  <td colSpan={2} className="pt-td" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderCalendar = () => {
    const calData = clients
      .filter((c) => c.status !== "Paid" && c.deadline)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    return (
      <div className="pt-panel">
        <div className="pt-toolbar">
          <span className="pt-calendar-title">Follow-Up Schedule</span>
          <span className="pt-count-text">
            {calData.length} pending client{calData.length !== 1 ? "s" : ""}
          </span>
        </div>

        {calData.length === 0 ? (
          <div className="pt-empty pt-table-wrap">
            <div className="pt-empty-icon">📅</div>
            <div className="pt-empty-title">All clear!</div>
            <div className="pt-empty-sub">No pending follow-ups right now</div>
          </div>
        ) : (
          <div className="pt-cal-grid">
            {calData.map((c) => {
              const dl = daysLeft(c.deadline);
              const bal = Number(c.totalValue || 0) - Number(c.received || 0);
              const pc = priCfg[c.priority];
              const dlc =
                dl < 0 ? "#EF4444" : dl <= 3 ? "#EF4444" : dl <= 7 ? "#F97316" : "#22C55E";

              return (
                <div
                  key={c._id || c.id}
                  className="pt-cal-card"
                  style={{ borderLeft: `4px solid ${pc.color}` }}
                  onClick={() => setSelectedClient(c)}
                >
                  <div className="pt-cal-top">
                    <div>
                      <div className="pt-client-name">{c.client}</div>
                      {c.contact && (
                        <div className="pt-mini">
                          {c.contact}
                          {c.city ? ` · ${c.city}` : ""}
                        </div>
                      )}
                    </div>
                    <span
                      className="pt-badge"
                      style={{
                        background: pc.bg,
                        color: pc.color,
                        border: `1px solid ${pc.border}`,
                      }}
                    >
                      {pc.label}
                    </span>
                  </div>

                  <div className="pt-cal-mid">
                    <div>
                      <div className="pt-mini pt-light">Balance to collect</div>
                      <div className="pt-red-strong pt-big">{fmtINR(bal)}</div>
                    </div>

                    <div className="pt-text-right">
                      <div className="pt-mini pt-light">Follow-up by</div>
                      <div className="pt-strong" style={{ color: dlc }}>{fmtDate(c.deadline)}</div>
                      <div className="pt-mini" style={{ color: dlc }}>
                        {dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? "Today!" : `In ${dl} days`}
                      </div>
                    </div>
                  </div>

                  {c.nextAction && <div className="pt-note-box">{c.nextAction}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pt-shell">
      <div className="pt-sidebar-wrap">
        <Sidebar />
      </div>

      <div className="pt-main">
        <div className="pt-wrap">
          <div className="pt-topbar">
            <div className="pt-brand-wrap">
              <div className="pt-logo">NNC</div>
              <div>
                <div className="pt-brand">Nakshatra Namaha Creations Pvt Ltd</div>
                <div className="pt-brand-sub">Payment Tracker & Follow-Up CRM Module</div>
              </div>
            </div>

            <div className="pt-top-badges">
              <span className="pt-top-badge blue">
                {clients.length} Client{clients.length !== 1 ? "s" : ""}
              </span>
              <span className="pt-top-badge green">
                Received: {fmtINR(totalReceived)}
              </span>
            </div>
          </div>

          <div className="pt-kpi-row">
            {[
              ["Total Pipeline", fmtINR(totalPipeline), "#0D1B3E", "#29B6F6", "Confirmed clients only"],
              ["Total Received", fmtINR(totalReceived), "#15803D", "#22C55E", `${collectionPct}% collected`],
              ["Outstanding", fmtINR(totalOutstanding), "#B91C1C", "#EF4444", "Balance to collect"],
              ["Watching", fmtINR(watchValue), "#3730A3", "#6366F1", `${clients.filter((c) => c.priority === "WATCH").length} client(s)`],
            ].map(([label, val, tc, ac, sub]) => (
              <div key={label} className="pt-kpi-card">
                <div className="pt-kpi-accent" style={{ background: ac }} />
                <div className="pt-kpi-label">{label}</div>
                <div className="pt-kpi-val" style={{ color: tc }}>{val}</div>
                <div className="pt-kpi-sub">{sub}</div>
              </div>
            ))}
          </div>

          <div className="pt-tabs">
            {[
              ["tracker", "📋 Tracker"],
              ["paymentlog", "💰 Payment Log"],
              ["calendar", "📅 Follow-Up Calendar"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`pt-tab ${activeTab === key ? "active" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="pt-content">
            {loading ? (
              <div className="pt-loading">Loading...</div>
            ) : (
              <>
                {activeTab === "tracker" && renderTracker()}
                {activeTab === "paymentlog" && renderPaymentLog()}
                {activeTab === "calendar" && renderCalendar()}
              </>
            )}
          </div>

          {selectedClient && (
            <>
              <div className="pt-overlay" onClick={() => setSelectedClient(null)} />
              <div className="pt-drawer">
                <button className="pt-close-btn" onClick={() => setSelectedClient(null)}>
                  ✕
                </button>

                <div className="pt-drawer-title">{selectedClient.client}</div>

                {selectedClient.contact && (
                  <div className="pt-drawer-sub">
                    {selectedClient.contact}
                    {selectedClient.city ? ` · ${selectedClient.city}` : ""}
                  </div>
                )}

                <div className="pt-drawer-badges">
                  <span
                    className="pt-badge"
                    style={{
                      background: priCfg[selectedClient.priority].bg,
                      color: priCfg[selectedClient.priority].color,
                      border: `1px solid ${priCfg[selectedClient.priority].border}`,
                    }}
                  >
                    {priCfg[selectedClient.priority].label}
                  </span>

                  <span
                    className="pt-badge"
                    style={{
                      background: (stsCfg[selectedClient.status] || stsCfg.Pending).bg,
                      color: (stsCfg[selectedClient.status] || stsCfg.Pending).color,
                    }}
                  >
                    {selectedClient.status}
                  </span>

                  {selectedClient.category && (
                    <span className="pt-pill blue">{selectedClient.category}</span>
                  )}
                </div>

                {[
                  ["Project", selectedClient.project || "—"],
                  ["Proposal Date", fmtDate(selectedClient.proposalDate)],
                  ["Total Value", fmtINR(selectedClient.totalValue)],
                  ["Amount Received", fmtINR(selectedClient.received)],
                  ["Balance Outstanding", fmtINR(Number(selectedClient.totalValue || 0) - Number(selectedClient.received || 0))],
                  ["GST (18%)", fmtINR(Number(selectedClient.totalValue || 0) * 0.18)],
                  ["Total incl. GST", fmtINR(Number(selectedClient.totalValue || 0) * 1.18)],
                  ["Follow-up Deadline", fmtDate(selectedClient.deadline)],
                  ["Days Remaining", selectedClient.deadline ? `${daysLeft(selectedClient.deadline)} days` : "—"],
                  ["Last Follow-up", fmtDate(selectedClient.lastFollowUp)],
                ].map(([label, val]) => (
                  <div key={label} className="pt-info-row">
                    <span className="pt-info-label">{label}</span>
                    <span className="pt-info-val">{val}</span>
                  </div>
                ))}

                {selectedClient.nextAction && (
                  <div className="pt-note-card">
                    <div className="pt-note-title">NEXT ACTION</div>
                    <div>{selectedClient.nextAction}</div>
                  </div>
                )}

                {selectedClient.notes && (
                  <div className="pt-notes-card">
                    <div className="pt-note-title orange">NOTES</div>
                    <div>{selectedClient.notes}</div>
                  </div>
                )}

                <div className="pt-drawer-actions">
                  <button
                    className="pt-btn pt-btn-primary pt-grow"
                    onClick={() => {
                      openEdit(selectedClient);
                      setSelectedClient(null);
                    }}
                  >
                    Edit Client
                  </button>

                  <button
                    className="pt-btn pt-btn-accent pt-grow"
                    onClick={() => {
                      setNewPayment({
                        ...blankPayment(),
                        clientId: selectedClient._id || selectedClient.id,
                        client: selectedClient.client,
                        project: selectedClient.project || "",
                      });
                      setShowAddPayment(true);
                      setSelectedClient(null);
                    }}
                  >
                    Log Payment
                  </button>
                </div>

                <button
                  className="pt-btn pt-btn-danger pt-full"
                  onClick={() => deleteClient(selectedClient._id || selectedClient.id)}
                >
                  Delete Client
                </button>
              </div>
            </>
          )}

          {showAddClient && (
            <div className="pt-modal" onClick={() => setShowAddClient(false)}>
              <ClientForm
                data={newClient}
                onChange={setNewClient}
                onSave={saveNewClient}
                onCancel={() => setShowAddClient(false)}
                title="+ Add New Client"
              />
            </div>
          )}

          {showEditModal && editData && (
            <div className="pt-modal" onClick={() => setShowEditModal(false)}>
              <ClientForm
                data={editData}
                onChange={setEditData}
                onSave={saveEdit}
                onCancel={() => setShowEditModal(false)}
                title={`✏️ Edit — ${editData.client}`}
              />
            </div>
          )}

          {showAddPayment && (
            <div className="pt-modal" onClick={() => setShowAddPayment(false)}>
              <PaymentForm
                newPayment={newPayment}
                setNewPayment={setNewPayment}
                savePayment={savePayment}
                setShowAddPayment={setShowAddPayment}
                clients={clients}
                handlePaymentClientChange={handlePaymentClientChange}
              />
            </div>
          )}

          {notif && <div className="pt-notif">{notif}</div>}
        </div>
      </div>
    </div>
  );
}