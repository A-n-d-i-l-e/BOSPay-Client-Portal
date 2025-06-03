
import { BACKEND_URL } from "@/data/transactions";

export interface InvoiceRecord {
  _id: string;
  orgId: string;
  invoiceId: string;
  storeId: string;
  amount: number;
  bosPayFee: number;
  netAmount: number;
  currency: string;
  convertedAmount: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  staffId: string;
  qrCodeId: string;
}

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
        console.warn(`No invoice records found for orgId ${orgId} at ${url}`);
        return [];
      }
      if (response.status === 401 || response.status === 403) {
        console.error(`Authentication or authorization failed for ${url}`);
        throw new Error("Authentication or authorization failed. Please log in again.");
      }
      const errorBody = await response.text().catch(() => "Unknown error");
      console.error(`Error fetching invoice records from ${url}: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch invoice records: ${errorBody}`);
    }

    const data = await response.json();
    console.log(`Fetched invoice records from ${url}:`, data);

    if (Array.isArray(data.transactions)) {
      return data.transactions.map((record: any) => ({
        _id: String(record._id),
        orgId: String(record.orgId),
        invoiceId: String(record.invoiceId),
        storeId: String(record.storeId),
        amount: Number(record.amount),
        bosPayFee: Number(record.bosPayFee),
        netAmount: Number(record.netAmount),
        currency: String(record.currency),
        convertedAmount: record.convertedAmount ? String(record.convertedAmount) : null,
        status: String(record.status),
        createdAt: String(record.createdAt),
        updatedAt: String(record.updatedAt),
        userId: String(record.userId),
        staffId: String(record.staffId),
        qrCodeId: String(record.qrCodeId),
      }));
    }
    console.warn(`Unexpected response structure from ${url}:`, data);
    return [];
  } catch (error) {
    console.error(`Error fetching invoice records from ${url}:`, error);
    throw error instanceof Error ? error : new Error("Failed to fetch invoice records");
  }
};

export const fetchInvoiceRecordById = async (
  id: string,
  token: string
): Promise<InvoiceRecord | null> => {
  const url = `${BACKEND_URL}/api/btc-invoice?invoiceId=${id}`; // Adjusted to query by invoiceId

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
        console.warn(`Invoice record ${id} not found at ${url}`);
        return null;
      }
      if (response.status === 401 || response.status === 403) {
        console.error(`Authentication or authorization failed for ${url}`);
        throw new Error("Authentication or authorization failed. Please log in again.");
      }
      const errorBody = await response.text().catch(() => "Unknown error");
      console.error(`Error fetching invoice record ${id} from ${url}: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch invoice record: ${errorBody}`);
    }

    const data = await response.json();
    console.log(`Fetched invoice record ${id} from ${url}:`, data);

    if (data?.transaction) {
      const record = data.transaction;
      return {
        _id: String(record._id),
        orgId: String(record.orgId),
        invoiceId: String(record.invoiceId),
        storeId: String(record.storeId),
        amount: Number(record.amount),
        bosPayFee: Number(record.bosPayFee),
        netAmount: Number(record.netAmount),
        currency: String(record.currency),
        convertedAmount: record.convertedAmount ? String(record.convertedAmount) : null,
        status: String(record.status),
        createdAt: String(record.createdAt),
        updatedAt: String(record.updatedAt),
        userId: String(record.userId),
        staffId: String(record.staffId),
        qrCodeId: String(record.qrCodeId),
      };
    }
    console.warn(`Unexpected response structure for ${id} from ${url}:`, data);
    return null;
  } catch (error) {
    console.error(`Error fetching invoice record ${id} from ${url}:`, error);
    throw error instanceof Error ? error : new Error("Failed to fetch invoice record");
  }
};
