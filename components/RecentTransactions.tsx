"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bitcoin, Plus, CheckCircle2, Clock, XCircle, AlertCircle, HandCoins } from "lucide-react";
import Link from "next/link";
import { fetchConfirmedTransactions, type ConfirmedTransaction } from "@/data/transactions";
import { fetchInvoiceRecords, type InvoiceRecord } from "@/data/invoiceRecords";
import { fetchUserOrganizationId } from "@/data/org";
import { Badge } from "@/components/ui/badge";

// Define CombinedTransaction type
type CombinedTransaction = (ConfirmedTransaction | InvoiceRecord) & { type: "confirmed" | "invoice" };

// Type guards
function isConfirmedTransaction(txn: CombinedTransaction): txn is ConfirmedTransaction & { type: "confirmed" } {
  return txn.type === "confirmed";
}

function isInvoiceRecord(txn: CombinedTransaction): txn is InvoiceRecord & { type: "invoice" } {
  return txn.type === "invoice";
}

// StatusBadge component (from CryptoTransactionHistoryPage)
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
  const { getToken } = useAuth();

  // Fetch organization ID
  const { data: orgId, isLoading: isLoadingOrgId } = useQuery<string | null>({
    queryKey: ["userOrgId"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not available");
      return fetchUserOrganizationId(token);
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Fetch confirmed transactions
  const { data: confirmedTransactions = [], isLoading: isLoadingTxns } = useQuery<ConfirmedTransaction[]>({
    queryKey: ["confirmedTransactions", "recent"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not available");
      return fetchConfirmedTransactions(token);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch invoice records
  const { data: invoiceRecords = [], isLoading: isLoadingInvoices } = useQuery<InvoiceRecord[]>({
    queryKey: ["invoiceRecords", orgId, "recent"],
    queryFn: async () => {
      if (!orgId) return [];
      const token = await getToken();
      if (!token) throw new Error("Authentication token not available");
      return fetchInvoiceRecords(token, orgId);
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Combine and select top 5 transactions
  const transactions = useMemo<CombinedTransaction[]>(() => {
    const confirmed = confirmedTransactions
      .filter((txn) => txn.statusReadable.toLowerCase() === "confirmed")
      .map((txn) => ({ ...txn, type: "confirmed" as const }));
    const invoices = invoiceRecords
      .filter((inv) => inv.status.toLowerCase() === "paid")
      .map((inv) => ({ ...inv, type: "invoice" as const }));

    return [...confirmed, ...invoices]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [confirmedTransactions, invoiceRecords]);

  const isLoading = isLoadingOrgId || isLoadingTxns || isLoadingInvoices;

  return (
    <Card className="bg-gradient-to-br from-[#171F2E] to-[#071D49] text-white border-0 shadow-lg h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#a45ee5]/20 rounded-lg">
            <HandCoins className="text-[#a45ee5]" size={20} />
          </div>
          <CardTitle className="text-lg sm:text-xl font-bold">Recent Sales</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-white text-lg font-medium">Loading transactions...</p>
            </div>
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-[#1A2333] text-white">
                <tr>
                  <th className="py-2 px-2 sm:px-4">Payment</th>
                  <th className="py-2 px-2 sm:px-4">Amount</th>
                  <th className="py-2 px-2 sm:px-4">Status</th>
                  <th className="py-2 px-2 sm:px-4">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn, index) => {
                  const currency = isConfirmedTransaction(txn) ? txn.tokenSymbol : (isInvoiceRecord(txn) ? txn.currency : "Unknown");
                  const amount = txn.convertedAmount ? `R${Number.parseFloat(txn.convertedAmount).toFixed(2)}` : "N/A";
                  const status = isConfirmedTransaction(txn) ? txn.statusReadable : (isInvoiceRecord(txn) ? txn.status : "Unknown");
                  const dateTime = new Date(txn.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });
                  return (
                    <tr key={index} className="border-t border-gray-700">
                      <td className="py-2 px-2 sm:px-4 text-emerald-400">{currency}</td>
                      <td className="py-2 px-2 sm:px-4">{amount}</td>
                      <td className="py-2 px-2 sm:px-4">
                        <StatusBadge status={status} />
                      </td>
                      <td className="py-2 px-2 sm:px-4">{dateTime}</td>
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
