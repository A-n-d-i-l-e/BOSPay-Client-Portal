// data/transactions.ts

// import { ConfirmedTransaction as ConfirmedTransactionType } from "@/types/transaction";
// import { Organization } from "@/types/organization";

// Use the correct backend URL
export const BACKEND_URL = "https://my-next-backend-two.vercel.app";

// Define and EXPORT a type for the Confirmed Transaction data
export interface ConfirmedTransaction {
  _id?: string; // MongoDB's default ID (optional as your API might not always return it)
  invoiceId: string;
  merchantAddress: string;
  staffId: string;
  userId: string; // userId from Clerk/JWT
  qrCodeId: string;
  amount: string;
  convertedAmount: string;
  statusReadable: string;
  fromAddress: string;
  transactionHash: string;
  tokenAddress?: string;
  tokenAmount?: string;
  tokenSymbol?: string;
  orgId: string; // orgId associated with the transaction
  createdAt: string; // Stored as string initially, convert to Date
  updatedAt: string; // Stored as string initially, convert to Date
  txFee?: string;
}

/**
 * Fetch a list of confirmed transactions for the authenticated user's organization.
 * Calls the /api/app-transactions endpoint.
 * @param token Clerk's session token.
 * @returns A list of confirmed transactions.
 */
export const fetchConfirmedTransactions = async (
  token: string
): Promise<ConfirmedTransaction[]> => {
  const url = `${BACKEND_URL}/api/app-transactions`;

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
          console.warn(`Transactions list not found for URL: ${url}`);
          return []; // No transactions found is not an error, just an empty list
       }
       if (response.status === 401) {
           console.error("Authentication failed for transactions list:", response.statusText);
            throw new Error("Authentication failed. Please log in again.");
       }
      console.error(`Error fetching confirmed transactions list from ${url}:`, response.status, response.statusText);
       // Attempt to read the response body for more context on the error
       const errorBody = await response.text().catch(() => "Could not read error body");
       console.error("Error response body:", errorBody);
      throw new Error(`Error fetching confirmed transactions list: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched data from ${url}:`, data);

    // Based on your API code for /api/app-transactions, it returns { success: true, transactions: [...] }
    if (data && data.success && Array.isArray(data.transactions)) {
       // Map and normalize the array of transactions
       return data.transactions.map((txn: any) => ({
         _id: txn._id,
         invoiceId: txn.invoiceId,
         merchantAddress: txn.merchantAddress,
         staffId: txn.staffId,
         userId: txn.userId,
         qrCodeId: txn.qrCodeId,
         amount: txn.amount,
         convertedAmount: txn.convertedAmount,
         statusReadable: txn.statusReadable,
         fromAddress: txn.fromAddress,
         transactionHash: txn.transactionHash,
         tokenAddress: txn.tokenAddress,
         tokenAmount: txn.tokenAmount,
         tokenSymbol: txn.tokenSymbol,
         orgId: txn.orgId,
         createdAt: txn.createdAt,
         updatedAt: txn.updatedAt,
         txFee: txn.txFee,
       }));
    } else if (data && data.success && !Array.isArray(data.transactions)) {
        // API returned success: true but no transactions array
        console.warn("API returned success: true but 'transactions' is not an array or is missing:", data);
        return []; // Treat as empty list
    } else if (data && !data.success) {
        // API returned success: false
        console.log("API reported success: false when fetching list:", data);
        return []; // Treat as empty list
    }


    // If the structure is completely unexpected
    console.warn("API returned unexpected data structure for list:", data);
    return []; // Return empty array for safety

  } catch (error: any) {
    console.error(`Fetch confirmed transactions list error from ${url}:`, error);
    throw error; // Re-throw the error for TanStack Query to catch
  }
};


/**
 * Fetch a single confirmed transaction by invoice ID.
 * Calls the /api/app-transactions/[id] endpoint.
 * @param id The invoice ID of the transaction.
 * @param token Clerk's session token.
 * @returns The confirmed transaction, or null if not found.
 */
export const fetchConfirmedTransactionById = async (
  id: string,
  token: string
): Promise<ConfirmedTransaction | null> => {
  const url = `${BACKEND_URL}/api/app-transactions/${id}`; // Use the new endpoint with ID

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
          console.warn(`Transaction with invoice ID ${id} not found.`);
          return null; // Transaction not found
       }
        if (response.status === 401) {
            console.error(`Authentication failed for transaction ID ${id}:`, response.statusText);
            throw new Error("Authentication failed. Please log in again.");
        }
      console.error(`Error fetching confirmed transaction by ID ${id} from ${url}:`, response.status, response.statusText);
      const errorBody = await response.text().catch(() => "Could not read error body");
      console.error("Error response body:", errorBody);
      throw new Error(`Error fetching confirmed transaction by ID: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched single confirmed transaction for ID ${id}:`, data);

    // Based on your API code for /api/app-transactions/[id], it returns { success: true, transaction: {...} }
    if (data && data.success && data.transaction) {
      const txn = data.transaction;
      // Normalize the data structure to match your ConfirmedTransaction interface
      return {
        _id: txn._id, // Ensure _id is included if present
        invoiceId: txn.invoiceId,
        merchantAddress: txn.merchantAddress,
        staffId: txn.staffId,
        userId: txn.userId,
        qrCodeId: txn.qrCodeId,
        amount: txn.amount,
        convertedAmount: txn.convertedAmount,
        statusReadable: txn.statusReadable,
        fromAddress: txn.fromAddress,
        transactionHash: txn.transactionHash,
        tokenAddress: txn.tokenAddress,
        tokenAmount: txn.tokenAmount,
        tokenSymbol: txn.tokenSymbol,
        orgId: txn.orgId,
        createdAt: txn.createdAt,
        updatedAt: txn.updatedAt,
        txFee: txn.txFee,
      };
    } else if (data && !data.success) {
        // API returned success: false
        console.log(`API reported success: false for ID ${id}:`, data);
        return null; // Not found
    }


    // If the structure is completely unexpected
    console.warn(`API returned unexpected data structure for ID ${id}:`, data);
    return null; // Not found

  } catch (error: any) {
    console.error(`Fetch confirmed transaction by ID error from ${url}:`, error);
    throw error;
  }
};
