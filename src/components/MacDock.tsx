import React, { useState } from "react";
import {
  Search,
  History,
  Settings,
  Keyboard,
} from "lucide-react";

interface MacDockProps {
  activeNav: string;
  isHistoryOpen: boolean;
  onInspectClick: () => void;
  onHistoryClick: () => void;
  onSettingsClick: () => void;
  onShortcutsClick: () => void;
}

interface DockItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

export const MacDock: React.FC<MacDockProps> = ({
  activeNav,
  isHistoryOpen,
  onInspectClick,
  onHistoryClick,
  onSettingsClick,
  onShortcutsClick,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const items: DockItem[] = [
    {
      id: "history",
      label: "History & Scans",
      icon: <History size={21} strokeWidth={2.2} />,
      isActive: isHistoryOpen,
      onClick: onHistoryClick,
    },
    {
      id: "inspect",
      label: "Inspect Host",
      icon: <Search size={21} strokeWidth={2.2} />,
      isActive: activeNav === "inspect" && !isHistoryOpen,
      onClick: onInspectClick,
    },
    {
      id: "settings",
      label: "Settings and Preferences",
      icon: <Settings size={21} strokeWidth={2.2} />,
      isActive: false,
      onClick: onSettingsClick,
    },
    {
      id: "shortcuts",
      label: "Keyboard Shortcuts",
      icon: <Keyboard size={21} strokeWidth={2.2} />,
      isActive: false,
      onClick: onShortcutsClick,
    },
  ];

  return (
    <nav className="mac-dock-wrapper" aria-label="Floating Navigation Bar">
      <div className="mac-dock-shelf" onMouseLeave={() => setHoveredIdx(null)}>
        {/* Floating Dock Action Items */}
        <div className="mac-dock-items">
          {items.map((item, idx) => {
            let scaleClass = "";
            if (hoveredIdx !== null) {
              if (hoveredIdx === idx) {
                scaleClass = "dock-scale-center";
              } else if (Math.abs(hoveredIdx - idx) === 1) {
                scaleClass = "dock-scale-adjacent";
              }
            }

            return (
              <div
                key={item.id}
                className="mac-dock-item-container"
                onMouseEnter={() => setHoveredIdx(idx)}
              >
                {/* Tooltip */}
                <div className="mac-dock-tooltip">
                  <span>{item.label}</span>
                </div>

                <button
                  type="button"
                  className={`mac-dock-btn ${scaleClass} ${item.isActive ? "active" : ""}`}
                  onClick={item.onClick}
                  aria-label={item.label}
                  aria-pressed={item.isActive}
                >
                  <div className="mac-dock-icon-inner">{item.icon}</div>
                </button>

                {/* macOS Active Dot Indicator */}
                <span className={`mac-dock-active-dot ${item.isActive ? "visible" : ""}`} />
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
