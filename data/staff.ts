
export interface StaffMember {
  staffId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export const BACKEND_URL = "https://my-next-backend-two.vercel.app";

/**
 * Fetch all staff members.
 * @param token Clerk's session token.
 */
export const fetchStaff = async (token: string): Promise<StaffMember[]> => {
  const response = await fetch(`${BACKEND_URL}/api/staff/${token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error fetching staff: ${errorText || response.statusText}`);
  }

  const data = await response.json();
  return data.staff || [];
};

/**
 * Invite a new staff member.
 * @param payload The staff data to send.
 * @param token Clerk's session token.
 */
export const inviteStaff = async (
  payload: {
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  },
  token: string
): Promise<StaffMember> => {
  const response = await fetch(`${BACKEND_URL}/api/staff/inviteStaff`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Error inviting staff: ${response.statusText}`);
  }

  return response.json();
};
