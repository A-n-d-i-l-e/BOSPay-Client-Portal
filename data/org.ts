// data/org.ts


export const BACKEND_URL = "https://my-next-backend-two.vercel.app";
/**
 * Fetches the organization ID for the authenticated user.
 * Calls the /api/get-org endpoint.
 * @param token Clerk's session token.
 * @returns The organization ID (string), or null if not found.
 */
export const fetchUserOrganizationId = async (token: string): Promise<string | null> => {
  const url = `${BACKEND_URL}/api/get-org`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn("Organization not found for the current user.");
        return null;
      }
      console.error(
        "Error fetching organization ID:",
        response.status,
        response.statusText
      );
      throw new Error(`Error fetching organization ID: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Fetched organization data:", data);

    if (data && data.orgId) {
      return data.orgId;
    } else {
      console.warn("API response did not contain orgId:", data);
      return null;
    }
  } catch (error: any) {
    console.error("Fetch organization error:", error);
    // Handle errors, perhaps re-throw or return null based on your needs
    return null; // Or throw error;
  }
};

export interface Org {
    name: string; // Or whatever properties your Org interface should have
    orgId: string; // Add orgId if your API returns the full org object
    // ... other organization properties
}
