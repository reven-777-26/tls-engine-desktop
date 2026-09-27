import React, { useState } from "react";
import { CertificateItem } from "../types";
import {
  ShieldCheck,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileCode,
  Calendar,
} from "lucide-react";

interface ChainTabProps {
  chain?: CertificateItem[];
}

export const ChainTab: React.FC<ChainTabProps> = ({ chain = [] }) => {
  const [expandedPems, setExpandedPems] = useState<Record<number, boolean>>({});
  const [copiedFingerprint, setCopiedFingerprint] = useState<string | null>(null);

  const togglePem = (idx: number) => {
    setExpandedPems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFingerprint(label);
    setTimeout(() => setCopiedFingerprint(null), 2000);
  };

  if (!chain || chain.length === 0) {
    return (
      <div className="empty-state">
        <ShieldCheck size={36} opacity={0.4} />
        <p>No certificate chain data available for this target.</p>
      </div>
    );
  }

  return (
    <div className="chain-steps-container">
      <div style={{ marginBottom: 12, color: "var(--text-secondary)", fontSize: "12.5px" }}>
        Full certificate chain hierarchy ({chain.length} certificates presented):
      </div>

      {chain.map((cert, idx) => {
        const isLeaf = cert.role === "leaf" || idx === 0;
        const isRoot = cert.role === "root" || cert.self_signed || idx === chain.length - 1;
        const roleClass = isLeaf ? "leaf" : isRoot ? "root" : "intermediate";
        const roleLabel = isLeaf ? "Leaf Certificate" : isRoot ? "Root CA" : `Intermediate CA (${idx})`;
        const pemOpen = !!expandedPems[idx];

        const daysRemaining = cert.validity?.days_remaining;
        const validityStatusColor =
          daysRemaining != null && daysRemaining <= 0
            ? "#ef4444"
            : daysRemaining != null && daysRemaining < 30
            ? "#f59e0b"
            : "#10b981";

        return (
          <div key={idx} className={`chain-card ${roleClass}`}>
            <div className="chain-card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className={`chain-role-badge ${roleClass}`}>{roleLabel}</span>
                <span className="chain-cn">
                  {cert.subject?.commonName || cert.subject?.organizationName || "Unknown Common Name"}
                </span>
              </div>

              {daysRemaining != null && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: validityStatusColor,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Calendar size={13} />
                  {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Expired"}
                </span>
              )}
            </div>

            {/* Certificate Details Grid */}
            <div className="grid-2">
              <div>
                <div className="metric-row">
                  <span className="metric-label">Subject Organization</span>
                  <span className="metric-value">
                    {cert.subject?.organizationName || cert.subject?.commonName || "N/A"}
                  </span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Issuer</span>
                  <span className="metric-value">
                    {cert.issuer?.commonName || cert.issuer?.organizationName || "N/A"}
                  </span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Signature Algorithm</span>
                  <span className="metric-value">{cert.signature?.long_name || cert.signature?.short_name || "N/A"}</span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Serial Number</span>
                  <span className="metric-value" title={cert.serial_number_hex || cert.serial_number}>
                    {cert.serial_number_hex ? `0x${cert.serial_number_hex}` : cert.serial_number || "N/A"}
                  </span>
                </div>
              </div>

              <div>
                <div className="metric-row">
                  <span className="metric-label">Valid From</span>
                  <span className="metric-value">{cert.validity?.from ? cert.validity.from.split("T")[0] : "N/A"}</span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Valid Until</span>
                  <span className="metric-value">{cert.validity?.to ? cert.validity.to.split("T")[0] : "N/A"}</span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Public Key Specs</span>
                  <span className="metric-value">
                    {cert.public_key?.type || "N/A"} {cert.public_key?.bits ? `${cert.public_key.bits} bits` : ""}
                    {cert.public_key?.ec?.curve_name ? ` (${cert.public_key.ec.curve_name})` : ""}
                  </span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">CA Status</span>
                  <span className="metric-value">
                    {cert.is_ca ? "Certificate Authority (CA)" : "End-Entity"}
                  </span>
                </div>
              </div>
            </div>

            {/* Fingerprints */}
            {cert.fingerprints && (
              <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                    SHA-256 FINGERPRINT
                  </span>
                  <button
                    className="icon-btn-subtle"
                    onClick={() => copyToClipboard(cert.fingerprints?.sha256 || "", `sha256-${idx}`)}
                    title="Copy SHA-256"
                  >
                    {copiedFingerprint === `sha256-${idx}` ? (
                      <Check size={12} color="#10b981" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "#38bdf8",
                    wordBreak: "break-all",
                  }}
                >
                  {cert.fingerprints.sha256}
                </div>
              </div>
            )}

            {/* Subject Alternative Names (SANs) */}
            {cert.subject_alt_names && cert.subject_alt_names.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <span className="metric-label" style={{ fontSize: "11px", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  SANs ({cert.subject_alt_names.length}):
                </span>
                <div className="chip-container">
                  {cert.subject_alt_names.map((san, sIdx) => (
                    <span key={sIdx} className="chip">
                      {san.value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* PEM Certificate Accordion */}
            {cert.pem && (
              <div style={{ marginTop: 12 }}>
                <button
                  className="icon-btn-subtle"
                  style={{ gap: 6, fontSize: "11px", color: "var(--text-blue)", padding: "4px 8px" }}
                  onClick={() => togglePem(idx)}
                >
                  <FileCode size={13} />
                  <span>{pemOpen ? "Hide PEM Certificate" : "View PEM Certificate"}</span>
                  {pemOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {pemOpen && (
                  <div style={{ marginTop: 8, position: "relative" }}>
                    <button
                      className="json-copy-btn"
                      style={{ top: 8, right: 8, padding: "4px 8px", fontSize: "11px" }}
                      onClick={() => copyToClipboard(cert.pem || "", `pem-${idx}`)}
                    >
                      {copiedFingerprint === `pem-${idx}` ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedFingerprint === `pem-${idx}` ? "Copied" : "Copy PEM"}</span>
                    </button>
                    <pre
                      className="code-block"
                      style={{
                        padding: 12,
                        background: "#0a0f13",
                        borderRadius: 6,
                        maxHeight: 180,
                        overflowY: "auto",
                        fontSize: "11px",
                      }}
                    >
                      {cert.pem}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
