import React from "react";
import { Settings, X } from "lucide-react";

interface SettingsModalProps {
  historyCount: number;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  historyCount,
  onClose,
}) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="section-card"
        style={{
          width: 500,
          backgroundColor: "#182228",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="card-title">
            <Settings size={18} />
            <span>Application Architecture & Security</span>
          </div>
          <button className="icon-btn-subtle" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="metric-row">
          <span className="metric-label">Application Name</span>
          <span className="metric-value">TLS Engine Desktop</span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Runtime Architecture</span>
          <span className="metric-value">Tauri v2 + Rust Core</span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Local Storage Engine</span>
          <span className="metric-value">SQLite (rusqlite bundled)</span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Saved History Records</span>
          <span className="metric-value" style={{ color: "#38bdf8" }}>{historyCount} inspections</span>
        </div>

        <div className="metric-row">
          <span className="metric-label">TLS Verification</span>
          <span className="metric-value" style={{ color: "#10b981" }}>Strict (rustls PKI)</span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Input Sanitization</span>
          <span className="metric-value" style={{ color: "#10b981" }}>Active (RFC 1123 / FQDN)</span>
        </div>

        <div style={{ marginTop: 8, padding: 12, backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 6, fontSize: "12px", color: "var(--text-secondary)" }}>
          <strong style={{ color: "#38bdf8", display: "block", marginBottom: 4 }}>
            Security Posture
          </strong>
          Zero filesystem or shell capabilities are exposed to the frontend webview. All networking, HTTP header parsing, and parameterized database queries run exclusively inside the Rust backend process.
        </div>
      </div>
    </div>
  );
};
