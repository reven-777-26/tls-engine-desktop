import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Delete All",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        backdropFilter: "blur(4px)",
      }}
      onClick={onCancel}
    >
      <div
        className="section-card"
        style={{
          width: 420,
          backgroundColor: "#182228",
          border: "1px solid #273845",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.7)",
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ef4444",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f1f5f9" }}>{title}</h3>
          </div>
          <button className="icon-btn-subtle" onClick={onCancel}>
            <X size={16} />
          </button>
        </div>

        <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.5", marginBottom: 24 }}>
          {message}
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            className="cancel-btn"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="danger-btn"
            onClick={onConfirm}
          >
            <Trash2 size={14} style={{ marginRight: 6 }} />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
