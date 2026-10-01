import React, { useState, useRef, useEffect } from "react";
import {
  UserAppSettings,
  DateFormatType,
  formatCustomDate,
} from "../settings";
import {
  Settings,
  RotateCcw,
  ChevronDown,
  Check,
  Info,
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

  // Close dropdowns when clicking outside or press Escape to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const nowSample = new Date().toISOString();

  const options: { id: DateFormatType; title: string }[] = [
    { id: "relative", title: "Relative (Today / Yesterday)" },
    { id: "iso", title: "YYYY-MM-DD HH:mm" },
    { id: "us", title: "MM/DD/YYYY hh:mm AM/PM" },
    { id: "eu", title: "DD/MM/YYYY hh:mm AM/PM" },
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
              <Settings size={18} color="var(--blue-primary)" />
            </div>
            <div>
              <h3>Settings and Preferences</h3>
              <p>Configure interface styling, formatters, and workspace options</p>
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
                    Floating Navbar
                  </span>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                    Display quick-navigation floating navbar pinned at the bottom of the screen
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
                  title="Toggle Floating Navbar"
                >
                  <span className="apple-switch-knob" />
                </button>
              </div>
            </div>

            {/* Toggle: JSON Multi-tone Color Syntax */}
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
                    JSON Syntax Highlighting
                  </span>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                    Colorize keys, strings, and numbers in the Raw JSON tab
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
                  title="Toggle JSON Syntax Highlighting"
                >
                  <span className="apple-switch-knob" />
                </button>
              </div>
            </div>

            {/* Custom Dropdown Trigger & List */}
            <div className="custom-dropdown-container" ref={dropdownRef}>
              <label className="dropdown-label">Timestamp Format</label>

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

            {/* Minimal About Section */}
            <div
              style={{
                marginTop: 20,
                padding: "12px 16px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Info size={16} color="var(--blue-primary)" />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  TLS Engine Desktop
                </span>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--blue-primary)",
                  backgroundColor: "var(--blue-dim)",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  border: "1px solid var(--blue-border)",
                }}
              >
                v1.1
              </span>
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
