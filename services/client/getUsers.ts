export default async function getUsers() {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
      : "";

  const response = await fetch(`${baseUrl}/api/user`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  return await response.json();
}
