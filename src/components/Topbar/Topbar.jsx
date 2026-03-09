import React, { useState } from "react";
import { Upload, Plus, LogOut, Sparkles, ShieldCheck } from "lucide-react";
import "./Topbar.css";
import AddLeadModal from "../Modals/AddLeadModal/AddLeadModal";
import UploadDocumentModal from "../Modals/UploadDocumentModal/UploadDocumentModal";

export default function Topbar({
  title = "Documents",
  roleLabel = "Master Admin",
  onLogout,
  onCreateLead,
  onUploadDocument,
  showUpload = true,
  showAddLead = true,
  showLogout = true,
  uploadLabel = "Upload",
  addLeadLabel = "Add Lead",
  children,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleSaveLead = async (payload) => {
    try {
      if (onCreateLead) {
        await onCreateLead(payload);
      }
      setShowAdd(false);
    } catch (error) {
      console.error("handleSaveLead error:", error);
      alert(error?.message || "Failed to create lead");
    }
  };

  const handleSaveDocument = async (payload) => {
    try {
      if (onUploadDocument) {
        await onUploadDocument(payload);
      }
      setShowUploadModal(false);
    } catch (error) {
      console.error("handleSaveDocument error:", error);
      alert(error?.message || "Failed to upload document");
    }
  };

  const handleLogoutClick = async () => {
    try {
      if (onLogout) {
        await onLogout();
      }
    } catch (error) {
      console.error("handleLogoutClick error:", error);
    }
  };

  return (
    <>
      <div className="tb">
        <div className="tbGlow tbGlowOne" />
        <div className="tbGlow tbGlowTwo" />
        <div className="tbGlow tbGlowThree" />

        <div className="tbLeft">
          <div className="tbHeadingBlock">
            <div className="tbIconBadge">
              <Sparkles size={18} />
            </div>

            <div className="tbTitleWrap">
              <div className="tbMiniLabel">NNC CRM PANEL</div>
              <h1 className="tbTitle">{title}</h1>

              <div className="tbSubRow">
                <span className="tbRole">
                  <span className="tbRoleDot" />
                  {roleLabel}
                </span>

                <span className="tbStatus">
                  <ShieldCheck size={13} />
                  Secure Workspace
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="tbRight">
          {children ? <div className="tbSlot">{children}</div> : null}

          {showUpload && (
            <button
              type="button"
              className="tbBtn tbBtnGhost"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload size={16} />
              <span>{uploadLabel}</span>
            </button>
          )}

          {showAddLead && (
            <button
              type="button"
              className="tbBtn tbBtnPrimary"
              onClick={() => setShowAdd(true)}
            >
              <Plus size={16} />
              <span>{addLeadLabel}</span>
            </button>
          )}

          {showLogout && (
            <button
              type="button"
              className="tbBtn tbBtnDanger"
              onClick={handleLogoutClick}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      <AddLeadModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleSaveLead}
      />

      <UploadDocumentModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSave={handleSaveDocument}
      />
    </>
  );
}