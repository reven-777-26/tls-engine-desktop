import React from "react";
import { HistoryItemSummary } from "../types";
import { Search, Trash2, Inbox, ShieldCheck, AlertTriangle } from "lucide-react";

interface HistoryPaneProps {
  history: HistoryItemSummary[];
  selectedId: number | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectInspection: (item: HistoryItemSummary) => void;
  onDeleteInspection: (e: React.MouseEvent, id: number) => void;
  onClearHistory: () => void;
}

export const HistoryPane: React.FC<HistoryPaneProps> = ({
  history,
  selectedId,
  searchQuery,
  onSearchChange,
  onSelectInspection,
  onDeleteInspection,
  onClearHistory,
}) => {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();

      const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      if (isToday) {
        return `Today ${timeStr}`;
      }
      return `${date.toISOString().split("T")[0]} ${timeStr}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="history-pane">
      <div className="history-header">
        <div className="history-title">
          <Inbox size={18} color="#38bdf8" />
          <span>Inspections</span>
        </div>

        <div className="history-actions">
          {history.length > 0 && (
            <button
              className="icon-btn-subtle danger"
              onClick={onClearHistory}
              title="Clear all inspection history"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="search-box-wrap">
        <Search size={14} className="search-icon" />
        <input
          type="text"
          className="history-search-input"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
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

                <div className="history-item-meta">
                  {item.is_trusted ? (
                    <span className="badge-tag trusted" title="Trusted certificate chain">
                      <ShieldCheck size={11} style={{ marginRight: 3 }} />
                      Trusted
                    </span>
                  ) : (
                    <span className="badge-tag untrusted" title="Certificate issue detected">
                      <AlertTriangle size={11} style={{ marginRight: 3 }} />
                      Issues
                    </span>
                  )}

                  {item.tls_version && (
                    <span className="badge-tag">{item.tls_version}</span>
                  )}

                  {item.x_cache && (
                    <span className="badge-tag cache-hit">
                      {item.x_cache}
                    </span>
                  )}
                </div>

                <button
                  className="history-item-delete"
                  onClick={(e) => onDeleteInspection(e, item.id)}
                  title="Delete from history"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
