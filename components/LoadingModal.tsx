"use client";

import { useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";

export default function LoadingModal({ text = "Loading" }: { text?: string }) {
  const [loadingText, setLoadingText] = useState(`${text}.`);

  useEffect(() => {
    setTimeout(() => {
      if (loadingText == `${text}.`) {
        setLoadingText(`${text}..`);
      } else if (loadingText == `${text}..`) {
        setLoadingText(`${text}...`);
      } else {
        setLoadingText(`${text}.`);
      }
    }, 700);
  }, [loadingText, text]);

  return (
    <div className="h-screen flex items-center justify-center backdrop-blur-sm bg-black/30 fixed inset-0">
      <div className="p-5 w-3/4 max-w-100 h-84 bg-white rounded-2xl shadow flex flex-col gap-5 items-center justify-center text-center whitespace-pre-line">
        <BeatLoader color={"#d4d4d4"} size={30} aria-label="Loading" />
        <p>{loadingText}</p>
      </div>
    </div>
  );
}
