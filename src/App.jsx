import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginScreen from "./LoginScreen/LoginScreen";
import Documents from "./Documents/Documents";
import AllLeads from "./Leads/AllLeads";
import PipelinePage from "./pages/PipelinePage";
import CalendarPage from "./pages/CalendarPage";

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}