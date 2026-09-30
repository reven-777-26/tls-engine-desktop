import React, { useState, useRef, useEffect } from "react";

export interface RareDeleteButtonProps {
  onConfirm?: () => void;
  onCancel?: () => void;
  title?: string;
  size?: "sm" | "md";
}

/**
 * RareUI-inspired Delete Button
 * Features:
 * - Animated sliding expansion
 * - Bin lid opening angle animation
 * - Inline check (confirm) and cross (cancel) buttons
 * - Success feedback animation
 * - Fully styled to integrate seamlessly into dark/neutral UI
 */
export const RareDeleteButton: React.FC<RareDeleteButtonProps> = ({
  onConfirm,
  onCancel,
  title = "Clear all",
  size = "sm",
}) => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "deleted" | "kept">("idle");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (open && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        onCancel?.();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open, onCancel]);

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => {
      setStatus("idle");
    }, status === "deleted" ? 1200 : 400);
    return () => clearTimeout(timer);
  }, [status]);

  const handleTrigger = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      onCancel?.();
    } else {
      setStatus("idle");
      setOpen(true);
    }
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    setStatus("deleted");
    onConfirm?.();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    setStatus("kept");
    onCancel?.();
  };

  return (
    <div
      ref={containerRef}
      className={`rare-del-btn-container ${size} ${open ? "is-open" : ""} status-${status}`}
      title={open ? "Confirm deletion" : title}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          onCancel?.();
        }
      }}
    >
      <button
        type="button"
        className="rare-del-trigger"
        onClick={handleTrigger}
        aria-label={title}
        aria-expanded={open}
      >
        {status === "deleted" ? (
          <svg
            className="rare-del-icon check-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12.5 9.5 18 20 7" />
          </svg>
        ) : (
          <svg
            className="rare-del-icon bin-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              className="rare-del-lid"
              d="M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            />
            <path
              className="rare-del-body"
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
            />
          </svg>
        )}
      </button>

      <div className="rare-del-panel">
        <span className="rare-del-divider" />
        <button
          type="button"
          className="rare-del-action confirm"
          onClick={handleConfirm}
          aria-label="Confirm"
          title="Confirm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12.5 9.5 18 20 7" />
          </svg>
        </button>
        <button
          type="button"
          className="rare-del-action cancel"
          onClick={handleCancel}
          aria-label="Cancel"
          title="Cancel"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
