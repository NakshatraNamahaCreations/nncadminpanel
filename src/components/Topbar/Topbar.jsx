import React, { useState } from "react";
import { toast } from "../../utils/toast";
import { useLocation } from "react-router-dom";
import { Upload, Plus } from "lucide-react";
import "./Topbar.css";
import AddLeadModal from "../Modals/AddLeadModal/AddLeadModal";
import UploadDocumentModal from "../Modals/UploadDocumentModal/UploadDocumentModal";

export default function Topbar({
  onCreateLead,
  onUploadDocument,
  showUpload = true,
  showAddLead = true,
  uploadLabel = "Upload",
  addLeadLabel = "Add Lead",
  leadOptions = [],
  leadsLoading = false,
  children,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const location = useLocation();

  const hideActionsOnPages = ["/dashboard", "/todays-plan", "/todays-lead"];
  const shouldHideActions = hideActionsOnPages.includes(location.pathname);

  const finalShowUpload = showUpload && !shouldHideActions;
  const finalShowAddLead = showAddLead && !shouldHideActions;

  const handleSaveLead = async (payload) => {
    try {
      if (onCreateLead) {
        await onCreateLead(payload);
      }
      setShowAdd(false);
    } catch (error) {
      console.error("handleSaveLead error:", error);
      toast.error(error?.message || "Failed to create lead");
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
      toast.error(error?.message || "Failed to upload document");
    }
  };

  return (
    <>
      <div className="topbarWrap">
        <div className="topbarRight">
          {children}

          {finalShowUpload ? (
            <button
              type="button"
              className="topbarBtn secondary"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload size={16} />
              {uploadLabel}
            </button>
          ) : null}

          {finalShowAddLead ? (
            <button
              type="button"
              className="topbarBtn primary"
              onClick={() => setShowAdd(true)}
            >
              <Plus size={16} />
              {addLeadLabel}
            </button>
          ) : null}
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
        leadOptions={leadOptions}
        leadsLoading={leadsLoading}
      />
    </>
  );
}