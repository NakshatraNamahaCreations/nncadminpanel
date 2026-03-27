import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginScreen from "./LoginScreen/LoginScreen";
import Dashboard from "./pages/Dashboard";
import Documents from "./Documents/Documents";
import AllLeads from "./Leads/AllLeads";
import PipelinePage from "./pages/PipelinePage";
import CalendarPage from "./pages/CalendarPage";
import Analytics from "./pages/Analytics/BiReports";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import BranchReports from "./pages/BranchReports/BranchReports";
import PaymentTracker from "./pages/PaymentTracker/PaymentTracker";
import Settings from "./pages/Setting/Settings";
import TodaysPlanPage from "./pages/MasterAdmin/TodaysPlanPage";
import UserManagement from "./pages/UserManagement/UserManagement";
import ExpenseTracker from "./pages/ExpenseTracker/ExpenseTracker";
import PnLPage        from "./pages/PnL/PnLPage";
import AccountingPage from "./pages/Accounting/AccountingPage";
import EnquiriesPage  from "./pages/Enquiries/EnquiriesPage";
import AttendancePage from "./pages/Attendance/AttendancePage";
import FundsPage      from "./pages/Funds/FundsPage";

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

function PublicRoute({ children }) {
  try {
    return isAuthed() ? <Navigate to="/todays-plan" replace /> : children;
  } catch (error) {
    console.error("PublicRoute error:", error);
    return children;
  }
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <LoginScreen />
          </PublicRoute>
        }
      />

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
        path="/todays-plan"
        element={
          <ProtectedRoute>
            <TodaysPlanPage/>
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

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user-management"
        element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/expense-tracker"
        element={
          <ProtectedRoute>
            <ExpenseTracker />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pnl"
        element={
          <ProtectedRoute>
            <PnLPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/accounting"
        element={
          <ProtectedRoute>
            <AccountingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/enquiries"
        element={
          <ProtectedRoute>
            <EnquiriesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/funds"
        element={
          <ProtectedRoute>
            <FundsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to={isAuthed() ? "/todays-plan" : "/"} replace />}
      />
    </Routes>
  );
}