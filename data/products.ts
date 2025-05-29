export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string; // Changed from image to imageUrl to match backend
  orgId: string;
}

export const BACKEND_URL = "https://my-next-backend-two.vercel.app";

/**
 * Fetch all products.
 * @param token Clerk's session token.
 */
export const fetchProducts = async (token: string): Promise<Product[]> => {
  const response = await fetch(`${BACKEND_URL}/api/products`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching products: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch a single product by ID.
 * @param id Product ID.
 * @param token Clerk's session token.
 */
export const fetchProductById = async (id: string, token: string): Promise<Product> => {
  const response = await fetch(`${BACKEND_URL}/api/products/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching product: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Update a product by ID.
 * @param id Product ID.
 * @param updatedProduct Updated product data.
 * @param token Clerk's session token.
 */
export const updateProductById = async (
  id: string,
  updatedProduct: Partial<Product>,
  token: string
): Promise<Product> => {
  const response = await fetch(`${BACKEND_URL}/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updatedProduct),
  });

  if (!response.ok) {
    throw new Error(`Error updating product: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Delete a product by ID.
 * @param id Product ID.
 * @param token Clerk's session token.
 */
export const deleteProductById = async (id: string, token: string): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/api/products/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error deleting product: “One or more validation errors occurred.”`);
  }
};