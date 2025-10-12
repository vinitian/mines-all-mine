"use client";

import { useEffect, useRef, useState } from "react";

type Counter = {
  open: boolean;
  seconds?: number;
  onComplete: () => void;
  escToClose?: boolean;
  onCancel?: () => void;
};

export default function CountdownModal({
  open,
  seconds = 3,
  onComplete,
  escToClose = false,
  onCancel,
}: Counter) {
  const [left, setLeft] = useState(seconds);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setLeft(seconds);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    setLeft(seconds); 
    timerRef.current = window.setInterval(() => {
      setLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [open, seconds]);

  const firedRef = useRef(false);
  useEffect(() => {
    if (!open) return;
    if (left === 0 && !firedRef.current) {
      firedRef.current = true;
      const t = setTimeout(() => {
        onComplete();
        firedRef.current = false;
      }, 200);
      return () => clearTimeout(t);
    }
  }, [left, open, onComplete]);

  useEffect(() => {
    if (!open || !escToClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        onCancel?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, escToClose, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Game starting countdown"
    >
      <div className="w-[min(90vw,400px)] rounded-2xl bg-white p-8 shadow-xl flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-sm tracking-wide">Game starts in</p>
        <div
          key={left} 
          className="text-7xl font-extrabold leading-none select-none animate-[pop_300ms_ease-out]"
        >
          {left}
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-800 transition-[width] duration-300"
            style={{
              width: `${((seconds - left) / seconds) * 100}%`,
            }}
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
