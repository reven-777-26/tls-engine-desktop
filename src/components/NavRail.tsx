import React from "react";
import {
  Search,
  History,
  ShieldCheck,
  Settings,
} from "lucide-react";

interface NavRailProps {
  activeNav: string;
  onInspectClick: () => void;
  onHistoryClick: () => void;
  onSettingsClick: () => void;
}

export const NavRail: React.FC<NavRailProps> = ({
  activeNav,
  onInspectClick,
  onHistoryClick,
  onSettingsClick,
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
          className="rail-btn"
          onClick={onSettingsClick}
          title="Appearance & Preferences (Fonts, Date Format, Theme)"
        >
          <Settings size={20} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
