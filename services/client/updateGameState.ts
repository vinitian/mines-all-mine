import { Cell } from "../game_logic";

interface UpdateGameState {
  id: number;
  name?: string;
  host_id?: string;
  player_id_list?: Array<string>;
  size?: number;
  player_limit?: number;
  bomb_count?: number;
  chat_enabled?: boolean;
  timer?: number;
  game_started?: boolean;
  placement?: Array<Cell>;
  score_list?: number[];
  current_turn?: number;
}

export default async function updateGameState(apiRequest: UpdateGameState) {
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
