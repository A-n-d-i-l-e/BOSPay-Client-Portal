export interface Category {
  name: string;
}

export const BACKEND_URL = "https://my-next-backend-two.vercel.app";

/**
 * Fetch all categories
 * @param token The authentication token
 */
export const fetchCategories = async (token: string): Promise<Category[]> => {
  const response = await fetch(`${BACKEND_URL}/api/categories`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching categories: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("API Response from fetchCategories:", data); // Debug log

  // Ensure data is returned as an array of objects with a `name` property
  return Array.isArray(data) ? data.map((item) => ({ name: item })) : [];
};

/**
 * Add a new category
 * @param token The authentication token
 * @param name The name of the new category
 */
export const addCategory = async (token: string, name: string): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/api/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(`Error adding category: ${response.statusText}`);
  }
};

export const updateCategory = async (
  token: string,
  oldName: string,
  newName: string
): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/api/categories`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: oldName, name: newName }),
  });

  if (!response.ok) {
    throw new Error(`Error updating category: ${response.statusText}`);
  }
};

/**
 * Delete a category
 * @param token The authentication token
 * @param name The name of the category to delete
 */
export const deleteCategory = async (token: string, name: string): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/api/categories`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(`Error deleting category: ${response.statusText}`);
  }
};