"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import { fetchConfirmedTransactions, ConfirmedTransaction } from "@/data/transactions";
import { fetchInvoiceRecords, InvoiceRecord } from "@/data/invoiceRecords";
import { fetchUserOrganizationId } from "@/data/org";

// Interface for chart data
interface ChartData {
  date: string; // e.g., "Jun 01"
  thisMonth: number; // ZAR amount for current month
  lastMonth: number; // ZAR amount for previous month
}

const SalesChart: React.FC = () => {
  const { getToken } = useAuth();
  const [filter, setFilter] = useState("7 days");
  const [showDummyDataInfo, setShowDummyDataInfo] = useState(true);

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
    const confirmedTxns = transactions.filter(
      (txn) => txn.statusReadable.toLowerCase() === "confirmed"
    );
    const paidInvoices = invoices.filter(
      (inv) => inv.status.toLowerCase() === "paid"
    );

    // Aggregate by day
    const dataMap = new Map<string, { thisMonth: number; lastMonth: number }>();

    // Process confirmed transactions
    confirmedTxns.forEach((txn) => {
      const date = new Date(txn.createdAt);
      if (isNaN(date.getTime())) return; // Skip invalid dates
      const txnMonth = date.getMonth();
      const txnYear = date.getFullYear();
      const dayKey = date.toLocaleString("en-US", { month: "short", day: "2-digit" }); // e.g., "Jun 01"
      const amount = parseFloat(txn.convertedAmount) || 0;

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
      const amount = parseFloat(inv.convertedAmount || "0") || 0;

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
    const chartData = Array.from(dataMap.entries()).map(([date, value]) => ({
      date,
      thisMonth: value.thisMonth,
      lastMonth: value.lastMonth,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Apply filter (7, 14, or 30 days)
    const days = parseInt(filter.split(" ")[0]);
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - days);
    return chartData.filter(
      (d) => new Date(d.date).getTime() >= cutoffDate.getTime()
    );
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
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-white font-semibold">{label}</p>
          {payload.map((item, index) => (
            <p key={index} className="text-sm text-white">
              {item.name}: R{item.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number): string => `R${value}`;

  return (
    <Card className="w-full bg-gradient-to-br from-[#171F2E] to-[#071D49] text-white relative">
      <CardContent className="p-4">
        <div className="flex flex-row items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Sales</h3>
          <div className="flex items-center gap-4">
            <Select
              defaultValue="7 days"
              onValueChange={(value) => setFilter(value)}
            >
              <SelectTrigger
                className="text-sm text-gray-200 bg-transparent border-gray-600 rounded-sm p-2"
              >
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7 days">Last 7 days</SelectItem>
                <SelectItem value="14 days">Last 14 days</SelectItem>
                <SelectItem value="30 days">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Info className="text-gray-400" size={20} />
          </div>
        </div>

        <div className="relative h-[300px] sm:h-[400px]">
          {isLoadingOrgId || isLoadingTxns || isLoadingInvoices ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-lg">Loading sales data...</p>
            </div>
          ) : data.length === 0 && !showDummyDataInfo ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-lg">No sales data available.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorThisMonth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#003DA5" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#05C3DE" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="colorLastMonth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A3E0" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#05C3DE" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  padding={{ left: 10, right: 10 }}
                  tick={{ fill: "#ffffff", fontSize: 14 }}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  axisLine={false}
                  tickLine={false}
                  padding={{ top: 10, bottom: 10 }}
                  tick={{ fill: "#ffffff", fontSize: 14 }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "#2E2E2E", opacity: 0.5 }}
                />
                <Legend
                  wrapperStyle={{
                    color: "#ffffff",
                    fontSize: "14px",
                  }}
                  iconType="square"
                />
                <Bar
                  dataKey="thisMonth"
                  fill="url(#colorThisMonth)"
                  name="This Month"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="lastMonth"
                  fill="url(#colorLastMonth)"
                  name="Last Month"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {showDummyDataInfo && (
          <div className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-40 text-white p-4 rounded-lg shadow-md z-10">
            <p className="text-sm">
              You are currently viewing a demo of the sales report. This chart displays real transaction data when available.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => setShowDummyDataInfo(false)}
            >
              Close Demo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesChart;
