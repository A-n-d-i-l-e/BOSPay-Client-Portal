
export interface BalanceResponse {
  balance: number;
  previousBalance: number;
}

export const BACKEND_URL = "https://my-next-backend-two.vercel.app";

export const fetchBalance = async (token: string): Promise<BalanceResponse> => {
  const response = await fetch(`${BACKEND_URL}/api/balance`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = `Error fetching balance: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Fallback to statusText if JSON parsing fails
    }
    throw new Error(errorMessage);
  }

  const data: BalanceResponse = await response.json();
  console.log("API Response from fetchBalance:", data);
  return data;
};
