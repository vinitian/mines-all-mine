export default async function updatePlayerList(apiRequest) {
    const baseUrl =
        typeof window === "undefined"
            ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
            : "";

    const response = await fetch(
        `${baseUrl}/api/room/${apiRequest.roomId}/update-player`,
        {
            method: "PATCH",
            body: JSON.stringify(apiRequest),
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to update player list: " + response.statusText);
    }
    return response.json();
}
