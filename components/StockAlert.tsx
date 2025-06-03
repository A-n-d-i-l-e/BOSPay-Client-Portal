"use client";

import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, Product } from "@/data/products";
import { useSession } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search, RefreshCw, AlertTriangle, Package, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

const StockAlert: React.FC = () => {
  const { session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showLowStock, setShowLowStock] = useState(false);

  const { data: products = [], error, isLoading, refetch } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!session) throw new Error("No session found");
      const token = await session.getToken();
      if (!token) throw new Error("Token is null");
      return fetchProducts(token);
    },
    enabled: !!session,
  });

  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((product) => !showLowStock || product.stock <= 20)
      .sort((a, b) =>
        sortOrder === "asc" ? a.stock - b.stock : b.stock - a.stock
      );
  }, [products, searchTerm, sortOrder, showLowStock]);

  const getStockStatus = (stock: number) => {
    if (stock <= 10) return { color: "bg-red-500", text: "Critical", progress: 33 };
    if (stock <= 20) return { color: "bg-yellow-500", text: "Low", progress: 66 };
    return { color: "bg-green-500", text: "Good", progress: 100 };
  };

  const lowStockCount = useMemo(() => {
    return products.filter((product) => product.stock <= 20).length;
  }, [products]);

  return (
    <TooltipProvider>
      <Card className="flex flex-col bg-gradient-to-br from-[#171F2E] to-[#071D49] text-white">
        <CardHeader>
          <h3 className="text-xl font-bold mb-4">Stock Alert</h3>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#1A2333] text-white border-gray-700 flex-1"
            />
            <div className="flex space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="bg-[#1A2333] text-white border-gray-700"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Sort by stock: {sortOrder === "asc" ? "Low to High" : "High to Low"}
                  </p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetch()}
                    className="bg-[#1A2333] text-white border-gray-700"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh stock data</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-white text-lg font-medium">Loading stock data...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">
              Error fetching stock data
            </div>
          ) : products.length === 0 ? (
            <div className="text-center max-w-md mx-auto py-8">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="text-emerald-400" size={40} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Plus className="text-white" size={16} />
                </div>
              </div>

              <h4 className="text-2xl font-bold text-white mb-3">Ready to manage your inventory?</h4>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Your stock dashboard is waiting for products. Add your first product to start tracking inventory.
              </p>

              <div className="space-y-3">
                <Button
                  asChild
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Link href="/dashboard/products/new" className="flex items-center gap-2">
                    <Plus size={18} />
                    Add Your First Product
                  </Link>
                </Button>

                <p className="text-sm text-gray-400">Or wait for products to appear here</p>
              </div>
            </div>
          ) : filteredAndSortedProducts.length > 0 ? (
            <div className="space-y-4">
              {filteredAndSortedProducts.map((product: Product, index: number) => {
                const { color, text, progress } = getStockStatus(product.stock);
                return (
                  <div
                    key={index}
                    className="bg-[#1A2333] rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between transition-all hover:bg-[#223045]"
                  >
                    <div className="flex items-center space-x-4 mb-2 sm:mb-0 w-full sm:w-auto">
                      <div className={`w-3 h-3 rounded-full ${color}`}></div>
                      <h4 className="font-medium text-white">{product.name}</h4>
                    </div>
                    <div className="flex items-center space-x-4 w-full sm:w-auto">
                      <Progress value={progress} className="flex-1" />
                      <span className="text-sm text-gray-400 w-16">{text}</span>
                      <span className="font-bold text-lg text-white w-12 text-right">
                        {product.stock}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No matching products found
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLowStock(!showLowStock)}
            className={`bg-[#1A2333] text-white border-gray-700 w-full sm:w-auto ${
              showLowStock ? "ring-2 ring-yellow-500" : ""
            }`}
          >
            {showLowStock ? "Show All" : "Show Low Stock"}
          </Button>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-gray-400">
              {lowStockCount} item{lowStockCount !== 1 ? "s" : ""} low on stock
            </span>
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
};

export default StockAlert;
