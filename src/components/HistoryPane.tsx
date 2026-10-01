import React from "react";
import { HistoryItemSummary } from "../types";
import { Search, Inbox, ShieldCheck, AlertTriangle, PanelLeftClose } from "lucide-react";
import { RareDeleteButton } from "./RareDeleteButton";
import { DateFormatType, formatCustomDate } from "../settings";

interface HistoryPaneProps {
  isOpen?: boolean;
  history: HistoryItemSummary[];
  selectedId: number | null;
  searchQuery: string;
  dateFormat: DateFormatType;
  onSearchChange: (q: string) => void;
  onSelectInspection: (item: HistoryItemSummary) => void;
  onDeleteInspection: (e: React.MouseEvent, id: number) => void;
  onClearHistory: () => void;
  onClose: () => void;
}

export const HistoryPane: React.FC<HistoryPaneProps> = ({
  isOpen = true,
  history,
  selectedId,
  searchQuery,
  dateFormat,
  onSearchChange,
  onSelectInspection,
  onDeleteInspection,
  onClearHistory,
  onClose,
}) => {
  const formatTime = (isoString: string) => {
    return formatCustomDate(isoString, dateFormat);
  };

  return (
    <aside className={`history-pane ${isOpen ? "is-open" : "is-collapsed"}`} aria-hidden={!isOpen}>
      <div className="history-pane-inner">
      <div className="history-header">
        <div className="history-title">
          <Inbox size={18} color="#38bdf8" />
          <span>Inspections</span>
        </div>

        <div className="history-actions">
          <button
            type="button"
            className="icon-btn-subtle"
            onClick={onClose}
            title="Close Inspections panel"
            aria-label="Close side panel"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
      </div>

      <div className="search-box-wrap">
        <div className="history-search-input-container">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="history-search-input"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {history.length > 0 && (
          <RareDeleteButton
            onConfirm={onClearHistory}
            title="Clear all"
          />
        )}
      </div>

      <div className="history-list">
        {history.length === 0 ? (
          <div className="empty-state">
            <Inbox size={32} opacity={0.4} />
            <p style={{ fontSize: "12px" }}>
              {searchQuery ? "No matching scans found" : "No saved inspections yet"}
            </p>
          </div>
        ) : (
          history.map((item) => {
            const isSelected = selectedId === item.id;
            return (
              <div
                key={item.id}
                className={`history-item ${isSelected ? "selected" : ""}`}
                onClick={() => onSelectInspection(item)}
              >
                <div className="history-item-top">
                  <div className="history-host-row">
                    <span className={`status-dot ${isSelected ? "blue" : "muted"}`} />
                    <span className="history-host-text" title={item.host}>
                      {item.host}
                    </span>
                  </div>
                  <span className="history-time">{formatTime(item.inspected_at)}</span>
                </div>

                <div className="history-item-bottom">
                  <div className="history-item-meta">
                    {item.is_trusted ? (
                      <span className="badge-tag trusted" title="Trusted certificate chain">
                        <ShieldCheck size={11} />
                        <span>Trusted</span>
                      </span>
                    ) : (
                      <span className="badge-tag untrusted" title="Certificate issue detected">
                        <AlertTriangle size={11} />
                        <span>Issues</span>
                      </span>
                    )}

                    {item.tls_version && (
                      <span className="badge-tag">
                        <span>{item.tls_version}</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="history-item-delete"
                    onClick={(e) => onDeleteInspection(e, item.id)}
                    title="Delete from history"
                    aria-label="Delete entry"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      </div>
    </aside>
  );
};
