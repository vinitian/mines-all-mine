"use client";
import React from "react";
import { Bomb} from "lucide-react";

type CellStatus = {
  type: 'hit' | 'miss';
  hintNumber?: number;
};

type GameGridProps = {
  size: number;
  onPick: (i: number) => void;
  revealed: Record<number, CellStatus>; 
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
          status && status.type === "hit" ? "#8499FF" :           
          status && status.type === "miss" ? "#FFFFFF" :        
          "#D4D4D4";                              

          const label =
          status?.type === "hit" ? (
            <Bomb size={cellSize * 0.5} color="white" />
          ) : status?.type === "miss" && status.hintNumber && status.hintNumber > 0 ? (
            <span style={{ 
              fontSize: `${cellSize * 0.4}px`, 
              fontWeight: 700,
              color: getHintColor(status.hintNumber)
            }}>
              {status.hintNumber}
            </span>
          ) : (
            ""
          );
          

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

function getHintColor(num: number): string {
  const colors: Record<number, string> = {
    1: "#8499FF",  
    2: "#2DDB81", 
    3: "#F26690", 
    4: "#E496F5",
    5: "#FEB943", 
    6: "#52C2D8",  
    7: "#9AC71F", 
    8: "#D88928",  
  };
  return colors[num] || "#000000";
}
