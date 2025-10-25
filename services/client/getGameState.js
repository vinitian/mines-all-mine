export default async function GetGameState(apiRequest) {
    const baseUrl =
        typeof window === "undefined"
            ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
            : ""

    const response = await fetch(`${baseUrl}/api/game`, {
        method: "GET",
        body: JSON.stringify(apiRequest),
        headers: {
            "Content-Type": "application/json"
        }
    })

    if (!response.ok) {
        return new Error("Failed to get game state")
    }

    return response.json()
}
