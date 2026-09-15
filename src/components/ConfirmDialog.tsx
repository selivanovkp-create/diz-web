"use client";

import { Button } from "@/components/ui";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Удалить",
  cancelLabel = "Отмена",
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-[#141414]/40"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative z-[111] w-full max-w-[430px] rounded-t-[28px] bg-bg-elevated px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5 shadow-[0_-12px_48px_rgba(20,20,20,0.18)] sm:rounded-[28px]"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line sm:hidden" />
        <h2
          id="confirm-title"
          className="font-display text-[1.7rem] leading-tight tracking-tight"
        >
          {title}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{body}</p>
        <div className="mt-6 space-y-2">
          <Button
            className="w-full"
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
