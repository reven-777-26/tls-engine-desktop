import React from "react";
import { InspectionEnvelope } from "../types";
import { Shield, CheckCircle2, XCircle } from "lucide-react";

interface ProtocolsTabProps {
  envelope: InspectionEnvelope;
}

export const ProtocolsTab: React.FC<ProtocolsTabProps> = ({ envelope }) => {
  const protocolsData = envelope.data.tls?.protocols;
  const probes = protocolsData?.probes || {};

  const allProtocols = ["TLSv1.0", "TLSv1.1", "TLSv1.2", "TLSv1.3"];

  return (
    <div>
      <div className="section-card" style={{ marginBottom: 20 }}>
        <div className="card-title">
          <Shield size={16} />
          <span>Protocol Range Support</span>
        </div>

        <div className="grid-2">
          <div className="metric-row">
            <span className="metric-label">Minimum Supported Protocol</span>
            <span className="metric-value" style={{ color: "#38bdf8", fontWeight: 600 }}>
              {protocolsData?.minimum || "N/A"}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Maximum Supported Protocol</span>
            <span className="metric-value" style={{ color: "#38bdf8", fontWeight: 600 }}>
              {protocolsData?.maximum || "N/A"}
            </span>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="card-title">
          <span>Protocol Handshake Probes Matrix</span>
        </div>

        <table className="probes-table">
          <thead>
            <tr>
              <th>Protocol Version</th>
              <th>Supported</th>
              <th>Negotiated Cipher</th>
              <th>Cipher Strength</th>
              <th>Probe Latency</th>
            </tr>
          </thead>
          <tbody>
            {allProtocols.map((protoKey) => {
              const probe = probes[protoKey];
              const isSupported = probe?.supported ?? false;
              const cipher = probe?.negotiated?.cipher_name || "—";
              const bits = probe?.negotiated?.cipher_bits ? `${probe.negotiated.cipher_bits} bits` : "—";
              const duration = probe?.duration_ms != null ? `${probe.duration_ms.toFixed(2)} ms` : "—";

              return (
                <tr key={protoKey}>
                  <td style={{ fontWeight: 600 }}>{protoKey}</td>
                  <td>
                    {isSupported ? (
                      <span
                        className="badge-tag"
                        style={{
                          color: "#34d399",
                          borderColor: "rgba(16, 185, 129, 0.4)",
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                        }}
                      >
                        <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                        Supported
                      </span>
                    ) : (
                      <span
                        className="badge-tag"
                        style={{
                          color: "#94a3b8",
                          borderColor: "var(--border-subtle)",
                        }}
                      >
                        <XCircle size={12} style={{ marginRight: 4 }} />
                        Disabled
                      </span>
                    )}
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{cipher}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{bits}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{duration}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
