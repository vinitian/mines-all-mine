"use client";
import { Bomb } from "lucide-react";

type CellDisplayData = {
  is_open: boolean;
  index: number;
  number: number;
  bomb: boolean;
};

type GameGridProps = {
  size: number;
  onPickAction: (i: number) => void;
  revealed: Record<number, CellDisplayData>;
};

export default function GameGrid({
  size,
  onPickAction,
  revealed,
}: GameGridProps) {
  console.log("GameGrid render");

  const cells = Array.from({ length: size * size }, (_, i) => i);

  const containerWidth = 400;
  const gapSize = 4;
  const totalGapWidth = (size - 1) * gapSize;
  const cellSize = (containerWidth - totalGapWidth) / size;

  if (Object.keys(revealed).length <= 0) {
    return (
      <div>
        Error loading game grid: <pre>revealed</pre> has no value
      </div>
    );
  }
  return (
    // still has ui bug on flexbox e.g. try screen size 900 x 790
    <div className="flex flex-grow justify-center items-center align-center">
      <div
        className={`md:h-full w-full md:w-fit aspect-square grid gap-1 grid-cols-${size} `}
      >
        {cells.map((i) => {
          const cellInfo = revealed[i];
          const isRevealed = cellInfo.is_open;
          const isBomb = cellInfo.bomb;
          const number = cellInfo.number;

          const bg =
            isRevealed && isBomb
              ? "#8499FF"
              : isRevealed && !isBomb
              ? "#FFFFFF"
              : "#D4D4D4";

          const label =
            isRevealed && isBomb ? (
              <Bomb size={cellSize * 0.4} color="white" />
            ) : isRevealed && !isBomb && number != 0 ? (
              <span
                style={{
                  fontSize: `${cellSize * 0.4}px`,
                  fontWeight: 700,
                  color: getHintColor(number),
                }}
              >
                {number}
              </span>
            ) : (
              ""
            );

          return (
            <button
              key={i}
              onClick={() => !isRevealed && onPickAction(i)}
              disabled={isRevealed}
              style={{
                backgroundColor: bg,
                border: "1px solid #848484",
                borderRadius: "4px",
                cursor: isRevealed ? "not-allowed" : "pointer",
                fontWeight: isRevealed ? 700 : 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                aspectRatio: 1 / 1,
                minHeight: "10px",
                minWidth: "10px",
              }}
              aria-label={`${i}th cell`}
            >
              {label}
            </button>
          );
        })}
      </div>
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
