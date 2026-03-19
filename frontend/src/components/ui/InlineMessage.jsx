import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export function InlineMessage({ type = "error", message, onClose, className = "" }) {
  if (!message) return null;

  const toneClass =
    type === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : type === "info"
        ? "bg-sky-50 border-sky-200 text-sky-700"
        : "bg-red-50 border-red-200 text-red-700";

  return (
    <div className={cn("rounded-lg border px-3 py-2 text-sm flex items-start justify-between gap-3", toneClass, className)}>
      <p>{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="mt-0.5 shrink-0 rounded p-0.5 hover:bg-black/5"
          aria-label="Close message"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
