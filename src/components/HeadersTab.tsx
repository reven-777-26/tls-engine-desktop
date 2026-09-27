import React from "react";
import { HttpMetadata } from "../types";
import { Radio, Info } from "lucide-react";

interface HeadersTabProps {
  metadata: HttpMetadata;
}

export const HeadersTab: React.FC<HeadersTabProps> = ({ metadata }) => {
  return (
    <div>
      <div className="section-card" style={{ marginBottom: 20 }}>
        <div className="card-title">
          <Radio size={16} />
          <span>HTTP Transport & Response Headers</span>
        </div>

        <div className="metric-row">
          <span className="metric-label">X-Cache Header</span>
          <span
            className="metric-value"
            style={{
              color: metadata.x_cache === "HIT" ? "#38bdf8" : "#94a3b8",
              fontWeight: 700,
            }}
          >
            {metadata.x_cache || "NOT_PRESENT"}
          </span>
        </div>

        <div className="metric-row">
          <span className="metric-label">HTTP Status Code</span>
          <span className="metric-value" style={{ color: "#34d399" }}>
            {metadata.status_code} OK
          </span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Roundtrip Network Latency</span>
          <span className="metric-value">
            {metadata.roundtrip_ms.toFixed(1)} ms
          </span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Server Gateway</span>
          <span className="metric-value">{metadata.server || "N/A"}</span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Cloudflare Cache Status</span>
          <span className="metric-value">{metadata.cf_cache_status || "N/A"}</span>
        </div>

        <div className="metric-row">
          <span className="metric-label">X-Powered-By</span>
          <span className="metric-value">{metadata.x_powered_by || "TLS Engine"}</span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Response Date Header</span>
          <span className="metric-value">{metadata.date || "N/A"}</span>
        </div>
      </div>

      <div className="section-card">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "var(--text-secondary)", fontSize: "12.5px" }}>
          <Info size={18} style={{ color: "#38bdf8", flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: 3 }}>
              Why HTTP Transport Headers Matter
            </strong>
            The <code style={{ color: "#38bdf8" }}>X-Cache: HIT</code> indicator signifies that the inspection service returned a pre-computed TLS fingerprint from its edge cache, providing faster response times. When <code style={{ color: "#94a3b8" }}>X-Cache: MISS</code> is returned, a full real-time TLS handshake probe was initiated directly to the target host.
          </div>
        </div>
      </div>
    </div>
  );
};
