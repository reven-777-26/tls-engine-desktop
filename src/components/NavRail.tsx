import React from "react";
import {
  Search,
  History,
  Settings,
} from "lucide-react";

interface NavRailProps {
  activeNav: string;
  onInspectClick: () => void;
  onHistoryClick: () => void;
  onOpenSettings: () => void;
}

export const NavRail: React.FC<NavRailProps> = ({
  activeNav,
  onInspectClick,
  onHistoryClick,
  onOpenSettings,
}) => {
  return (
    <div className="nav-rail">
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
          className={`rail-btn ${activeNav === "history" ? "active" : ""}`}
          onClick={onHistoryClick}
          title="Inspection History"
        >
          <History size={19} />
          <span>History</span>
        </button>
      </div>

      <div className="rail-bottom">
        <button
          className={`rail-btn ${activeNav === "settings" ? "active" : ""}`}
          onClick={onOpenSettings}
          title="Application Settings & Info"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
