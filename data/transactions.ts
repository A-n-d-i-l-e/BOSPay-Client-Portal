
export const BACKEND_URL = "https://my-next-backend-two.vercel.app";

export interface ConfirmedTransaction {
  _id?: string;
  invoiceId: string;
  merchantAddress: string;
  staffId: string;
  userId: string;
  qrCodeId: string;
  amount: string;
  convertedAmount: string;
  statusReadable: string;
  fromAddress: string;
  transactionHash: string;
  tokenAddress?: string;
  tokenAmount?: string;
  tokenSymbol?: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  txFee?: string;
}

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
        console.warn(`No transactions found at ${url}`);
        return [];
      }
      if (response.status === 401) {
        console.error(`Authentication failed for ${url}`);
        throw new Error("Authentication failed. Please log in again.");
      }
      const errorBody = await response.text().catch(() => "Unknown error");
      console.error(`Error fetching transactions from ${url}: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch transactions: ${errorBody}`);
    }

    const data = await response.json();
    console.log(`Fetched transactions from ${url}:`, data);

    if (data?.success && Array.isArray(data.transactions)) {
      return data.transactions.map((txn: any) => ({
        _id: txn._id?.toString(),
        invoiceId: String(txn.invoiceId),
        merchantAddress: String(txn.merchantAddress),
        staffId: String(txn.staffId),
        userId: String(txn.userId),
        qrCodeId: String(txn.qrCodeId),
        amount: String(txn.amount),
        convertedAmount: String(txn.convertedAmount),
        statusReadable: String(txn.statusReadable),
        fromAddress: String(txn.fromAddress),
        transactionHash: String(txn.transactionHash),
        tokenAddress: txn.tokenAddress ? String(txn.tokenAddress) : undefined,
        tokenAmount: txn.tokenAmount ? String(txn.tokenAmount) : undefined,
        tokenSymbol: txn.tokenSymbol ? String(txn.tokenSymbol) : undefined,
        orgId: String(txn.orgId),
        createdAt: String(txn.createdAt),
        updatedAt: String(txn.updatedAt),
        txFee: txn.txFee ? String(txn.txFee) : undefined,
      }));
    }
    if (data?.success && !data.transactions) {
      console.warn(`No transactions returned from ${url}`);
      return [];
    }
    console.warn(`Unexpected response structure from ${url}:`, data);
    return [];
  } catch (error) {
    console.error(`Error fetching transactions from ${url}:`, error);
    throw error instanceof Error ? error : new Error("Failed to fetch transactions");
  }
};

export const fetchConfirmedTransactionById = async (
  id: string,
  token: string
): Promise<ConfirmedTransaction | null> => {
  const url = `${BACKEND_URL}/api/app-transactions/${id}`;

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
        console.warn(`Transaction ${id} not found at ${url}`);
        return null;
      }
      if (response.status === 401) {
        console.error(`Authentication failed for ${url}`);
        throw new Error("Authentication failed. Please log in again.");
      }
      const errorBody = await response.text().catch(() => "Unknown error");
      console.error(`Error fetching transaction ${id} from ${url}: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch transaction: ${errorBody}`);
    }

    const data = await response.json();
    console.log(`Fetched transaction ${id} from ${url}:`, data);

    if (data?.success && data.transaction) {
      const txn = data.transaction;
      return {
        _id: txn._id?.toString(),
        invoiceId: String(txn.invoiceId),
        merchantAddress: String(txn.merchantAddress),
        staffId: String(txn.staffId),
        userId: String(txn.userId),
        qrCodeId: String(txn.qrCodeId),
        amount: String(txn.amount),
        convertedAmount: String(txn.convertedAmount),
        statusReadable: String(txn.statusReadable),
        fromAddress: String(txn.fromAddress),
        transactionHash: String(txn.transactionHash),
        tokenAddress: txn.tokenAddress ? String(txn.tokenAddress) : undefined,
        tokenAmount: txn.tokenAmount ? String(txn.tokenAmount) : undefined,
        tokenSymbol: txn.tokenSymbol ? String(txn.tokenSymbol) : undefined,
        orgId: String(txn.orgId),
        createdAt: String(txn.createdAt),
        updatedAt: String(txn.updatedAt),
        txFee: txn.txFee ? String(txn.txFee) : undefined,
      };
    }
    if (data?.success && !data.transaction) {
      console.warn(`Transaction ${id} not found in response from ${url}`);
      return null;
    }
    console.warn(`Unexpected response structure for ${id} from ${url}:`, data);
    return null;
  } catch (error) {
    console.error(`Error fetching transaction ${id} from ${url}:`, error);
    throw error instanceof Error ? error : new Error("Failed to fetch transaction");
  }
};
