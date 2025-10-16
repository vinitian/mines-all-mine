import { Cell } from "../game_logic";

interface UpdateGameState {
  id: number;
  size?: number;
  bomb_count?: number;
  placement?:Array<Cell>;
  score_list?:number[];
  current_turn?:number;
}

export default async function GetGameState(apiRequest: UpdateGameState) {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
      : "";

  const response = await fetch(`${baseUrl}/api/game`, {
    method: "PATCH",
    body: JSON.stringify(apiRequest),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return new Error("Failed to update game state");
  }

  return response.json();
}
