
"use client";

import type React from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, TrendingUp, Plus } from "lucide-react";
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";
import { fetchConfirmedTransactions, type ConfirmedTransaction } from "@/data/transactions";
import { fetchInvoiceRecords, type InvoiceRecord } from "@/data/invoiceRecords";
import { fetchUserOrganizationId } from "@/data/org";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

// Interface for chart data
interface ChartData {
  date: string; // e.g., "Jun 01"
  thisMonth: number; // ZAR amount for current month
  lastMonth: number; // ZAR amount for previous month
}

const SalesChart: React.FC = () => {
  const { getToken } = useAuth();
  const [filter, setFilter] = useState("7 days");

  // Fetch organization ID (needed for Invoice Records)
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
  const { data: transactions = [], isLoading: isLoadingTxns } = useQuery<ConfirmedTransaction[]>({
    queryKey: ["confirmedTransactions", "salesChart"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not available");
      return fetchConfirmedTransactions(token);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch invoice records
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery<InvoiceRecord[]>({
    queryKey: ["invoiceRecords", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const token = await getToken();
      if (!token) throw new Error("Authentication token not available");
      return fetchInvoiceRecords(token, orgId);
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Process transactions and invoices into chart data
  const getChartData = (): ChartData[] => {
    if (!transactions.length && !invoices.length) return [];

    // Get current and previous month
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Filter confirmed transactions and paid invoices
    const confirmedTxns = transactions.filter((txn) => txn.statusReadable.toLowerCase() === "confirmed");
    const paidInvoices = invoices.filter((inv) => inv.status.toLowerCase() === "paid");

    // Aggregate by day
    const dataMap = new Map<string, { thisMonth: number; lastMonth: number }>();

    // Process confirmed transactions
    confirmedTxns.forEach((txn) => {
      const date = new Date(txn.createdAt);
      if (isNaN(date.getTime())) return; // Skip invalid dates
      const txnMonth = date.getMonth();
      const txnYear = date.getFullYear();
      const dayKey = date.toLocaleString("en-US", { month: "short", day: "2-digit" }); // e.g., "Jun 01"
      const amount = Number.parseFloat(txn.convertedAmount) || 0;

      if (txnYear === currentYear && txnMonth === currentMonth) {
        // This month
        const existing = dataMap.get(dayKey) || { thisMonth: 0, lastMonth: 0 };
        dataMap.set(dayKey, { thisMonth: existing.thisMonth + amount, lastMonth: existing.lastMonth });
      } else if (txnYear === prevMonthYear && txnMonth === prevMonth) {
        // Last month
        const existing = dataMap.get(dayKey) || { thisMonth: 0, lastMonth: 0 };
        dataMap.set(dayKey, { thisMonth: existing.thisMonth, lastMonth: existing.lastMonth + amount });
      }
    });

    // Process paid invoices
    paidInvoices.forEach((inv) => {
      const date = new Date(inv.createdAt);
      if (isNaN(date.getTime())) return; // Skip invalid dates
      const invMonth = date.getMonth();
      const invYear = date.getFullYear();
      const dayKey = date.toLocaleString("en-US", { month: "short", day: "2-digit" }); // e.g., "Jun 01"
      const amount = Number.parseFloat(inv.convertedAmount || "0") || 0;

      if (invYear === currentYear && invMonth === currentMonth) {
        // This month
        const existing = dataMap.get(dayKey) || { thisMonth: 0, lastMonth: 0 };
        dataMap.set(dayKey, { thisMonth: existing.thisMonth + amount, lastMonth: existing.lastMonth });
      } else if (invYear === prevMonthYear && invMonth === prevMonth) {
        // Last month
        const existing = dataMap.get(dayKey) || { thisMonth: 0, lastMonth: 0 };
        dataMap.set(dayKey, { thisMonth: existing.thisMonth, lastMonth: existing.lastMonth + amount });
      }
    });

    // Convert to array and sort by date
    const chartData = Array.from(dataMap.entries())
      .map(([date, value]) => ({
        date,
        thisMonth: value.thisMonth,
        lastMonth: value.lastMonth,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Apply filter (7, 14, or 30 days)
    const days = Number.parseInt(filter.split(" ")[0]);
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - days);
    return chartData.filter((d) => new Date(d.date).getTime() >= cutoffDate.getTime());
  };

  const data = isLoadingOrgId || isLoadingTxns || isLoadingInvoices ? [] : getChartData();

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: any[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-600">
          <p className="text-sm font-semibold text-white mb-2">{label}</p>
          {payload.map((item, index) => (
            <p key={index} className="text-sm flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-gray-300">
                {item.name}: <span className="font-semibold">R{item.value.toFixed(2)}</span>
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number): string => `R${value}`;

  return (
    <Card className="w-full bg-gradient-to-br from-[#171F2E] to-[#071D49] border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-row items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#435ee5]/20 rounded-lg">
              <TrendingUp className="text-[#a45ee5]" size={20} />
            </div>
            <h3 className="text-xl font-bold text-white">Sales Overview</h3>
          </div>
          <div className="flex items-center gap-4">
            <Select defaultValue="7 days" onValueChange={(value) => setFilter(value)}>
              <SelectTrigger className="text-sm bg-gray-800/50 border-gray-600 text-white rounded-lg px-3 py-2 min-w-[140px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7 days">Last 7 days</SelectItem>
                <SelectItem value="14 days">Last 14 days</SelectItem>
                <SelectItem value="30 days">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="p-2">
              <Info className="text-gray-400" size={18} />
            </Button>
          </div>
        </div>

        <div className="relative h-[300px] sm:h-[400px]">
          {isLoadingOrgId || isLoadingTxns || isLoadingInvoices ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#435ee5] mx-auto mb-4"></div>
                <p className="text-white text-lg font-medium">Loading sales data...</p>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-[#05C3DE] rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="text-white" size={40} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#05C3DE] rounded-full flex items-center justify-center ring-2 ring-[#05C3DE]/50">
                    <Plus className="text-white" size={16} />
                  </div>
                </div>

                <h4 className="text-2xl font-bold text-white mb-3">Ready to track your first sale?</h4>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Your sales dashboard is waiting for data. Create your first invoice to start tracking revenue and growth.
                </p>

                <div className="space-y-3">
                  <Button
                    asChild
                    className="bg-[#05C3DE] hover:bg-[#05C3DE]/90 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    
                      <Plus size={18} />
                      Create Your First Invoice
                    
                  </Button>

                  <p className="text-sm text-gray-400">Or wait for confirmed transactions to appear here</p>
                </div>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorThisMonth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="colorLastMonth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  padding={{ left: 10, right: 10 }}
                  tick={{ fill: "#ffffff", fontSize: 12, fontWeight: 500 }}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  axisLine={false}
                  tickLine={false}
                  padding={{ top: 10, bottom: 10 }}
                  tick={{ fill: "#ffffff", fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)", radius: 4 }} />
                <Legend
                  wrapperStyle={{
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                  iconType="circle"
                />
                <Bar dataKey="thisMonth" fill="url(#colorThisMonth)" name="This Month" radius={[6, 6, 0, 0]} />
                <Bar dataKey="lastMonth" fill="url(#colorLastMonth)" name="Last Month" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesChart;