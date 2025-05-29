// types/transaction.ts
export interface ConfirmedTransaction {
    _id: string; // MongoDB's default ID
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
  