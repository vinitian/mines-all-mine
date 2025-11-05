export default async function resetEverything(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const response = await fetch("/api/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to reset everything");
  }

  const data = await response.json();
  return data;
}
