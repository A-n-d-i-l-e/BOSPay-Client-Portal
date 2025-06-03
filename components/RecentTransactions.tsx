
"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bitcoin, Plus, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Define CombinedTransaction type
type CombinedTransaction = {
  invoiceId: string;
  createdAt: string;
  tokenSymbol?: string; // For ConfirmedTransaction
  currency?: string; // For InvoiceRecord
  convertedAmount: string;
  statusReadable?: string; // For ConfirmedTransaction
  status?: string; // For InvoiceRecord
  type: "confirmed" | "invoice";
  transactionHash?: string; // For ConfirmedTransaction
  tokenAmount?: string; // For ConfirmedTransaction
  amount?: string; // For InvoiceRecord
};

// Type guards
function isConfirmedTransaction(txn: CombinedTransaction): txn is CombinedTransaction & { type: "confirmed" } {
  return txn.type === "confirmed";
}

function isInvoiceRecord(txn: CombinedTransaction): txn is CombinedTransaction & { type: "invoice" } {
  return txn.type === "invoice";
}

// Dummy data
const dummyTransactions: CombinedTransaction[] = [
  {
    invoiceId: "tx_001",
    createdAt: "2025-06-03T10:00:00Z",
    tokenSymbol: "BTC",
    convertedAmount: "121.00",
    statusReadable: "Confirmed",
    type: "confirmed",
    transactionHash: "0x1234567890abcdef",
    tokenAmount: "0.002",
  },
  {
    invoiceId: "inv_001",
    createdAt: "2025-06-02T15:30:00Z",
    currency: "USDT",
    convertedAmount: "590.00",
    status: "Paid",
    type: "invoice",
    amount: "590.00",
  },
  {
    invoiceId: "tx_002",
    createdAt: "2025-06-01T09:45:00Z",
    tokenSymbol: "ETH",
    convertedAmount: "300.00",
    statusReadable: "Confirmed",
    type: "confirmed",
    transactionHash: "0xabcdef1234567890",
    tokenAmount: "0.1",
  },
  {
    invoiceId: "inv_002",
    createdAt: "2025-05-31T12:00:00Z",
    currency: "DAI",
    convertedAmount: "200.00",
    status: "Paid",
    type: "invoice",
    amount: "200.00",
  },
  {
    invoiceId: "tx_003",
    createdAt: "2025-05-30T18:20:00Z",
    tokenSymbol: "USDC",
    convertedAmount: "450.00",
    statusReadable: "Confirmed",
    type: "confirmed",
    transactionHash: "0x7890abcdef123456",
    tokenAmount: "450",
  },
];

// StatusBadge component
function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "confirmed" || lowerStatus === "paid") {
      return { color: "bg-green-500", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> };
    } else if (lowerStatus === "failed" || lowerStatus === "expired") {
      return { color: "bg-red-500", icon: <XCircle className="h-3 w-3 mr-1" /> };
    } else if (lowerStatus === "pending") {
      return { color: "bg-amber-500", icon: <Clock className="h-3 w-3 mr-1" /> };
    } else {
      return { color: "bg-gray-500", icon: <AlertCircle className="h-3 w-3 mr-1" /> };
    }
  };

  const { color, icon } = getStatusConfig(status);
  return (
    <Badge className={`text-white flex items-center ${color}`}>
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

const RecentTransactions: React.FC = () => {
  // Use dummy data (already sorted by createdAt)
  const transactions = dummyTransactions;

  return (
    <Card className="bg-gradient-to-br from-[#171F2E] to-[#071D49] text-white border-0 shadow-lg h-full">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl font-bold">Recent Sales</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-[#1A2333] text-white">
                <tr>
                  <th className="py-2 px-2 sm:px-4">Payment</th>
                  <th className="py-2 px-2 sm:px-4">Amount</th>
                  <th className="py-2 px-2 sm:px-4">Status</th>
                  <th className="py-2 px-2 sm:px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn, index) => {
                  const currency = isConfirmedTransaction(txn) ? txn.tokenSymbol : txn.currency ?? "Unknown";
                  const amount = `R${Number.parseFloat(txn.convertedAmount).toFixed(2)}`;
                  const status = isConfirmedTransaction(txn) ? txn.statusReadable : txn.status;
                  const date = new Date(txn.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  });
                  return (
                    <tr key={index} className="border-t border-gray-700">
                      <td className="py-2 px-2 sm:px-4 text-emerald-400">{currency}</td>
                      <td className="py-2 px-2 sm:px-4">{amount}</td>
                      <td className="py-2 px-2 sm:px-4">
                        <StatusBadge status={status!} />
                      </td>
                      <td className="py-2 px-2 sm:px-4">{date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center max-w-md mx-auto py-8">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bitcoin className="text-emerald-400" size={40} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <Plus className="text-white" size={16} />
              </div>
            </div>

            <h4 className="text-2xl font-bold text-white mb-3">Ready to track your transactions?</h4>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Your sales dashboard is waiting for data. Create your first invoice to start tracking transactions.
            </p>

            <div className="space-y-3">
              <Button
                asChild
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Link href="/dashboard/invoices/new" className="flex items-center gap-2">
                  <Plus size={18} />
                  Create Your First Invoice
                </Link>
              </Button>

              <p className="text-sm text-gray-400">Or wait for transactions to appear here</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
