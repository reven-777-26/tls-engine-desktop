import React from "react";
import {
  ScanSearch,
  History,
  Activity,
  ShieldCheck,
  Settings,
} from "lucide-react";

interface NavRailProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onNewScan: () => void;
  onOpenHealth: () => void;
}

export const NavRail: React.FC<NavRailProps> = ({
  activeNav,
  setActiveNav,
  onNewScan,
  onOpenHealth,
}) => {
  return (
    <div className="nav-rail">
      <div className="rail-logo" title="TLS Engine Desktop">
        <ShieldCheck size={22} strokeWidth={2.2} />
      </div>

      <div className="rail-items">
        <button
          className={`rail-btn ${activeNav === "inspect" ? "active" : ""}`}
          onClick={() => {
            setActiveNav("inspect");
            onNewScan();
          }}
          title="Run New Inspection"
        >
          <ScanSearch size={20} />
          <span>Inspect</span>
        </button>

        <button
          className={`rail-btn ${activeNav === "history" ? "active" : ""}`}
          onClick={() => setActiveNav("history")}
          title="Browse Saved Inspections"
        >
          <History size={19} />
          <span>History</span>
        </button>

        <button
          className={`rail-btn ${activeNav === "health" ? "active" : ""}`}
          onClick={() => {
            setActiveNav("health");
            onOpenHealth();
          }}
          title="Service Health Status"
        >
          <Activity size={19} />
          <span>Health</span>
        </button>

        <button
          className={`rail-btn ${activeNav === "diagnostics" ? "active" : ""}`}
          onClick={() => setActiveNav("diagnostics")}
          title="Security Diagnostics"
        >
          <ShieldCheck size={19} />
          <span>Certs</span>
        </button>
      </div>

      <div className="rail-bottom">
        <button
          className={`rail-btn ${activeNav === "settings" ? "active" : ""}`}
          onClick={() => setActiveNav("settings")}
          title="Application Settings & Info"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
