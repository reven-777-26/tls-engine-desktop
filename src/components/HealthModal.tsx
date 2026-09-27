import React from "react";
import { HealthStatus } from "../types";
import { Activity, CheckCircle2, XCircle, RefreshCw, X } from "lucide-react";

interface HealthModalProps {
  health: HealthStatus | null;
  loading: boolean;
  onRefresh: () => void;
  onClose: () => void;
}

export const HealthModal: React.FC<HealthModalProps> = ({
  health,
  loading,
  onRefresh,
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
          width: 440,
          backgroundColor: "#182228",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="card-title">
            <Activity size={18} />
            <span>TLS Engine Service Health</span>
          </div>
          <button className="icon-btn-subtle" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ textAlign: "center", padding: "16px 0" }}>
          {health?.healthy ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#10b981",
                }}
              >
                <CheckCircle2 size={30} />
              </div>
              <h3 style={{ fontSize: "16px", color: "#10b981" }}>Service Healthy & Operational</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                Endpoint: <code>https://tls.kroatenwerk.com/health</code>
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ef4444",
                }}
              >
                <XCircle size={30} />
              </div>
              <h3 style={{ fontSize: "16px", color: "#ef4444" }}>Service Degraded or Unreachable</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                {health?.message || "Health check failed"}
              </p>
            </div>
          )}
        </div>

        <div className="metric-row">
          <span className="metric-label">HTTP Response Code</span>
          <span className="metric-value">{health?.status_code || 0}</span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Engine Version</span>
          <span className="metric-value">{health?.x_powered_by || "TLS Engine"}</span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Last Checked</span>
          <span className="metric-value">
            {health?.checked_at ? new Date(health.checked_at).toLocaleTimeString() : "Never"}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, gap: 10 }}>
          <button className="inspect-btn" onClick={onRefresh} disabled={loading} style={{ margin: 0 }}>
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>{loading ? "Checking..." : "Recheck Health"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
