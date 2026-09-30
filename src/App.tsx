import React, { useState, useEffect } from "react";
import "./App.css";
import { MacDock } from "./components/MacDock";
import { HistoryPane } from "./components/HistoryPane";
import { OverviewTab } from "./components/OverviewTab";
import { ChainTab } from "./components/ChainTab";
import { ProtocolsTab } from "./components/ProtocolsTab";
import { HeadersTab } from "./components/HeadersTab";
import { RawJsonTab } from "./components/RawJsonTab";
import { ConfirmModal } from "./components/ConfirmModal";
import { SettingsModal } from "./components/SettingsModal";
import {
  UserAppSettings,
  loadSettings,
  saveSettings,
  applySettingsToDOM,
  DEFAULT_SETTINGS,
} from "./settings";
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
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Radio,
  FileCode,
  Shield,
  Layers,
  ArrowRight,
  RefreshCw,
  PanelLeftOpen,
  Home,
} from "lucide-react";

import { initAppleSmoothScroll } from "./smoothScroll";

export function App() {
  const [activeNav, setActiveNav] = useState("inspect");
  const [activeTab, setActiveTab] = useState<"overview" | "chain" | "protocols" | "headers" | "json">("overview");
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<UserAppSettings>(() => {
    const s = loadSettings();
    applySettingsToDOM(s);
    return s;
  });

  const [hostInput, setHostInput] = useState("");
  const [currentInspection, setCurrentInspection] = useState<InspectionEnvelope | null>(null);
  const [history, setHistory] = useState<HistoryItemSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  // Initialize Apple-style gravitational smooth scroll and load initial data
  useEffect(() => {
    let scrollInstance: { destroy: () => void } | null = null;
    if (settings.smoothScroll) {
      scrollInstance = initAppleSmoothScroll();
    }
    refreshHistory();
    refreshHealth();

    return () => {
      scrollInstance?.destroy();
    };
  }, [settings.smoothScroll]);

  const handleUpdateSettings = (newSettings: UserAppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    applySettingsToDOM(newSettings);
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    applySettingsToDOM(DEFAULT_SETTINGS);
  };

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
      setHostInput(""); // Clear search bar so next URL can be immediately inspected
      setActiveTab("overview");
      setActiveNav("inspect");
      await refreshHistory(searchQuery);
    } catch (err: any) {
      setCurrentInspection(null);
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
      setHostInput(""); // Clear search bar for next inspection
      setActiveNav("inspect");
    } catch (err: any) {
      setCurrentInspection(null);
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

  const handleClearAllHistory = async () => {
    try {
      await clearHistory();
      setHistory([]);
      setShowClearConfirmModal(false);
    } catch (err: any) {
      console.error("Failed to clear history:", err);
    }
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

  const handleInspectRailClick = () => {
    setActiveNav("inspect");
    if (currentInspection && activeTab !== "overview") {
      setActiveTab("overview");
    } else {
      setHostInput("");
      setCurrentInspection(null);
      setError(null);
    }
  };

  const handleHistoryRailClick = () => {
    if (activeNav === "history" && isHistoryOpen) {
      setIsHistoryOpen(false);
      setActiveNav("inspect");
    } else {
      setIsHistoryOpen(true);
      setActiveNav("history");
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
    <div className={`app-container ${settings.showFloatingDock ? "has-mac-dock" : ""}`}>
      {/* 1. Middle History Column (Sidebar) */}
      <HistoryPane
        isOpen={isHistoryOpen}
        history={history}
        selectedId={currentInspection?.id || null}
        searchQuery={searchQuery}
        dateFormat={settings.dateFormat}
        onSearchChange={setSearchQuery}
        onSelectInspection={handleSelectHistoryItem}
        onDeleteInspection={handleDeleteHistoryItem}
        onClearHistory={handleClearAllHistory}
        onClose={() => {
          setIsHistoryOpen(false);
          setActiveNav("inspect");
        }}
      />

      {/* 3. Main Workspace */}
      <div className="main-workspace">
        {/* Top Header Inspection Bar */}
        <div className="top-inspection-bar">
          <div className="top-bar-left">
            <button
              type="button"
              className={`sidebar-toggle-btn ${!isHistoryOpen ? "is-visible" : "is-hidden"}`}
              onClick={() => {
                setIsHistoryOpen(true);
                setActiveNav("history");
              }}
              title="Open side panel"
              aria-label="Open side panel"
              tabIndex={!isHistoryOpen ? 0 : -1}
            >
              <PanelLeftOpen size={15} />
            </button>

            {/* Home / Return to Main Search Screen Button */}
            <button
              type="button"
              className={`top-bar-home-btn ${currentInspection ? "is-visible" : "is-hidden"}`}
              onClick={() => {
                setCurrentInspection(null);
                setHostInput("");
                setActiveNav("inspect");
              }}
              title="Return to Main Search Screen"
              aria-label="Home"
              tabIndex={currentInspection ? 0 : -1}
            >
              <Home size={14} color="var(--blue-primary)" style={{ flexShrink: 0 }} />
              <span>Home</span>
            </button>
          </div>

          <div className="top-bar-center">
            {currentInspection ? (
              <form
                className="host-input-group"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunInspection();
                }}
              >
                <input
                  type="text"
                  className="host-input"
                  placeholder={currentInspection ? `Inspect another domain (currently ${currentInspection.host})...` : "Enter domain or IP (e.g. example.com, github.com)..."}
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
                      <Search size={14} />
                      <span>Inspect</span>
                    </>
                  )}
                </button>
              </form>
            ) : null}
          </div>

          <div className="top-bar-right">
            {/* Live Health Badge */}
            <div
              className="health-pill"
              title={
                isCheckingHealth
                  ? "Checking server connectivity..."
                  : health?.healthy
                  ? "Server Status: Online"
                  : "Server Status: Offline"
              }
            >
              <span
                className={`health-indicator ${isCheckingHealth ? "checking" : health?.healthy ? "online" : health ? "offline" : "checking"}`}
              />
              <span>
                {isCheckingHealth
                  ? "Server Status: Checking..."
                  : health
                  ? health.healthy
                    ? "Server Status: Online"
                    : "Server Status: Offline"
                  : "Server Status: Checking..."}
              </span>
            </div>

            {/* Quick Settings Shortcut button in top bar */}
            <button
              type="button"
              className="icon-btn-subtle"
              onClick={() => setIsSettingsOpen(true)}
              title="Preferences & Settings"
              aria-label="Settings"
              style={{
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "6px 8px",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
              }}
            >
              <Cpu size={14} style={{ display: "none" }} />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Target Header Summary Banner */}
        {currentInspection && (
          <div className="target-summary-header">
            <div className="target-info-col">
              <div className="target-host-title">
                <Globe size={22} color="#e2e8f0" />
                <span>{currentInspection.host}</span>
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
              onClick={() => {
                setActiveTab("overview");
                setActiveNav("inspect");
              }}
            >
              <Shield size={14} />
              <span>Overview</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "chain" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("chain");
                setActiveNav("inspect");
              }}
            >
              <Layers size={14} />
              <span>Certificate Chain ({currentInspection.data.certificates?.count || 0})</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "protocols" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("protocols");
                setActiveNav("inspect");
              }}
            >
              <Cpu size={14} />
              <span>TLS Protocols</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "headers" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("headers");
                setActiveNav("inspect");
              }}
            >
              <Radio size={14} />
              <span>HTTP Headers</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "json" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("json");
                setActiveNav("inspect");
              }}
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
                <RawJsonTab
                  rawJson={currentInspection.raw_json}
                  syntaxHighlighting={settings.jsonSyntaxHighlighting}
                />
              )}
            </>
          ) : (
            /* Welcome / Initial Dashboard Screen */
            <div className="welcome-screen">
              <div className="welcome-icon-box">
                <ShieldCheck size={38} strokeWidth={2} />
              </div>

              <div>
                <h1 className="welcome-title">TLS Engine Desktop</h1>
              </div>

              {/* Centered Hero Search Bar */}
              <form
                className="welcome-search-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunInspection();
                }}
              >
                <div className="welcome-input-wrap">
                  <input
                    type="text"
                    className="welcome-search-input"
                    placeholder="Enter domain or IP (e.g. example.com, github.com)..."
                    value={hostInput}
                    onChange={(e) => setHostInput(e.target.value)}
                    disabled={isInspecting}
                    autoFocus
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
                        <Search size={14} />
                        <span>Inspect TLS</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div style={{ marginTop: 6 }}>
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

      {/* macOS Centered Floating Dock (Home Taskbar) */}
      {settings.showFloatingDock && (
        <MacDock
          activeNav={activeNav}
          isHistoryOpen={isHistoryOpen}
          onInspectClick={handleInspectRailClick}
          onHistoryClick={handleHistoryRailClick}
          onSettingsClick={() => setIsSettingsOpen(true)}
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

      {/* Appearance & Customization Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetSettings={handleResetSettings}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
