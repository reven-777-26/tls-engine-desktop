import React from "react";
import {
  Search,
  History,
  Activity,
  ShieldCheck,
  Settings,
} from "lucide-react";

interface NavRailProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onInspectClick: () => void;
  onOpenHealth: () => void;
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
  onOpenCerts: () => void;
}

export const NavRail: React.FC<NavRailProps> = ({
  activeNav,
  setActiveNav,
  onInspectClick,
  onOpenHealth,
  isHistoryOpen,
  onToggleHistory,
  onOpenCerts,
}) => {
  return (
    <div className="nav-rail">
      <div className="rail-logo" title="TLS Engine Desktop">
        <ShieldCheck size={22} strokeWidth={2.2} />
      </div>

      <div className="rail-items">
        <button
          className={`rail-btn ${activeNav === "inspect" ? "active" : ""}`}
          onClick={onInspectClick}
          title="Run New Inspection / Overview"
        >
          <Search size={20} />
          <span>Inspect</span>
        </button>

        <button
          className={`rail-btn ${isHistoryOpen ? "active" : ""}`}
          onClick={onToggleHistory}
          title={isHistoryOpen ? "Close Inspections Side Panel" : "Open Inspections Side Panel"}
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
          className={`rail-btn ${activeNav === "certs" ? "active" : ""}`}
          onClick={onOpenCerts}
          title="View Certificate Chain & Hierarchy"
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
