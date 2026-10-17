"use client";

import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type DetailDialogProps = {
  title: string;
  description?: string;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
};

export default function DetailDialog({ title, description, onClose, triggerRef, children }: DetailDialogProps) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const titleId = "weather-detail-title";
  const descriptionId = "weather-detail-description";

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const getFocusable = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) ?? []).filter((node) => node.getClientRects().length > 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panelRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      const target = triggerRef.current?.isConnected ? triggerRef.current : previousFocus;
      target?.focus();
    };
  }, [onClose, triggerRef]);

  const duration = prefersReducedMotion ? 0 : 0.2;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-2 backdrop-blur-sm sm:p-5"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration }}
        onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
        onTouchStart={(event) => { if (event.target === event.currentTarget) onClose(); }}
      >
        <motion.section
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className="theme-panel theme-card flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl sm:max-h-[min(88dvh,52rem)] sm:rounded-3xl"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12, scale: prefersReducedMotion ? 1 : 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 8, scale: prefersReducedMotion ? 1 : 0.99 }}
          transition={{ duration, ease: "easeOut" }}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b p-5 sm:p-7" style={{ borderColor: "var(--line)" }}>
            <div className="min-w-0">
              <h2 id={titleId} className="font-serif text-2xl font-semibold leading-tight sm:text-3xl">{title}</h2>
              {description && <p id={descriptionId} className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{description}</p>}
            </div>
            <button ref={closeRef} type="button" onClick={onClose} className="theme-control shrink-0 rounded-full border px-4 py-2 text-sm transition hover:-translate-y-0.5" aria-label="關閉詳細資訊">關閉</button>
          </header>
          <div className="min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-7">{children}</div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
