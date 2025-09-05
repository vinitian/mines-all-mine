// app/gameGrid.tsx
"use client";
import React from "react";

type GameGridProps = {
  size: number;                 // e.g., 6, 8, 10
  onPick: (i: number) => void;  // index 0..size*size-1
};

export default function GameGrid({ size, onPick }: GameGridProps) {
  const cells = Array.from({ length: size * size }, (_, i) => i);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${size}, 40px)`,
        gap: "4px",
      }}
    >
      {cells.map((i) => (
        <button
          key={i}
          onClick={() => onPick(i)}
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "lightgray",
            border: "1px solid gray",
            borderRadius: "4px",
          }}
        >
          
        </button>
      ))}
    </div>
  );
}
