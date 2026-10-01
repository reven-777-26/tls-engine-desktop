import React, { useState, useEffect } from "react";
import {
  SHORTCUT_ACTIONS,
  UserShortcutMap,
  formatShortcutForDisplay,
  eventToShortcutKey,
  getDefaultShortcuts,
} from "../shortcuts";
import { Keyboard, RotateCcw, X, Info } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  shortcuts: UserShortcutMap;
  onUpdateShortcuts: (newShortcuts: UserShortcutMap) => void;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  shortcuts,
  onUpdateShortcuts,
  onClose,
}) => {
  const [recordingId, setRecordingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setRecordingId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleModalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !recordingId) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleModalKeyDown);
    return () => window.removeEventListener("keydown", handleModalKeyDown);
  }, [isOpen, recordingId, onClose]);

  useEffect(() => {
    if (!recordingId) return;

    const handleRecordingKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setRecordingId(null);
        return;
      }

      const combo = eventToShortcutKey(e);
      if (combo) {
        onUpdateShortcuts({
          ...shortcuts,
          [recordingId]: combo,
        });
        setRecordingId(null);
      }
    };

    window.addEventListener("keydown", handleRecordingKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleRecordingKeyDown, { capture: true });
    };
  }, [recordingId, shortcuts, onUpdateShortcuts]);

  if (!isOpen) return null;

  const handleResetAll = () => {
    onUpdateShortcuts(getDefaultShortcuts());
    setRecordingId(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="settings-modal-dialog simple-layout"
        style={{ width: "min(92vw, 560px)", maxHeight: "min(88vh, 680px)", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="settings-modal-header">
          <div className="settings-title-wrap">
            <div className="settings-icon-badge">
              <Keyboard size={18} color="var(--blue-primary)" />
            </div>
            <div>
              <h3>Keyboard Shortcuts</h3>
              <p>Assign custom keys for lightning-fast navigation</p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn-subtle"
            onClick={onClose}
            title="Close Shortcuts Modal (Esc)"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Panel */}
        <div
          className="settings-content-panel simple-panel"
          style={{ overflowY: "auto", maxHeight: "480px", padding: "16px 20px" }}
        >
          <div className="shortcuts-info-banner">
            <Info size={15} color="var(--blue-primary)" style={{ flexShrink: 0 }} />
            <span>
              Click any shortcut badge to reassign it. Press your desired keys, or press <strong>Esc</strong> to cancel.
            </span>
          </div>

          <div className="shortcuts-list-container">
            {SHORTCUT_ACTIONS.map((action) => {
              const currentKey = shortcuts[action.id] || action.defaultKey;
              const isRecording = recordingId === action.id;

              return (
                <div key={action.id} className="shortcut-row-item">
                  <div className="shortcut-meta-col">
                    <span className="shortcut-label">{action.label}</span>
                    <span className="shortcut-desc">{action.description}</span>
                  </div>

                  <div className="shortcut-key-col">
                    <button
                      type="button"
                      className={`shortcut-key-btn ${isRecording ? "is-recording" : ""}`}
                      onClick={() => setRecordingId(isRecording ? null : action.id)}
                      title={isRecording ? "Press new key combination or Esc" : "Click to reassign"}
                    >
                      {isRecording ? (
                        <span className="recording-text">Press keys...</span>
                      ) : (
                        <kbd className="shortcut-kbd">{formatShortcutForDisplay(currentKey)}</kbd>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-sidebar)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            type="button"
            className="icon-btn-subtle"
            onClick={handleResetAll}
            title="Reset all shortcuts to defaults"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
            }}
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "7px 18px",
              borderRadius: "8px",
              backgroundColor: "var(--blue-primary)",
              color: "#080c10",
              fontWeight: 600,
              fontSize: "12.5px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
