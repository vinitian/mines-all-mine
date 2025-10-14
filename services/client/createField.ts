interface CreateFieldRequest {
  id: string;
  sizex: number;
  sizey: number;
  bombcount: number
}

export default async function createField(apiRequest: CreateFieldRequest) {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
      : "";

  const response = await fetch(`${baseUrl}/api/field`, {
    method: "POST",
    body: JSON.stringify(apiRequest),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return new Error("Failed to create field");
  }

  const result = await response.json();
  console.log("Field created successfully", result);
  return result;
}
