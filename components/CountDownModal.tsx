"use client";

import { useEffect } from "react";

type Counter = {
  open: boolean;
  totalSeconds: number;
  remainingSeconds: number;
  onComplete: () => void;
  escToClose?: boolean;
  onCancel?: () => void;
};

export default function CountdownModal({
  open,
  totalSeconds,
  remainingSeconds,
  onComplete,
  escToClose = false,
  onCancel,
}: Counter) {
  // fire exactly once when it hits 0
  useEffect(() => {
    if (!open) return;
    if (remainingSeconds <= 0) onComplete();
  }, [open, remainingSeconds, onComplete]);

  useEffect(() => {
    if (!open || !escToClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, escToClose, onCancel]);

  if (!open) return null;

  const pct =
    totalSeconds > 0
      ? Math.min(
          100,
          Math.max(0, ((totalSeconds - remainingSeconds) / totalSeconds) * 100)
        )
      : 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Game starting countdown"
    >
      <div className="w-[min(90vw,400px)] rounded-2xl bg-white p-8 shadow-xl flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-sm tracking-wide">Game starts in</p>
        <div className="text-7xl font-extrabold leading-none select-none animate-[pop_300ms_ease-out]">
          {Math.max(0, Math.ceil(remainingSeconds))}
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-800 transition-[width] duration-200"
            style={{ width: `${pct}%` }}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          />
        </div>
        <p className="text-xs text-gray-400">Get ready…</p>
      </div>

      <style jsx>{`
        @keyframes pop {
          0% {
            transform: scale(0.9);
            opacity: 0.5;
          }
          60% {
            transform: scale(1.08);
            opacity: 1;
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
