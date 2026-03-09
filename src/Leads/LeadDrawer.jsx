import React, { useEffect, useMemo, useState } from "react";
import "./LeadDrawer.css";

const money = (n) => {
  try {
    if (n == null) return "₹0";
    return `₹${Number(n).toLocaleString("en-IN")}`;
  } catch {
    return "₹0";
  }
};

const chipCls = (s = "") => String(s).toLowerCase().replace(/\s+/g, "-");

const formatDateTime = (value) => {
  try {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  } catch {
    return "-";
  }
};

const formatDate = (value) => {
  try {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  } catch {
    return "-";
  }
};

const getInitials = (name = "") => {
  try {
    if (!name) return "L";
    return String(name)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("");
  } catch {
    return "L";
  }
};

const EmptyState = ({ title, sub }) => {
  return (
    <div className="ldEmpty">
      <div className="ldEmptyIcon">◎</div>
      <div className="ldEmptyTitle">{title}</div>
      <div className="ldEmptySub">{sub}</div>
    </div>
  );
};

export default function LeadDrawer({ open, leadId, apiBase, onClose }) {
  const [activeTab, setActiveTab] = useState("Profile");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [lead, setLead] = useState(null);

  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [logOpen, setLogOpen] = useState(false);
  const [logType, setLogType] = useState("Outbound Call");
  const [logSummary, setLogSummary] = useState("");
  const [logSaving, setLogSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [docTag, setDocTag] = useState("Invoice");

  const [followupOpen, setFollowupOpen] = useState(false);
  const [followupSaving, setFollowupSaving] = useState(false);
  const [followupForm, setFollowupForm] = useState({
    dayIndex: "",
    title: "",
    channel: "Call",
    status: "Pending",
    dueDate: "",
    done: false,
  });

  const headerSubtitle = useMemo(() => {
    try {
      if (!lead) return "";
      const parts = [];
      if (lead.industry) parts.push(lead.industry);
      if (lead.branch) parts.push(lead.branch);
      if (lead.rep) parts.push(`Owner: ${lead.rep}`);
      return parts.join(" • ");
    } catch {
      return "";
    }
  }, [lead]);

  const statCards = useMemo(() => {
    try {
      return [
        {
          label: "Deal Value",
          value: money(lead?.value || 0),
        },
        {
          label: "Docs",
          value: String(lead?.documents?.length || lead?.docs || 0),
        },
        {
          label: "Follow-ups",
          value: String(lead?.followups?.length || 0),
        },
        {
          label: "Notes",
          value: String(lead?.notes?.length || 0),
        },
      ];
    } catch {
      return [];
    }
  }, [lead]);

  const fetchLead = async () => {
    try {
      if (!leadId) return;

      setLoading(true);
      setErr("");

      const token = localStorage.getItem("nnc_token");

      const res = await fetch(`${apiBase}/api/leads/${leadId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to fetch lead");
      }

      setLead(json.data);
      setActiveTab("Profile");
    } catch (e) {
      setErr(e.message || "Failed to fetch lead");
      setLead(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      if (open && leadId) {
        fetchLead();
      }
    } catch (error) {
      console.error(error);
    }
  }, [open, leadId]);

  const close = () => {
    try {
      setLogOpen(false);
      setLogSummary("");
      setNoteText("");
      setFollowupOpen(false);
      setFollowupForm({
        dayIndex: "",
        title: "",
        channel: "Call",
        status: "Pending",
        dueDate: "",
        done: false,
      });
      onClose?.();
    } catch (error) {
      console.error(error);
    }
  };

  const saveNote = async () => {
    try {
      if (!noteText.trim()) return;

      setSavingNote(true);

      const token = localStorage.getItem("nnc_token");

      const res = await fetch(`${apiBase}/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: noteText, by: lead?.rep || "User" }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to save note");
      }

      setLead((prev) => ({ ...prev, notes: json.data }));
      setNoteText("");
    } catch (e) {
      alert(e.message || "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const addLog = async () => {
    try {
      if (!logSummary.trim()) return;

      setLogSaving(true);

      const token = localStorage.getItem("nnc_token");

      const res = await fetch(`${apiBase}/api/leads/${leadId}/comms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: logType,
          summary: logSummary,
          by: lead?.rep || "User",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to add log");
      }

      setLead((prev) => ({ ...prev, commLogs: json.data }));
      setLogSummary("");
      setLogOpen(false);
    } catch (e) {
      alert(e.message || "Failed to add log");
    } finally {
      setLogSaving(false);
    }
  };

  const addFollowup = async () => {
    try {
      if (!followupForm.title.trim()) {
        alert("Follow-up title is required");
        return;
      }

      setFollowupSaving(true);

      const token = localStorage.getItem("nnc_token");

      const res = await fetch(`${apiBase}/api/leads/${leadId}/followups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          dayIndex: followupForm.dayIndex ? Number(followupForm.dayIndex) : undefined,
          title: followupForm.title,
          channel: followupForm.channel,
          status: followupForm.status,
          dueDate: followupForm.dueDate || null,
          done: followupForm.done,
          by: lead?.rep || "User",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to add follow-up");
      }

      setLead((prev) => ({ ...prev, followups: json.data }));
      setFollowupOpen(false);
      setFollowupForm({
        dayIndex: "",
        title: "",
        channel: "Call",
        status: "Pending",
        dueDate: "",
        done: false,
      });
    } catch (e) {
      alert(e.message || "Failed to add follow-up");
    } finally {
      setFollowupSaving(false);
    }
  };

  const uploadDoc = async (file) => {
    try {
      if (!file) return;

      setUploading(true);

      const token = localStorage.getItem("nnc_token");

      const fd = new FormData();
      fd.append("file", file);
      fd.append("tag", docTag);
      fd.append("by", lead?.rep || "User");
      fd.append("name", file.name);

      const res = await fetch(`${apiBase}/api/leads/${leadId}/docs`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to upload document");
      }

      setLead((prev) => ({
        ...prev,
        documents: json.data,
        docs: json.data?.length || 0,
      }));
      setActiveTab("Docs");
    } catch (e) {
      alert(e.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="ldOverlay" onClick={close}>
      <div className="ldPanel" onClick={(e) => e.stopPropagation()}>
        <div className="ldHeader">
          <div className="ldHeaderTop">
            <div className="ldAvatar">{getInitials(lead?.name)}</div>

            <div className="ldHeaderInfo">
              <div className="ldTitleRow">
                <div className="ldTitle">{lead?.name || "Lead"}</div>
                <span className={`ldBadge ${chipCls(lead?.priority || "Hot")}`}>
                  {lead?.priority || "Hot"}
                </span>
              </div>

              <div className="ldSub">{headerSubtitle || "Lead details and activity overview"}</div>

              <div className="ldChips">
                <span className={`ldChip stage ${chipCls(lead?.stage)}`}>
                  {lead?.stage || "Lead Capture"}
                </span>
                <span className="ldChip light">{lead?.source || "Direct"}</span>
                <span className="ldValue">{money(lead?.value || 0)}</span>
              </div>
            </div>
          </div>

          <button className="ldClose" type="button" onClick={close}>
            ×
          </button>
        </div>

        <div className="ldStats">
          {statCards.map((item, idx) => (
            <div className="ldStatCard" key={idx}>
              <div className="ldStatLabel">{item.label}</div>
              <div className="ldStatValue">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="ldTabs">
          {["Profile", "BANT", "Follow-up", "Calls/WA", "History", "Docs", "Notes"].map((t) => (
            <button
              key={t}
              type="button"
              className={`ldTab ${activeTab === t ? "active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="ldBody">
          {loading ? (
            <div className="ldLoadingWrap">
              <div className="ldLoader" />
              <div className="ldLoading">Loading lead details...</div>
            </div>
          ) : null}

          {err ? <div className="ldError">{err}</div> : null}

          {!loading && !err && lead ? (
            <>
              {activeTab === "Profile" && <ProfileTab lead={lead} />}
              {activeTab === "BANT" && <BantTab lead={lead} />}
              {activeTab === "Follow-up" && (
                <FollowupTab
                  lead={lead}
                  followupOpen={followupOpen}
                  setFollowupOpen={setFollowupOpen}
                  followupForm={followupForm}
                  setFollowupForm={setFollowupForm}
                  followupSaving={followupSaving}
                  addFollowup={addFollowup}
                />
              )}
              {activeTab === "Calls/WA" && (
                <CallsTab
                  lead={lead}
                  logOpen={logOpen}
                  setLogOpen={setLogOpen}
                  logType={logType}
                  setLogType={setLogType}
                  logSummary={logSummary}
                  setLogSummary={setLogSummary}
                  logSaving={logSaving}
                  addLog={addLog}
                />
              )}
              {activeTab === "History" && <HistoryTab lead={lead} />}
              {activeTab === "Docs" && (
                <DocsTab
                  lead={lead}
                  uploading={uploading}
                  docTag={docTag}
                  setDocTag={setDocTag}
                  uploadDoc={uploadDoc}
                  apiBase={apiBase}
                />
              )}
              {activeTab === "Notes" && (
                <NotesTab
                  lead={lead}
                  noteText={noteText}
                  setNoteText={setNoteText}
                  savingNote={savingNote}
                  saveNote={saveNote}
                />
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InfoGridCard({ title, children }) {
  return (
    <div className="ldCard">
      <div className="ldSectionTitle">{title}</div>
      {children}
    </div>
  );
}

function ProfileTab({ lead }) {
  const timestamps = lead.stageTimestamps || [];

  return (
    <div className="ldTabStack">
      <InfoGridCard title="CONTACT DETAILS">
        <div className="ldGrid2">
          <div className="ldInfoItem">
            <div className="ldLabel">Phone</div>
            <div className="ldVal">{lead.phone || "-"}</div>
          </div>
          <div className="ldInfoItem">
            <div className="ldLabel">Email</div>
            <div className="ldVal">{lead.email || "-"}</div>
          </div>
          <div className="ldInfoItem">
            <div className="ldLabel">Business</div>
            <div className="ldVal">{lead.business || "-"}</div>
          </div>
          <div className="ldInfoItem">
            <div className="ldLabel">Industry</div>
            <div className="ldVal">{lead.industry || "-"}</div>
          </div>
          <div className="ldInfoItem">
            <div className="ldLabel">Location</div>
            <div className="ldVal">{lead.location || "-"}</div>
          </div>
          <div className="ldInfoItem">
            <div className="ldLabel">Source</div>
            <div className="ldVal">{lead.source || "-"}</div>
          </div>
          <div className="ldInfoItem">
            <div className="ldLabel">Rep</div>
            <div className="ldVal">{lead.rep || "-"}</div>
          </div>
          <div className="ldInfoItem">
            <div className="ldLabel">Branch</div>
            <div className="ldVal">{lead.branch || "-"}</div>
          </div>
        </div>
      </InfoGridCard>

      <InfoGridCard title="STAGE TIMESTAMPS">
        {timestamps.length ? (
          <div className="ldList">
            {timestamps.map((s, idx) => (
              <div key={idx} className={`ldRow ${s.done ? "done" : ""}`}>
                <div className="ldRowLeft">
                  <span className="ldRowIcon">{s.done ? "✔" : "•"}</span>
                  <div>
                    <div className="ldRowTitle">{s.label}</div>
                    <div className="ldSmall">{formatDateTime(s.at)}</div>
                  </div>
                </div>
                <div className="ldRowRight">
                  <span className={`ldTick ${s.done ? "ok" : ""}`}>{s.done ? "Done" : "Open"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No stage history yet" sub="Stage timestamps will appear here." />
        )}
      </InfoGridCard>
    </div>
  );
}

function BantTab({ lead }) {
  const raw = lead.bantDetails || {};

  const readText = (v) => {
    try {
      if (v == null) return "—";
      if (typeof v === "object") return v.text || "—";
      return String(v) || "—";
    } catch {
      return "—";
    }
  };

  const score =
    typeof raw.score === "number"
      ? raw.score
      : String(raw.score || "").includes("/")
      ? Number(String(raw.score).split("/")[0]) || 0
      : Number(raw.score || 0);

  const bantItems = [
    {
      title: "B — Budget",
      value:
        raw.budgetMin || raw.budgetMax
          ? `₹${raw.budgetMin || 0} – ₹${raw.budgetMax || 0}`
          : "—",
      footer: "Budget range captured",
    },
    {
      title: "A — Authority",
      value:
        readText(raw.authorityName) !== "—"
          ? `${readText(raw.authorityName)} (${readText(raw.authorityRole)})`
          : "—",
      footer: "Decision authority noted",
    },
    {
      title: "N — Need",
      value: readText(raw.need),
      footer: "Business need identified",
    },
    {
      title: "T — Timeline",
      value: readText(raw.timeline),
      footer: "Timeline available",
    },
  ];

  return (
    <div className="ldTabStack">
      <div className="bantHero">
        <div className="bantHeroLeft">
          <div className="bantHeroLabel">BANT SCORE</div>
          <div className="bantBig">{score} / 4</div>
          <div className="bantSub">
            {lead.priority || "Hot"} Lead • {lead.stage || "Lead Capture"}
          </div>
        </div>
        <div className="bantRing">
          <span>{score}</span>
        </div>
      </div>

      <div className="bantGrid">
        {bantItems.map((item, idx) => (
          <div key={idx} className="bantCard">
            <div className="bantHead">{item.title}</div>
            <div className="bantText">{item.value}</div>
            <div className="bantOk">{item.footer}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FollowupTab({
  lead,
  followupOpen,
  setFollowupOpen,
  followupForm,
  setFollowupForm,
  followupSaving,
  addFollowup,
}) {
  const items = lead.followups || [];

  return (
    <div className="ldTabStack">
      <div className="ldCard">
        <div className="ldTopRow">
          <div className="ldSectionTitle">10-DAY CADENCE</div>
          <button className="ldBtn" type="button" onClick={() => setFollowupOpen((p) => !p)}>
            {followupOpen ? "Close Form" : "+ Add Follow Up"}
          </button>
        </div>

        {followupOpen ? (
          <div className="logBox">
            <input
              type="number"
              placeholder="Day Index"
              value={followupForm.dayIndex}
              onChange={(e) =>
                setFollowupForm((prev) => ({ ...prev, dayIndex: e.target.value }))
              }
            />

            <input
              type="text"
              placeholder="Follow-up title"
              value={followupForm.title}
              onChange={(e) =>
                setFollowupForm((prev) => ({ ...prev, title: e.target.value }))
              }
            />

            <select
              value={followupForm.channel}
              onChange={(e) =>
                setFollowupForm((prev) => ({ ...prev, channel: e.target.value }))
              }
            >
              <option>Call</option>
              <option>WhatsApp</option>
              <option>Email</option>
              <option>Meeting</option>
            </select>

            <select
              value={followupForm.status}
              onChange={(e) =>
                setFollowupForm((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <option>Pending</option>
              <option>Closed</option>
              <option>Rescheduled</option>
            </select>

            <input
              type="date"
              value={followupForm.dueDate}
              onChange={(e) =>
                setFollowupForm((prev) => ({ ...prev, dueDate: e.target.value }))
              }
            />

            <label className="ldCheckboxRow">
              <input
                type="checkbox"
                checked={followupForm.done}
                onChange={(e) =>
                  setFollowupForm((prev) => ({ ...prev, done: e.target.checked }))
                }
              />
              <span>Mark as done</span>
            </label>

            <button
              className="ldBtn primary"
              type="button"
              disabled={followupSaving}
              onClick={addFollowup}
            >
              {followupSaving ? "Saving..." : "Save Follow Up"}
            </button>
          </div>
        ) : null}

        {items.length ? (
          <div className="ldList">
            {items.map((f, idx) => (
              <div key={idx} className={`fuRow ${f.done ? "done" : ""}`}>
                <div className="fuDay">Day {f.dayIndex || "-"}</div>

                <div className="fuMid">
                  <div className="fuTitle">{f.title}</div>
                  <div className="fuSub">
                    {f.channel || "-"}
                    {f.dueDate ? ` • ${formatDate(f.dueDate)}` : ""}
                  </div>
                </div>

                <div className="fuRight">
                  <span className={`fuStatus ${String(f.status || "").toLowerCase()}`}>
                    {f.status || "Pending"} {f.done ? "✓" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No follow-ups added" sub="Create a follow-up to keep this lead warm." />
        )}
      </div>
    </div>
  );
}

function CallsTab({
  lead,
  logOpen,
  setLogOpen,
  logType,
  setLogType,
  logSummary,
  setLogSummary,
  logSaving,
  addLog,
}) {
  const items = lead.commLogs || [];

  return (
    <div className="ldTabStack">
      <div className="ldCard">
        <div className="ldTopRow">
          <div className="ldSectionTitle">COMMUNICATION LOG</div>
          <button className="ldBtn" type="button" onClick={() => setLogOpen((p) => !p)}>
            {logOpen ? "Close Form" : "+ Log"}
          </button>
        </div>

        {logOpen ? (
          <div className="logBox">
            <select value={logType} onChange={(e) => setLogType(e.target.value)}>
              <option>Outbound Call</option>
              <option>WhatsApp</option>
              <option>Proposal Sent</option>
            </select>

            <textarea
              placeholder="Write summary..."
              value={logSummary}
              onChange={(e) => setLogSummary(e.target.value)}
            />

            <button className="ldBtn primary" type="button" disabled={logSaving} onClick={addLog}>
              {logSaving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : null}

        {items.length ? (
          <div className="ldList">
            {items.map((c, idx) => (
              <div key={idx} className="commCard">
                <div className="commTop">
                  <div className="commType">{c.type || "Communication"}</div>
                  <div className="commRight">{c.durationMin ? `${c.durationMin} min` : ""}</div>
                </div>
                <div className="commSum">{c.summary}</div>
                <div className="commMeta">
                  {formatDateTime(c.at)} {c.by ? `• ${c.by}` : ""}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No communication logs" sub="Calls, WhatsApp and proposals will show here." />
        )}
      </div>
    </div>
  );
}

function HistoryTab({ lead }) {
  const items = lead.history || [];

  return (
    <div className="ldTabStack">
      <div className="ldCard">
        <div className="ldSectionTitle">ACTIVITY TIMELINE</div>

        {items.length ? (
          <div className="historyList">
            {items.map((h, idx) => (
              <div key={idx} className="histRow">
                <div className="histDot" />
                <div className="histBody">
                  <div className="histTitle">{h.title}</div>
                  <div className="histMeta">
                    {h.meta ? <span>{h.meta}</span> : null}
                    <span>{h.at ? ` • ${formatDateTime(h.at)}` : ""}</span>
                    <span>{h.by ? ` • ${h.by}` : ""}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No history yet" sub="Lead activity timeline will appear here." />
        )}
      </div>
    </div>
  );
}

function DocsTab({ lead, uploading, docTag, setDocTag, uploadDoc, apiBase }) {
  const docs = lead.documents || [];

  return (
    <div className="ldTabStack">
      <div className="ldCard">
        <div className="ldTopRow">
          <div className="ldSectionTitle">DOCUMENTS ({docs.length})</div>

          <div className="docUpload">
            <select value={docTag} onChange={(e) => setDocTag(e.target.value)}>
              <option>Invoice</option>
              <option>Quotation</option>
              <option>MoM</option>
              <option>Client Input</option>
            </select>

            <label className="ldBtn primary">
              {uploading ? "Uploading..." : "+ Upload"}
              <input
                type="file"
                style={{ display: "none" }}
                onChange={(e) => uploadDoc(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>

        {docs.length ? (
          <div className="ldList">
            {docs.map((d, idx) => (
              <a
                key={idx}
                className="docCard"
                href={`${apiBase}${d.url}`}
                target="_blank"
                rel="noreferrer"
              >
                <div className="docLeft">
                  <div className="docIcon">📄</div>
                  <div>
                    <div className="docName">{d.name || d.originalName}</div>
                    <div className="docMeta">
                      {d.tag || "-"} • {d.size ? `${Math.round(d.size / 1024)} KB` : "0 KB"} •{" "}
                      {d.uploadedAt ? formatDate(d.uploadedAt) : "-"}
                    </div>
                  </div>
                </div>

                <span className={`docTag ${String(d.tag || "").toLowerCase().replace(/\s+/g, "-")}`}>
                  {d.tag}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState title="No documents uploaded" sub="Upload invoices, quotations or client files." />
        )}
      </div>
    </div>
  );
}

function NotesTab({ lead, noteText, setNoteText, savingNote, saveNote }) {
  const notes = lead.notes || [];

  return (
    <div className="ldTabStack">
      <div className="ldCard">
        <div className="ldSectionTitle">ADD NOTE</div>

        <textarea
          className="noteBox"
          placeholder="Type your note..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
        />

        <button className="ldBtn primary" type="button" onClick={saveNote} disabled={savingNote}>
          {savingNote ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="ldCard">
        <div className="ldSectionTitle">PREVIOUS NOTES</div>

        {notes.length ? (
          <div className="ldList">
            {notes.map((n, idx) => (
              <div key={idx} className="noteCard">
                <div className="noteText">{n.text}</div>
                <div className="noteMeta">
                  {n.by || "User"} • {n.at ? formatDateTime(n.at) : "-"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No notes yet" sub="Your saved notes will show up here." />
        )}
      </div>
    </div>
  );
}