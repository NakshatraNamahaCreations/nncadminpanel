import { useState } from "react";
import { ClipboardList, BarChart2, Users, DollarSign } from "lucide-react";
import Sidebar from "../../components/Sidebar/Sidebar";
import DailyTab     from "./DailyTab";
import MonthlyTab   from "./MonthlyTab";
import EmployeesTab from "./EmployeesTab";
import SalaryTab    from "./SalaryTab";
import "./AttendancePage.css";

const BRANCHES = ["", "Mysore", "Bangalore", "Mumbai"];
const BRANCH_LABELS = { "": "All Branches", Mysore: "Mysore", Bangalore: "Bangalore", Mumbai: "Mumbai" };

const TABS = [
  { key: "daily",    label: "Daily Attendance", icon: ClipboardList },
  { key: "monthly",  label: "Monthly Report",   icon: BarChart2 },
  { key: "employees",label: "Employees",         icon: Users },
  { key: "salary",   label: "Salary",            icon: DollarSign },
];

export default function AttendancePage() {
  const [activeTab,    setActiveTab]    = useState("daily");
  const [globalBranch, setGlobalBranch] = useState("");

  return (
    <div className="att-layout">
      <Sidebar />
      <div className="att-main">
        {/* Header */}
        <div className="att-header">
          <div className="att-header-top">
            <div>
              <div className="att-eyebrow">NNC CRM</div>
              <div className="att-title">Attendance &amp; Salary</div>
              <div className="att-subtitle">Track attendance and manage payroll</div>
            </div>
            <div className="att-header-right">
              <select
                className="att-branch-select"
                value={globalBranch}
                onChange={e => setGlobalBranch(e.target.value)}
              >
                {BRANCHES.map(b => (
                  <option key={b} value={b}>{BRANCH_LABELS[b]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab bar */}
          <div className="att-tabs">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  className={`att-tab${activeTab === tab.key ? " active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Icon size={14} className="att-tab-icon" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="att-tab-content">
          {activeTab === "daily"     && <DailyTab     branch={globalBranch} />}
          {activeTab === "monthly"   && <MonthlyTab   branch={globalBranch} />}
          {activeTab === "employees" && <EmployeesTab branch={globalBranch} />}
          {activeTab === "salary"    && <SalaryTab    branch={globalBranch} />}
        </div>
      </div>
    </div>
  );
}
