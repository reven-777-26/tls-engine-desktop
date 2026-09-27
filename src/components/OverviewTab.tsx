import React, { useState } from "react";
import { InspectionEnvelope } from "../types";
import {
  AlertTriangle,
  Server,
  Shield,
  Radio,
  FileText,
} from "lucide-react";

interface OverviewTabProps {
  envelope: InspectionEnvelope;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ envelope }) => {
  const [showAllSans, setShowAllSans] = useState(false);
  const { data, metadata } = envelope;
  const isTrusted = data.verification?.trusted ?? false;
  const issues = data.verification?.issues ?? [];
  const leafCert = data.certificates?.chain?.[0];

  return (
    <div>
      {/* Issues / Alerts if untrusted or expired */}
      {!isTrusted && issues.length > 0 && (
        <div className="warning-box">
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ display: "block", marginBottom: 4 }}>
              Security & Trust Issues Detected
            </strong>
            <ul style={{ paddingLeft: 18, fontSize: "12.5px" }}>
              {issues.map((iss, i) => (
                <li key={i} style={{ marginBottom: 3 }}>
                  <strong>{iss.code || "WARNING"}:</strong> {iss.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Grid: Negotiated TLS & Connection Info */}
      <div className="grid-2">
        {/* TLS Negotiation Card */}
        <div className="section-card">
          <div className="card-title">
            <Shield size={16} />
            <span>Negotiated TLS Parameters</span>
          </div>

          <div className="metric-row">
            <span className="metric-label">TLS Protocol</span>
            <span className="metric-value" style={{ color: "#38bdf8", fontWeight: 700 }}>
              {data.tls?.negotiated?.protocol || "N/A"}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Cipher Suite</span>
            <span className="metric-value">
              {data.tls?.negotiated?.cipher_name || "N/A"}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Cipher Encryption Bits</span>
            <span className="metric-value">
              {data.tls?.negotiated?.cipher_bits ? `${data.tls.negotiated.cipher_bits} bits` : "N/A"}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Supported Protocols</span>
            <span className="metric-value">
              {data.tls?.protocols?.supported?.join(", ") || "N/A"}
            </span>
          </div>
        </div>

        {/* Network & TCP Connection Card */}
        <div className="section-card">
          <div className="card-title">
            <Server size={16} />
            <span>Connection & Network Layer</span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Remote Address</span>
            <span className="metric-value">
              {data.connection?.remote_address || "N/A"}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Connect Latency</span>
            <span className="metric-value">
              {data.connection?.connect_time_ms != null
                ? `${data.connection.connect_time_ms.toFixed(2)} ms`
                : "N/A"}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Stream Type</span>
            <span className="metric-value">
              {data.connection?.stream_type || "N/A"}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Total Inspection Duration</span>
            <span className="metric-value">
              {data.inspection?.duration_ms != null
                ? `${data.inspection.duration_ms.toFixed(2)} ms`
                : `${metadata.roundtrip_ms.toFixed(1)} ms`}
            </span>
          </div>
        </div>
      </div>

      {/* Leaf Certificate Summary Card */}
      {leafCert && (
        <div className="section-card" style={{ marginBottom: 24 }}>
          <div className="card-title">
            <FileText size={16} />
            <span>Leaf Certificate Overview</span>
          </div>

          <div className="grid-2">
            <div>
              <div className="metric-row">
                <span className="metric-label">Common Name (CN)</span>
                <span className="metric-value" style={{ color: "#38bdf8" }}>
                  {leafCert.subject?.commonName || "N/A"}
                </span>
              </div>

              <div className="metric-row">
                <span className="metric-label">Issuer Organization</span>
                <span className="metric-value">
                  {leafCert.issuer?.organizationName || leafCert.issuer?.commonName || "N/A"}
                </span>
              </div>

              <div className="metric-row">
                <span className="metric-label">Public Key Algorithm</span>
                <span className="metric-value">
                  {leafCert.public_key?.type || "N/A"} {leafCert.public_key?.bits ? `(${leafCert.public_key.bits} bits)` : ""}
                </span>
              </div>
            </div>

            <div>
              <div className="metric-row">
                <span className="metric-label">Valid From</span>
                <span className="metric-value">
                  {leafCert.validity?.from ? leafCert.validity.from.split("T")[0] : "N/A"}
                </span>
              </div>

              <div className="metric-row">
                <span className="metric-label">Valid Until</span>
                <span className="metric-value">
                  {leafCert.validity?.to ? leafCert.validity.to.split("T")[0] : "N/A"}
                </span>
              </div>

              <div className="metric-row">
                <span className="metric-label">Days Remaining</span>
                <span
                  className="metric-value"
                  style={{
                    color:
                      (leafCert.validity?.days_remaining ?? 0) < 15
                        ? "#f87171"
                        : (leafCert.validity?.days_remaining ?? 0) < 30
                        ? "#fbbf24"
                        : "#34d399",
                    fontWeight: 700,
                  }}
                >
                  {leafCert.validity?.days_remaining != null
                    ? `${leafCert.validity.days_remaining} days`
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Subject Alternative Names */}
          {leafCert.subject_alt_names && leafCert.subject_alt_names.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <span className="metric-label" style={{ fontSize: "12px", display: "block", marginBottom: 6 }}>
                Subject Alternative Names (SANs) - {leafCert.subject_alt_names.length} domains:
              </span>
              <div className="chip-container">
                {(showAllSans
                  ? leafCert.subject_alt_names
                  : leafCert.subject_alt_names.slice(0, 16)
                ).map((san, idx) => (
                  <span key={idx} className="chip">
                    {san.value}
                  </span>
                ))}
                {leafCert.subject_alt_names.length > 16 && (
                  <button
                    type="button"
                    className="chip-more-btn"
                    onClick={() => setShowAllSans((prev) => !prev)}
                    title={showAllSans ? "Show fewer domains" : "Show all domains"}
                  >
                    {showAllSans ? "Show less" : `+${leafCert.subject_alt_names.length - 16} more`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* HTTP Metadata & Cache Summary Card */}
      <div className="section-card">
        <div className="card-title">
          <Radio size={16} />
          <span>HTTP Transport & Cache Diagnostics</span>
        </div>

        <div className="grid-3">
          <div className="metric-row">
            <span className="metric-label">X-Cache Status</span>
            <span className="metric-value" style={{ color: metadata.x_cache === "HIT" ? "#38bdf8" : "#94a3b8" }}>
              {metadata.x_cache || "MISS / NOT_REPORTED"}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Edge Server</span>
            <span className="metric-value">{metadata.server || "N/A"}</span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Service Origin Engine</span>
            <span className="metric-value">{metadata.x_powered_by || "TLS Engine"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
