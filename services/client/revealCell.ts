import {Cell, Field} from "@/services/game_logic";

interface RevealCellRequest {
  user_id: string;
  index: number;
}

export default async function revealCell(apiRequest: RevealCellRequest) {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
      : "";

  const response = await fetch(`${baseUrl}/api/field/reveal`, {
    method: "PATCH",
    body: JSON.stringify(apiRequest),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return new Error("Cell already revealed");
  }
  return response.json();
}
