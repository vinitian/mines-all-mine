"use client";
import { useEffect, useState } from "react";

export default function WelcomeMessage({
  text = "Welcome to the Mines, All Mine!",
  duration = 3000,
}: {
  text?: string;
  duration?: number;
}) {
  const [visible, setVisible] = useState(true);
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let i = 0;
    const typing = setInterval(() => {
      setDisplayText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(typing);
    }, 50);

    const timer = setTimeout(() => setVisible(false), duration);
    return () => {
      clearInterval(typing);
      clearTimeout(timer);
    };
  }, [text, duration]);

  if (!visible) return null;

  return (
    <div className="fixed top-[10%] left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <p className="text-4xl font-semibold text-black animate-fadeInOut select-none">
        {displayText}
      </p>

    </div>
  );
}
