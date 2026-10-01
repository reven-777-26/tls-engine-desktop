import React from "react";
import { HttpMetadata } from "../types";
import { Radio } from "lucide-react";

interface HeadersTabProps {
  metadata: HttpMetadata;
}

export const HeadersTab: React.FC<HeadersTabProps> = ({ metadata }) => {
  return (
    <div>
      <div className="section-card">
        <div className="card-title">
          <Radio size={16} />
          <span>HTTP Transport & Response Headers</span>
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
          <span className="metric-label">X-Powered-By</span>
          <span className="metric-value">{metadata.x_powered_by || "TLS Engine"}</span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Response Date Header</span>
          <span className="metric-value">{metadata.date || "N/A"}</span>
        </div>
      </div>
    </div>
  );
};
