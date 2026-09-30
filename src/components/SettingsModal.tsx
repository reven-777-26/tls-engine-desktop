import React, { useState, useRef, useEffect } from "react";
import {
  UserAppSettings,
  DateFormatType,
  formatCustomDate,
} from "../settings";
import {
  Sliders,
  RotateCcw,
  ChevronDown,
  Check,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  settings: UserAppSettings;
  onUpdateSettings: (newSettings: UserAppSettings) => void;
  onResetSettings: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onResetSettings,
  onClose,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  if (!isOpen) return null;

  const nowSample = new Date().toISOString();

  const options: { id: DateFormatType; title: string }[] = [
    { id: "relative", title: "Relative (Today / Yesterday)" },
    { id: "iso", title: "YYYY-MM-DD HH:mm" },
    { id: "us", title: "MM/DD/YYYY HH:mm" },
    { id: "eu", title: "DD.MM.YYYY HH:mm" },
    { id: "hh_yy_dd", title: "HH:mm YY/DD" },
  ];

  const currentOption = options.find((o) => o.id === settings.dateFormat) || options[0];

  const handleSelect = (id: DateFormatType) => {
    onUpdateSettings({ ...settings, dateFormat: id });
    setDropdownOpen(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="settings-modal-dialog simple-layout"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="settings-modal-header">
          <div className="settings-title-wrap">
            <div className="settings-icon-badge">
              <Sliders size={18} color="var(--blue-primary)" />
            </div>
            <div>
              <h3>Application Preferences</h3>
              <p>Customize interface layout, dock bar, and timestamp formats</p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn-subtle"
            onClick={onClose}
            title="Close Settings"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Content - Dropdown Toggle List */}
        <div className="settings-content-panel simple-panel">
          <div className="settings-pane-view">
            <div className="pane-header-info">
              <h4>Inspection Timestamp Format</h4>
              <p>
                Select your preferred date & timestamp format from the dropdown menu below.
              </p>
            </div>

            {/* Toggle: Bottom Floating Dock Slider */}
            <div className="custom-dropdown-container" style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Bottom Floating Dock
                  </span>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                    Show macOS-style floating action pill at the bottom of the screen
                  </span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.showFloatingDock}
                  className={`apple-switch ${settings.showFloatingDock ? "checked" : ""}`}
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      showFloatingDock: !settings.showFloatingDock,
                    })
                  }
                  title="Toggle bottom floating dock"
                >
                  <span className="apple-switch-knob" />
                </button>
              </div>
            </div>

            {/* Toggle: JSON Multi-tone Color Syntax */}
            <div className="custom-dropdown-container" style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    JSON Syntax Highlighting
                  </span>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                    Colorize keys, strings, numbers, booleans, and nulls with distinct tones
                  </span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.jsonSyntaxHighlighting}
                  className={`apple-switch ${settings.jsonSyntaxHighlighting ? "checked" : ""}`}
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      jsonSyntaxHighlighting: !settings.jsonSyntaxHighlighting,
                    })
                  }
                  title="Toggle JSON multi-tone syntax highlighting"
                >
                  <span className="apple-switch-knob" />
                </button>
              </div>
            </div>

            {/* Custom Dropdown Trigger & List */}
            <div className="custom-dropdown-container" ref={dropdownRef}>
              <label className="dropdown-label">Timestamp Style</label>
              
              <button
                type="button"
                className={`custom-dropdown-trigger ${dropdownOpen ? "is-open" : ""}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="dropdown-trigger-row">
                  <span className="dropdown-selected-title">{currentOption.title}</span>
                  <span className="dropdown-selected-preview">
                    {formatCustomDate(nowSample, currentOption.id)}
                  </span>
                </div>
                <ChevronDown size={16} className={`dropdown-chevron ${dropdownOpen ? "open" : ""}`} />
              </button>

              {/* Dropdown Options List */}
              {dropdownOpen && (
                <div className="custom-dropdown-menu">
                  {options.map((opt) => {
                    const isSelected = settings.dateFormat === opt.id;
                    const sampleText = formatCustomDate(nowSample, opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`dropdown-menu-item ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSelect(opt.id)}
                      >
                        <span className="dropdown-item-title">{opt.title}</span>
                        <div className="dropdown-item-right">
                          <span className="dropdown-sample-mono">{sampleText}</span>
                          {isSelected && <Check size={14} color="var(--blue-primary)" style={{ flexShrink: 0 }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="settings-modal-footer">
          <button
            type="button"
            className="cancel-btn"
            onClick={onResetSettings}
            title="Reset to default settings"
          >
            <RotateCcw size={13} style={{ marginRight: 6 }} />
            Reset Defaults
          </button>
          <button
            type="button"
            className="inspect-btn"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
