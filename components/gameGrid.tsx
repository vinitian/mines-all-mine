"use client";
import React from "react";
import { Bomb} from "lucide-react";



type GameGridProps = {
  size: number;
  onPick: (i: number) => void;
  revealed: Record<number, "hit" | "miss">; 
};

export default function GameGrid({ size, onPick, revealed }: GameGridProps) {
  const cells = Array.from({ length: size * size }, (_, i) => i);

  const containerWidth = 400;
  const gapSize = 4;
  const totalGapWidth = (size - 1) * gapSize;
  const cellSize = (containerWidth - totalGapWidth) / size;


  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
        gap: `${gapSize}px`,
        width: `${containerWidth}px`,
      }}
    >
      {cells.map((i) => {
        const status = revealed[i];                
        const isRevealed = status !== undefined;

        const bg =
          status === "hit" ? "#8499FF" :           
          status === "miss" ? "#FFFFFF" :        
          "#D4D4D4";                              

        const label =
          status === "hit" ? <Bomb size={cellSize * 0.5} color="white" />:
          status === "miss" ? " " :
          "";
          

        return (
          <button
            key={i}
            onClick={() => !isRevealed && onPick(i)}
            disabled={isRevealed}
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              backgroundColor: bg,
              border: "1px solid #848484",
              borderRadius: "4px",
              cursor: isRevealed ? "not-allowed" : "pointer",
              fontWeight: isRevealed ? 700 : 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
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
