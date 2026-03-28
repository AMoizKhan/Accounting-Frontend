import type { Toast, ToastType } from "@/contexts/ToastContext";

function stylesForType(type: ToastType) {
  switch (type) {
    case "success":
      return {
        border: "border-emerald-500/40",
        bg: "bg-emerald-500/10",
        title: "text-emerald-300",
      };
    case "info":
      return {
        border: "border-sky-500/40",
        bg: "bg-sky-500/10",
        title: "text-sky-300",
      };
    case "error":
    default:
      return {
        border: "border-rose-500/40",
        bg: "bg-rose-500/10",
        title: "text-rose-300",
      };
  }
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-16 z-[60] flex w-[320px] flex-col gap-2 md:right-6">
      {toasts.map((t) => {
        const s = stylesForType(t.type);
        return (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-xl backdrop-blur ${s.border} ${s.bg}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={`text-sm font-semibold ${s.title}`}>{t.title || t.type.toUpperCase()}</div>
                <div className="mt-1 text-sm text-slate-200">{t.message}</div>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

