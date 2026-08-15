import React, { useEffect } from "react";
import { AlertTriangle, Trash2, Info, X } from "lucide-react";

export interface CustomConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string | undefined;
  cancelText?: string | undefined;
  type?: "danger" | "warning" | "info" | undefined;
  onConfirm: () => void;
  onClose: () => void;
}

export const CustomConfirmModal: React.FC<CustomConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger",
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isInfo = type === "info";
  const isDanger = type === "danger";

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header accent line */}
        <div
          className={`h-1.5 w-full ${
            isDanger
              ? "bg-gradient-to-r from-red-500 via-rose-500 to-amber-500"
              : isInfo
              ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
              : "bg-gradient-to-r from-amber-500 to-orange-500"
          }`}
        />

        <div className="p-6">
          {/* Top row with icon & close button */}
          <div className="flex items-start justify-between">
            <div
              className={`p-3 rounded-xl flex items-center justify-center ${
                isDanger
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : isInfo
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              {isDanger ? (
                <Trash2 className="w-6 h-6" />
              ) : isInfo ? (
                <Info className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title & Message */}
          <div className="mt-4">
            <h3 className="text-xl font-bold text-slate-100">{title}</h3>
            <p className="mt-2 text-sm text-slate-300 whitespace-pre-line leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            {cancelText && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl font-medium text-sm text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all shadow-sm active:scale-95"
              >
                {cancelText}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
                isDanger
                  ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-900/30"
                  : isInfo
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-900/30"
                  : "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-900/30"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
