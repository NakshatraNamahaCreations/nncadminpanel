import { useCallback, useEffect, useState } from "react";
import {
  Shield, AlertTriangle, Receipt, TrendingUp,
  Plus, Minus, Trash2, RefreshCcw, X, Save,
  ArrowDownCircle, ArrowUpCircle, Info, ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./FundsPage.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
function auth() { const t = localStorage.getItem("nnc_token"); return t ? { Authorization: `Bearer ${t}` } : {}; }
function fmtFull(n) { return `₹${(Number(n) || 0).toLocaleString("en-IN")}`; }
function fmtINR(n) {
  const v = Number(n) || 0;
  if (v >= 10000000) return `₹${(v/10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v/100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v/1000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
}
function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}
function pct(a, b) { return b > 0 ? Math.min(Math.round(a / b * 100), 100) : 0; }

// ── Fund metadata ─────────────────────────────────────────────────────────────
const FUNDS_META = {
  buffer:    { icon: Shield,        color:"#3b82f6", bg:"#1e3a5f", label:"Operating Buffer",         purpose:"Keeps the business running if revenue drops — covers rent, salaries, utilities." },
  emergency: { icon: AlertTriangle, color:"#f59e0b", bg:"#451a03", label:"Emergency / Accident Fund", purpose:"Equipment failure, legal issues, medical. Never touch for regular expenses." },
  tax:       { icon: Receipt,       color:"#8b5cf6", bg:"#2e1065", label:"Tax Reserve",              purpose:"Advance tax, GST, ITR. Build every month from net profit." },
  growth:    { icon: TrendingUp,    color:"#10b981", bg:"#064e3b", label:"Growth / Investment Fund",  purpose:"Hiring, equipment, marketing, new services — fuel for scaling." },
};

// ── Custom tooltip ────────────────────────────────────────────────────────────
function CT({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="fd-ct">
      <div className="fd-ct-label">{label}</div>
      {payload.map((p,i) => (
        <div key={i} className="fd-ct-row">
          <span className="fd-ct-dot" style={{background:p.color}}/>
          <span className="fd-ct-name">{p.name}</span>
          <strong className="fd-ct-val">{fmtFull(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

// ── Add Transaction Modal ─────────────────────────────────────────────────────
function TxModal({ fund, config, onClose, onSave }) {
  const meta = FUNDS_META[fund.id];
  const [type, setType]     = useState("deposit");
  const [amount, setAmount] = useState("");
  const [date, setDate]     = useState(new Date().toISOString().slice(0,10));
  const [note, setNote]     = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  const maxWithdraw = fund.balance;

  async function save() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setErr("Enter a valid positive amount"); return; }
    if (type === "withdrawal" && Number(amount) > maxWithdraw) {
      setErr(`Cannot withdraw more than current balance (${fmtFull(maxWithdraw)})`);
      return;
    }
    setSaving(true); setErr("");
    try {
      const res = await fetch(`${API}/api/bi/funds/transaction`, {
        method: "POST",
        headers: { "Content-Type":"application/json", ...auth() },
        body: JSON.stringify({ fundId:fund.id, type, amount:Number(amount), date, note }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      onSave();
      onClose();
    } catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fd-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="fd-modal">
        <div className="fd-modal-head" style={{borderColor: meta.color}}>
          <div className="fd-modal-fund-name">
            <meta.icon size={18} color={meta.color}/>
            <span>{meta.label}</span>
          </div>
          <button className="fd-modal-close" onClick={onClose}><X size={16}/></button>
        </div>

        <div className="fd-modal-body">
          {/* Type toggle */}
          <div className="fd-type-toggle">
            <button
              className={`fd-type-btn fd-deposit${type==="deposit"?" active":""}`}
              onClick={()=>setType("deposit")}>
              <ArrowDownCircle size={16}/> Deposit
            </button>
            <button
              className={`fd-type-btn fd-withdraw${type==="withdrawal"?" active":""}`}
              onClick={()=>setType("withdrawal")}>
              <ArrowUpCircle size={16}/> Withdrawal
            </button>
          </div>

          <div className="fd-modal-balance-row">
            <span>Current Balance</span>
            <strong style={{color: meta.color}}>{fmtFull(fund.balance)}</strong>
          </div>

          <div className="fd-form-row">
            <label>Amount (₹)</label>
            <input
              type="number" min="1" step="100"
              placeholder="e.g. 25000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="fd-input"
            />
          </div>

          <div className="fd-form-row">
            <label>Date</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="fd-input"/>
          </div>

          <div className="fd-form-row">
            <label>Note (optional)</label>
            <input
              type="text" placeholder="e.g. Monthly allocation from profit"
              value={note} onChange={e=>setNote(e.target.value)}
              className="fd-input"
            />
          </div>

          {/* Preview */}
          {Number(amount) > 0 && (
            <div className="fd-preview">
              <span>New balance after this {type}:</span>
              <strong style={{color: type==="deposit"?"#10b981":"#ef4444"}}>
                {fmtFull(type==="deposit"
                  ? fund.balance + Number(amount)
                  : Math.max(0, fund.balance - Number(amount)))}
              </strong>
            </div>
          )}

          {err && <div className="fd-err">{err}</div>}
        </div>

        <div className="fd-modal-foot">
          <button className="fd-btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className={`fd-btn-save ${type==="withdrawal"?"fd-btn-withdraw":""}`}
            onClick={save} disabled={saving}>
            <Save size={14}/>
            {saving ? "Saving…" : type==="deposit" ? "Add Deposit" : "Record Withdrawal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════════
export default function FundsPage() {
  const [data,   setData]   = useState(null);
  const [loading,setLoading]= useState(false);
  const [err,    setErr]    = useState("");
  const [selFund,setSelFund]= useState("buffer");
  const [txModal,setTxModal]= useState(false);
  const [delConfirm,setDelConfirm] = useState(null); // tx to delete

  const fetchAll = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${API}/api/bi/funds`, { headers: auth() });
      const j = await r.json();
      if (!j.success) throw new Error(j.message);
      setData(j.data);
    } catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function deleteTx(id) {
    try {
      const r = await fetch(`${API}/api/bi/funds/transaction/${id}`, { method:"DELETE", headers:auth() });
      const j = await r.json();
      if (!j.success) throw new Error(j.message);
      setDelConfirm(null);
      fetchAll();
    } catch(e) { alert(e.message); }
  }

  if (loading) return (
    <div className="fd-page">
      <Sidebar/>
      <div className="fd-main"><div className="fd-loading"><RefreshCcw size={24} className="fd-spin"/> Loading funds…</div></div>
    </div>
  );
  if (err) return (
    <div className="fd-page"><Sidebar/><div className="fd-main"><div className="fd-err-main">{err}</div></div></div>
  );
  if (!data) return null;

  const { funds, config } = data;
  const fundMap = {};
  funds.forEach(f => { fundMap[f.id] = f; });
  const activeFund = fundMap[selFund];
  const activeMeta = FUNDS_META[selFund];

  // Target for selected fund (from config)
  function getFundTarget(fid) {
    if (!config) return 0;
    const avgOpex = 200000; // fallback — shown for reference; real value from BI dashboard
    if (fid === "buffer")    return config.bufferMonths * avgOpex;
    if (fid === "emergency") return 0; // target shown as text only without annual rev
    if (fid === "tax")       return 0;
    if (fid === "growth")    return 0;
    return 0;
  }

  // Overall totals
  const totalBalance = funds.reduce((s,f)=>s+f.balance, 0);
  const totalTx      = funds.reduce((s,f)=>s+f.txCount, 0);

  return (
    <div className="fd-page">
      <Sidebar/>
      <div className="fd-main">

        {/* Header */}
        <div className="fd-header">
          <div>
            <h1 className="fd-title">Reserve Fund Manager</h1>
            <p className="fd-subtitle">Track every rupee in your Buffer · Emergency · Tax · Growth accounts</p>
          </div>
          <div className="fd-header-right">
            <div className="fd-total-badge">
              Total Reserved: <strong>{fmtFull(totalBalance)}</strong>
            </div>
            <button className="fd-icon-btn" onClick={fetchAll} title="Refresh">
              <RefreshCcw size={15}/>
            </button>
          </div>
        </div>

        {/* ── 4 Fund Summary Cards ── */}
        <div className="fd-cards-grid">
          {funds.map(f => {
            const meta   = FUNDS_META[f.id];
            const funded = f.balance > 0 ? "partial" : "empty";
            const active = selFund === f.id;
            return (
              <button
                key={f.id}
                className={`fd-card${active?" fd-card-active":""}`}
                style={{ "--accent": meta.color }}
                onClick={() => setSelFund(f.id)}
              >
                <div className="fd-card-top">
                  <div className="fd-card-icon" style={{background: meta.bg}}>
                    <meta.icon size={20} color={meta.color}/>
                  </div>
                  <div className="fd-card-label">{meta.label}</div>
                  {active && <ChevronRight size={14} className="fd-card-arrow"/>}
                </div>
                <div className="fd-card-balance" style={{color: meta.color}}>
                  {fmtINR(f.balance)}
                </div>
                <div className="fd-card-txcount">{f.txCount} transaction{f.txCount!==1?"s":""}</div>
              </button>
            );
          })}
        </div>

        {/* ── Selected Fund Detail ── */}
        {activeFund && (
          <div className="fd-detail">

            {/* Detail header */}
            <div className="fd-detail-head">
              <div className="fd-detail-title">
                <activeMeta.icon size={22} color={activeMeta.color}/>
                <span>{activeMeta.label}</span>
              </div>
              <button
                className="fd-add-btn"
                style={{background: activeMeta.color}}
                onClick={() => setTxModal(true)}>
                <Plus size={15}/> Add Transaction
              </button>
            </div>

            {/* Balance + purpose */}
            <div className="fd-detail-top">
              <div className="fd-balance-block">
                <div className="fd-balance-label">Current Balance</div>
                <div className="fd-balance-val" style={{color: activeMeta.color}}>
                  {fmtFull(activeFund.balance)}
                </div>
              </div>
              <div className="fd-purpose-block">
                <Info size={14} color="#64748b"/>
                <span>{activeMeta.purpose}</span>
              </div>
            </div>

            {/* Balance chart */}
            {activeFund.history.some(h=>h.balance>0) && (
              <div className="fd-chart-wrap">
                <div className="fd-chart-label">Balance History (12 Months)</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={activeFund.history}>
                    <defs>
                      <linearGradient id={`g${selFund}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={activeMeta.color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={activeMeta.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                    <XAxis dataKey="label" tick={{fontSize:10,fill:"#64748b"}} interval={1}/>
                    <YAxis tickFormatter={v=>fmtINR(v)} tick={{fontSize:10,fill:"#64748b"}} width={70}/>
                    <Tooltip content={<CT/>}/>
                    <Area
                      type="monotone" dataKey="balance" name="Balance ₹"
                      stroke={activeMeta.color} fill={`url(#g${selFund})`} strokeWidth={2}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Transaction history */}
            <div className="fd-tx-section">
              <div className="fd-tx-head">
                <span className="fd-tx-title">Transaction History</span>
                <span className="fd-tx-count">{activeFund.txCount} records</span>
              </div>

              {activeFund.transactions.length === 0 ? (
                <div className="fd-tx-empty">
                  <activeMeta.icon size={36} color="#1e293b"/>
                  <p>No transactions yet.</p>
                  <p>Click <strong>Add Transaction</strong> to record your first deposit.</p>
                </div>
              ) : (
                <div className="fd-tx-table-wrap">
                  <table className="fd-tx-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Note</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeFund.transactions.map((tx, i) => {
                        const isDeposit = tx.type === "deposit";
                        return (
                          <tr key={tx._id}>
                            <td className="fd-tx-date">{fmtDate(tx.date)}</td>
                            <td>
                              <span className={`fd-tx-type ${isDeposit?"fd-dep":"fd-wit"}`}>
                                {isDeposit
                                  ? <><ArrowDownCircle size={12}/> Deposit</>
                                  : <><ArrowUpCircle size={12}/> Withdrawal</>}
                              </span>
                            </td>
                            <td className={`fd-tx-amt ${isDeposit?"fd-amt-pos":"fd-amt-neg"}`}>
                              {isDeposit ? "+" : "−"}{fmtFull(tx.amount)}
                            </td>
                            <td className="fd-tx-note">{tx.note || "—"}</td>
                            <td>
                              <button
                                className="fd-del-btn"
                                onClick={() => setDelConfirm(tx)}
                                title="Delete">
                                <Trash2 size={13}/>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Add Transaction Modal */}
      {txModal && activeFund && (
        <TxModal
          fund={activeFund}
          config={config}
          onClose={() => setTxModal(false)}
          onSave={fetchAll}
        />
      )}

      {/* Delete Confirm */}
      {delConfirm && (
        <div className="fd-overlay" onClick={()=>setDelConfirm(null)}>
          <div className="fd-del-modal" onClick={e=>e.stopPropagation()}>
            <div className="fd-del-title">Delete Transaction?</div>
            <div className="fd-del-body">
              <div className={`fd-tx-type ${delConfirm.type==="deposit"?"fd-dep":"fd-wit"}`} style={{display:"inline-flex",marginBottom:8}}>
                {delConfirm.type === "deposit" ? "Deposit" : "Withdrawal"}: <strong>&nbsp;{fmtFull(delConfirm.amount)}</strong>
              </div>
              <div style={{color:"#64748b",fontSize:13}}>{fmtDate(delConfirm.date)}{delConfirm.note ? ` · ${delConfirm.note}` : ""}</div>
              <div className="fd-del-warn">This will recalculate the fund balance. This cannot be undone.</div>
            </div>
            <div className="fd-del-foot">
              <button className="fd-btn-cancel" onClick={()=>setDelConfirm(null)}>Cancel</button>
              <button className="fd-btn-del" onClick={()=>deleteTx(delConfirm._id)}>
                <Trash2 size={14}/> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
