import React, { useState, useEffect } from "react";
import "./App.css";
import { NavRail } from "./components/NavRail";
import { HistoryPane } from "./components/HistoryPane";
import { OverviewTab } from "./components/OverviewTab";
import { ChainTab } from "./components/ChainTab";
import { ProtocolsTab } from "./components/ProtocolsTab";
import { HeadersTab } from "./components/HeadersTab";
import { RawJsonTab } from "./components/RawJsonTab";
import { HealthModal } from "./components/HealthModal";
import { SettingsModal } from "./components/SettingsModal";
import { ConfirmModal } from "./components/ConfirmModal";
import {
  inspectHost,
  checkHealth,
  getHistory,
  getInspectionDetail,
  deleteHistoryItem,
  clearHistory,
} from "./api";
import { HealthStatus, HistoryItemSummary, InspectionEnvelope } from "./types";
import {
  Search,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Radio,
  FileCode,
  Shield,
  Layers,
  ArrowRight,
  Database,
  RefreshCw,
} from "lucide-react";

export function App() {
  const [activeNav, setActiveNav] = useState("inspect");
  const [activeTab, setActiveTab] = useState<"overview" | "chain" | "protocols" | "headers" | "json">("overview");

  const [hostInput, setHostInput] = useState("");
  const [currentInspection, setCurrentInspection] = useState<InspectionEnvelope | null>(null);
  const [history, setHistory] = useState<HistoryItemSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  // Load initial history & health status on app startup
  useEffect(() => {
    refreshHistory();
    refreshHealth();
  }, []);

  // Filter history when search query changes
  useEffect(() => {
    refreshHistory(searchQuery);
  }, [searchQuery]);

  const refreshHistory = async (query?: string) => {
    try {
      const items = await getHistory(query);
      setHistory(items);
    } catch (err: any) {
      console.error("Failed to load history:", err);
    }
  };

  const refreshHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await checkHealth();
      setHealth(res);
    } catch (err: any) {
      console.error("Failed to check health:", err);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleRunInspection = async (target?: string) => {
    const rawTarget = target || hostInput;
    if (!rawTarget.trim()) return;

    setError(null);
    setIsInspecting(true);

    try {
      const envelope = await inspectHost(rawTarget);
      setCurrentInspection(envelope);
      setHostInput(envelope.host);
      setActiveTab("overview");
      await refreshHistory(searchQuery);
    } catch (err: any) {
      setError(err?.toString() || "An unexpected error occurred during TLS inspection.");
    } finally {
      setIsInspecting(false);
    }
  };

  const handleSelectHistoryItem = async (item: HistoryItemSummary) => {
    setError(null);
    try {
      const detail = await getInspectionDetail(item.id);
      setCurrentInspection(detail);
      setHostInput(detail.host);
    } catch (err: any) {
      setError(err?.toString() || "Failed to load cached inspection record");
    }
  };

  const handleDeleteHistoryItem = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteHistoryItem(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (currentInspection?.id === id) {
        // Keep envelope on screen but unset DB id
        setCurrentInspection((prev) => (prev ? { ...prev, id: null } : null));
      }
    } catch (err: any) {
      console.error("Failed to delete history item:", err);
    }
  };

  const handleClearAllHistory = () => {
    setShowClearConfirmModal(true);
  };

  const executeClearAllHistory = async () => {
    try {
      await clearHistory();
      setHistory([]);
      setShowClearConfirmModal(false);
    } catch (err: any) {
      console.error("Failed to clear history:", err);
    }
  };

  const sampleDomains = [
    "example.com",
    "google.com",
    "github.com",
    "cloudflare.com",
    "expired.badssl.com",
    "self-signed.badssl.com",
  ];

  const isTrusted = currentInspection?.data.verification?.trusted ?? false;

  return (
    <div className="app-container">
      {/* 1. Left Nav Rail */}
      <NavRail
        activeNav={activeNav}
        setActiveNav={(nav) => {
          setActiveNav(nav);
          if (nav === "settings") setShowSettingsModal(true);
        }}
        onNewScan={() => {
          setHostInput("");
          setCurrentInspection(null);
          setError(null);
        }}
        onOpenHealth={() => setShowHealthModal(true)}
      />

      {/* 2. Middle History Column */}
      <HistoryPane
        history={history}
        selectedId={currentInspection?.id || null}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectInspection={handleSelectHistoryItem}
        onDeleteInspection={handleDeleteHistoryItem}
        onClearHistory={handleClearAllHistory}
      />

      {/* 3. Main Workspace */}
      <div className="main-workspace">
        {/* Top Header Inspection Bar */}
        <div className="top-inspection-bar">
          <form
            className="host-input-group"
            onSubmit={(e) => {
              e.preventDefault();
              handleRunInspection();
            }}
          >
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="host-input"
              placeholder="Enter domain or IP (e.g. example.com, github.com)..."
              value={hostInput}
              onChange={(e) => setHostInput(e.target.value)}
              disabled={isInspecting}
            />
            <button
              type="submit"
              className="inspect-btn"
              disabled={isInspecting || !hostInput.trim()}
            >
              {isInspecting ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>Inspecting...</span>
                </>
              ) : (
                <>
                  <Lock size={14} />
                  <span>Inspect TLS</span>
                </>
              )}
            </button>
          </form>

          <div className="top-bar-right">
            {/* Live Health Badge */}
            <div
              className="health-pill"
              onClick={() => setShowHealthModal(true)}
              title="Click to view backend service status"
            >
              <span
                className={`health-indicator ${health?.healthy ? "online" : "offline"}`}
              />
              <span>{health?.healthy ? "Engine Online" : "Engine Degraded"}</span>
            </div>

            {/* Offline or Live Badge */}
            {currentInspection?.from_cache && (
              <span className="badge-tag" style={{ color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.4)" }}>
                <Database size={11} style={{ marginRight: 4 }} />
                Offline Cache
              </span>
            )}
          </div>
        </div>

        {/* Target Header Summary Banner */}
        {currentInspection && (
          <div className="target-summary-header">
            <div className="target-info-col">
              <div className="target-host-title">
                <Globe size={22} color="#38bdf8" />
                <span>{currentInspection.host}</span>
                {currentInspection.metadata.x_cache && (
                  <span className="badge-tag cache-hit" style={{ fontSize: "11px" }}>
                    X-Cache: {currentInspection.metadata.x_cache}
                  </span>
                )}
              </div>

              <div className="target-subinfo">
                <span className="subinfo-item">
                  <strong>Port:</strong> {currentInspection.data.target?.port || 443}
                </span>
                <span className="subinfo-item">
                  <strong>Remote:</strong> {currentInspection.data.connection?.remote_address || "N/A"}
                </span>
                <span className="subinfo-item">
                  <strong>Connect:</strong>{" "}
                  {currentInspection.data.connection?.connect_time_ms != null
                    ? `${currentInspection.data.connection.connect_time_ms.toFixed(1)} ms`
                    : "N/A"}
                </span>
                <span className="subinfo-item">
                  <strong>Protocol:</strong> {currentInspection.data.tls?.negotiated?.protocol || "N/A"}
                </span>
              </div>
            </div>

            <div
              className={`trust-badge-card ${isTrusted ? "trusted" : "untrusted"}`}
            >
              {isTrusted ? (
                <>
                  <ShieldCheck size={18} />
                  <span>TRUSTED CERTIFICATE</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={18} />
                  <span>UNTRUSTED / ISSUES</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        {currentInspection && (
          <div className="tabs-bar">
            <button
              className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <Shield size={14} />
              <span>Overview</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "chain" ? "active" : ""}`}
              onClick={() => setActiveTab("chain")}
            >
              <Layers size={14} />
              <span>Certificate Chain ({currentInspection.data.certificates?.count || 0})</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "protocols" ? "active" : ""}`}
              onClick={() => setActiveTab("protocols")}
            >
              <Lock size={14} />
              <span>TLS Protocols</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "headers" ? "active" : ""}`}
              onClick={() => setActiveTab("headers")}
            >
              <Radio size={14} />
              <span>HTTP Headers</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "json" ? "active" : ""}`}
              onClick={() => setActiveTab("json")}
            >
              <FileCode size={14} />
              <span>Raw JSON</span>
            </button>
          </div>
        )}

        {/* Content View Area */}
        <div className="tab-content-area">
          {/* Error Message */}
          {error && (
            <div className="error-card">
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ display: "block", marginBottom: 4 }}>
                  Inspection Request Error
                </strong>
                <p style={{ fontSize: "12.5px" }}>{error}</p>
              </div>
            </div>
          )}

          {/* Active Inspection Tab Views */}
          {currentInspection ? (
            <>
              {activeTab === "overview" && <OverviewTab envelope={currentInspection} />}
              {activeTab === "chain" && (
                <ChainTab chain={currentInspection.data.certificates?.chain} />
              )}
              {activeTab === "protocols" && <ProtocolsTab envelope={currentInspection} />}
              {activeTab === "headers" && (
                <HeadersTab metadata={currentInspection.metadata} />
              )}
              {activeTab === "json" && (
                <RawJsonTab rawJson={currentInspection.raw_json} />
              )}
            </>
          ) : (
            /* Welcome / Initial Dashboard Screen */
            <div className="welcome-screen">
              <div className="welcome-icon-box">
                <Lock size={36} />
              </div>

              <div>
                <h1 className="welcome-title">TLS Engine Desktop</h1>
                <p className="welcome-sub" style={{ marginTop: 8 }}>
                  Enter any hostname or domain to inspect its TLS negotiated parameters, cipher suites,
                  certificate chain validity, fingerprints, and transport metadata.
                </p>
              </div>

              <div style={{ marginTop: 16 }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: 10 }}>
                  Quick Launch Inspections:
                </span>
                <div className="sample-domains-wrap">
                  {sampleDomains.map((domain) => (
                    <button
                      key={domain}
                      className="sample-chip-btn"
                      onClick={() => {
                        setHostInput(domain);
                        handleRunInspection(domain);
                      }}
                    >
                      <span>{domain}</span>
                      <ArrowRight size={12} style={{ marginLeft: 6, display: "inline" }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Health Dialog Modal */}
      {showHealthModal && (
        <HealthModal
          health={health}
          loading={isCheckingHealth}
          onRefresh={refreshHealth}
          onClose={() => setShowHealthModal(false)}
        />
      )}

      {/* Settings Dialog Modal */}
      {showSettingsModal && (
        <SettingsModal
          historyCount={history.length}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Clear All Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirmModal}
        title="Clear All History"
        message="Are you sure you want to delete all inspection history?"
        confirmText="Delete All"
        cancelText="Cancel"
        onConfirm={executeClearAllHistory}
        onCancel={() => setShowClearConfirmModal(false)}
      />
    </div>
  );
}

export default App;
