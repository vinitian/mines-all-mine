interface AddScoresRequest {
  user_id_list: string[];
}

export default async function addScores(apiRequest: AddScoresRequest) {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
      : "";

  const response = await fetch(`${baseUrl}/api/user/add-scores`, {
    method: "PATCH",
    body: JSON.stringify(apiRequest),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to update winner scores");
  }
  return await response.json();
}
