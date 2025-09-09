"use client";
import React from "react";

type GameGridProps = {
  size: number;
  onPick: (i: number) => void;
  revealed: Record<number, "hit" | "miss">; 
};

export default function GameGrid({ size, onPick, revealed }: GameGridProps) {
  const cells = Array.from({ length: size * size }, (_, i) => i);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${size}, 40px)`,
        gap: "4px",
      }}
    >
      {cells.map((i) => {
        const status = revealed[i];                
        const isRevealed = status !== undefined;

        const bg =
          status === "hit" ? "#fecaca" :           
          status === "miss" ? "#e5e7eb" :        
          "#d1d5db";                              

        const label =
          status === "hit" ? "💣" :
          status === "miss" ? "✖" :
          "";

        return (
          <button
            key={i}
            onClick={() => !isRevealed && onPick(i)}
            disabled={isRevealed}
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: bg,
              border: "1px solid gray",
              borderRadius: "4px",
              cursor: isRevealed ? "not-allowed" : "pointer",
              fontWeight: isRevealed ? 700 : 400,
            }}
            aria-label={`cell-${i}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
