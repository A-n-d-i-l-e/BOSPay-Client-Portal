// data/invoiceRecords.ts

import { BACKEND_URL } from "@/data/transactions"; // Assuming BACKEND_URL is defined here

// Define a type for the Invoice Record data based on your API response
// ADD userId, staffId, and qrCodeId here based on your API/Schema
export interface InvoiceRecord {
  _id: string; // MongoDB's default ID
  orgId: string;
  invoiceId: string; // BTCPay Server Invoice ID
  storeId: string;
  amount: number; // BTC amount (number)
  bosPayFee: number; // BTC amount (number)
  netAmount: number; // BTC amount (number)
  currency: string; // e.g., "BTC"
  convertedAmount: string | null; // Stored as string or null
  status: string; // e.g., "pending", "paid", "expired"
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
  // ADD THESE PROPERTIES:
  userId: string;
  staffId: string;
  qrCodeId: string;
  // Add other fields from your InvoiceRecord schema if needed for the UI
}

/**
 * Fetch a list of Invoice Records for a given organization ID.
 * Calls the /api/btc-invoice endpoint with GET method.
 * @param token Clerk's session token.
 * @param orgId The organization ID to filter by.
 * @param limit Optional. Number of records to fetch.
 * @param skip Optional. Number of records to skip.
 * @returns A list of Invoice Records.
 */
export const fetchInvoiceRecords = async (
  token: string,
  orgId: string,
  limit: number = 50,
  skip: number = 0
): Promise<InvoiceRecord[]> => {
  const url = `${BACKEND_URL}/api/btc-invoice?orgId=${orgId}&limit=${limit}&skip=${skip}`;

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
          console.warn(`Invoice Records not found for orgId ${orgId} from URL: ${url}`);
          return [];
       }
        if (response.status === 401 || response.status === 403) {
            console.error(`Authentication or Authorization failed for invoice records list (orgId: ${orgId}):`, response.status, response.statusText);
            throw new Error("Authentication or Authorization failed. Please log in again.");
       }
      console.error(`Error fetching invoice records list from ${url}:`, response.status, response.statusText);
       const errorBody = await response.text().catch(() => "Could not read error body");
       console.error("Error response body:", errorBody);
      throw new Error(`Error fetching invoice records list: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched invoice records data from ${url}:`, data);

    // Based on your API code for /api/btc-invoice GET, it returns { transactions: [...] }
    if (data && Array.isArray(data.transactions)) {
       return data.transactions.map((record: any) => ({
         _id: record._id,
         orgId: record.orgId,
         invoiceId: record.invoiceId,
         storeId: record.storeId,
         amount: record.amount,
         bosPayFee: record.bosPayFee,
         netAmount: record.netAmount,
         currency: record.currency,
         convertedAmount: record.convertedAmount,
         status: record.status,
         createdAt: record.createdAt,
         updatedAt: record.updatedAt,
          // Map these fields from the API response
         userId: record.userId,
         staffId: record.staffId,
         qrCodeId: record.qrCodeId,
       }));
    } else if (data && !Array.isArray(data.transactions)) {
        console.warn("API returned data, but 'transactions' is not an array:", data);
        return [];
    }


    console.warn("API returned unexpected data structure for invoice records list:", data);
    return [];

  } catch (error: any) {
    console.error(`Fetch invoice records list error from ${url}:`, error);
    throw error;
  }
};

/**
 * Fetch a single Invoice Record by invoice ID.
 * Calls the /api/btc-invoice endpoint (but your current API doesn't support single fetch by ID).
 * ********** IMPORTANT **********
 * Your current /api/btc-invoice endpoint only supports fetching a LIST with orgId, limit, skip.
 * It does NOT support fetching a single Invoice Record by invoiceId directly.
 * To implement this, you NEED to add functionality to your /api/btc-invoice endpoint
 * (or create a new one like /api/invoice-records/[id]) to handle fetching a single InvoiceRecord
 * by its invoiceId, scoped by the user's organization.
 * *******************************
 * I am assuming the API will be updated or you have a separate endpoint.
 */
export const fetchInvoiceRecordById = async ( // <-- Add 'export' here
  id: string,
  token: string
): Promise<InvoiceRecord | null> => {
  // ********** THIS PART NEEDS TO MATCH YOUR ACTUAL API FOR SINGLE FETCH **********
  // Assuming a structure like /api/invoice-records/[id]
  const url = `${BACKEND_URL}/api/invoice-records/${id}`; // Example if you create a new endpoint

  // OR if you modify /api/btc-invoice to handle single fetch by invoiceId query param
  // const url = `${BACKEND_URL}/api/btc-invoice?invoiceId=${id}`;
  // **************************************************************************


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
          console.warn(`Invoice Record with ID ${id} not found.`);
          return null;
       }
        if (response.status === 401 || response.status === 403) {
             console.error(`Authentication or Authorization failed for invoice record ID ${id}:`, response.status, response.statusText);
             throw new Error("Authentication or Authorization failed. Please log in again.");
         }
      console.error(`Error fetching invoice record by ID ${id} from ${url}:`, response.status, response.statusText);
       const errorBody = await response.text().catch(() => "Could not read error body");
       console.error("Error response body:", errorBody);
      throw new Error(`Error fetching invoice record by ID: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched single invoice record for ID ${id}:`, data);

     // ********** THIS PART NEEDS TO MATCH YOUR ACTUAL API RESPONSE STRUCTURE **********
     // Assuming it returns { success: true, invoiceRecord: {...} } or similar
    if (data && data.success && data.invoiceRecord) { // Assuming a key like 'invoiceRecord'
        const record = data.invoiceRecord;
       // Normalize the data structure - ensure these fields exist in the API response
       return {
           _id: record._id,
           orgId: record.orgId,
           invoiceId: record.invoiceId,
           storeId: record.storeId,
           amount: record.amount,
           bosPayFee: record.bosPayFee,
           netAmount: record.netAmount,
           currency: record.currency,
           convertedAmount: record.convertedAmount,
           status: record.status,
           createdAt: record.createdAt,
           updatedAt: record.updatedAt,
            // Map these fields from the API response
           userId: record.userId,
           staffId: record.staffId,
           qrCodeId: record.qrCodeId,
       };
    } else if (data && !data.success) {
         console.log(`API reported success: false for ID ${id}:`, data);
         return null;
     }

    console.warn(`API returned unexpected data structure for single invoice record ID ${id}:`, data);
    return null;

  } catch (error: any) {
    console.error(`Fetch invoice record by ID error from ${url}:`, error);
    throw error;
  }
};
