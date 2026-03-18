import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginScreen from "./LoginScreen/LoginScreen";
import Dashboard from "./pages/Dashboard";
import Documents from "./Documents/Documents";
import AllLeads from "./Leads/AllLeads";
import PipelinePage from "./pages/PipelinePage";
import CalendarPage from "./pages/CalendarPage";
import Analytics from "./pages/Analytics/Analytics";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import BranchReports from "./pages/BranchReports/BranchReports";
import PaymentTracker from "./pages/PaymentTracker/PaymentTracker";
import Settings from "./pages/Setting/Settings";
import MasterAdmin from "./pages/MasterAdmin/MasterAdmin";


function isAuthed() {
  try {
    const v = localStorage.getItem("nnc_auth");
    return v === "true" || v === "1" || v === "yes";
  } catch (error) {
    console.error("isAuthed error:", error);
    return false;
  }
}

function ProtectedRoute({ children }) {
  try {
    return isAuthed() ? children : <Navigate to="/" replace />;
  } catch (error) {
    console.error("ProtectedRoute error:", error);
    return <Navigate to="/" replace />;
  }
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <AllLeads />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pipeline"
        element={
          <ProtectedRoute>
            <PipelinePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/branch-reports"
        element={
          <ProtectedRoute>
            <BranchReports />
          </ProtectedRoute>
        }
      />
           <Route
        path="/payment-tracker"
        element={
          <ProtectedRoute>
            <PaymentTracker />
          </ProtectedRoute>
        }
      />
      
<Route path="/settings" element={<Settings />} />
<Route path="/master-admin" element={<MasterAdmin />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

