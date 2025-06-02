"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession, useUser } from "@clerk/nextjs";
import { fetchBalance } from "@/data/balance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Activity, CreditCard } from "lucide-react";
import SalesChart from "@/components/SalesChart";
import ProductPieChart from "@/components/ProductPieChart";
import BestProduct from "@/components/BestProduct";
import StockAlert from "@/components/StockAlert";
import { LoadingSpinner } from "@/components/ui/loader";

interface Sale {
  product: string;
  customer: string;
  price: number;
  payment: string;
}

export default function DashboardPage() {
  const { user } = useUser();
  const { session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  // Fetch balance
  const { data: balanceData, isLoading: isBalanceLoading, error: balanceError } = useQuery({
    queryKey: ["balance"],
    queryFn: async () => {
      if (!session) throw new Error("No session found");
      const token = await session.getToken();
      if (!token) throw new Error("Token is null");
      console.log("Fetching balance with token:", token);
      return fetchBalance(token);
    },
    enabled: !!session,
  });

  // Calculate percentage change
  const percentageChange =
    balanceData && balanceData.previousBalance !== 0
      ? (((balanceData.balance - balanceData.previousBalance) / balanceData.previousBalance) * 100).toFixed(1)
      : "0";

  const recentSales: Sale[] = [];

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 font-poppins px-2 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
            Hi, {user?.firstName || "there"}
          </h2>
          <p className="text-sm sm:text-base text-white">
            Let&apos;s check your store today.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search..."
            className="h-10 w-full sm:w-64 lg:w-72 rounded-lg border border-gray-300 px-4 text-sm shadow-sm focus:border-pacific-blue focus:ring focus:ring-light-blue-gradient"
          />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-tr from-cobalt to-pacific-blue p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">
              Total Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-dark-turquoise" />
          </CardHeader>
          <CardContent>
            {isBalanceLoading ? (
              <LoadingSpinner className="text-dark-turquoise w-6 h-6" />
            ) : balanceError ? (
              <div className="text-xs text-red-300">
                {balanceError instanceof Error ? balanceError.message : "Error loading balance"}
              </div>
            ) : (
              <>
                <div className="text-base sm:text-lg lg:text-2xl font-bold text-white">
                  R{balanceData?.balance.toFixed(2) || "0.00"}
                </div>
                <p className="text-xs text-dark-turquoise">{percentageChange}% from last month</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-tr from-sapphire to-dark-turquoise p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">
              Total Sales
            </CardTitle>
            <CreditCard className="h-4 w-4 text-light-blue-gradient" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-lg lg:text-2xl font-bold text-white">0</div>
            <p className="text-xs text-dark-turquoise">0% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-tr from-pacific-blue to-dark-turquoise p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">
              Total Purchases
            </CardTitle>
            <Users className="h-4 w-4 text-dark-blue-gradient" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-lg lg:text-2xl font-bold text-white">0</div>
            <p className="text-xs text-dark-turquoise">0% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-tr from-medium-purple to-sapphire p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">
              Total Returns
            </CardTitle>
            <Activity className="h-4 w-4 text-light-blue-gradient" />
          </CardHeader>
          <CardContent>
            <div className="text-base sm:text-lg lg:text-2xl font-bold text-white">R0</div>
            <p className="text-xs text-dark-turquoise">0% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart and Stock Alert */}
      <div className="grid gap-4 lg:grid-cols-3 lg:col-span-2">
        <div className="grid gap-4 lg:col-span-2">
          <SalesChart />
        </div>
        <StockAlert />
      </div>

      {/* Product Pie Chart and Best Product */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2">
          <ProductPieChart />
        </div>
        <div className="md:col-span-2 lg:col-span-1">
          <BestProduct />
        </div>
      </div>

      {/* Recent Sales Table */}
      <Card className="border border-midnight-express">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-white">
            Recent Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-white text-sapphire">
                  <tr>
                    <th className="py-2 px-2 sm:px-4">Product</th>
                    <th className="py-2 px-2 sm:px-4">Customer</th>
                    <th className="py-2 px-2 sm:px-4">Price</th>
                    <th className="py-2 px-2 sm:px-4">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-2 px-2 sm:px-4">{sale.product}</td>
                      <td className="py-2 px-2 sm:px-4">{sale.customer}</td>
                      <td className="py-2 px-2 sm:px-4">R{sale.price}</td>
                      <td className="py-2 px-2 sm:px-4 text-dark-turquoise">{sale.payment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-white text-center py-4">No recent transactions</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
