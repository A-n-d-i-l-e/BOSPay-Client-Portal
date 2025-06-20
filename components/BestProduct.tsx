"use client";

import React, { useMemo } from "react";
import { TrendingUp, Star, Plus, ShoppingBasket } from "lucide-react";
import {
  LabelList,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, Product } from "@/data/products";
import { useSession } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const COLORS = [
  "#003DA5", // Cobalt
  "#00A3E0", // Pacific Blue
  "#071D49", // Sapphire
  "#05C3DE", // Dark Turquoise
  "#a45ee5", // Medium Purple
];

const chartConfig: ChartConfig = {
  visitors: {
    label: "Stock",
  },
};

const BestProduct: React.FC = () => {
  const { session } = useSession();

  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!session) throw new Error("No session found");
      const token = await session.getToken();
      if (!token) throw new Error("Token is null");
      return fetchProducts(token);
    },
    enabled: !!session,
  });

  const chartData = useMemo(() => {
    const sortedProducts = [...products].sort((a, b) => b.stock - a.stock);
    const topProducts = sortedProducts.slice(0, 5);
    return topProducts.map((product: Product, index: number) => ({
      name: product.name,
      stock: product.stock,
      fill: COLORS[index % COLORS.length],
    }));
  }, [products]);

  return (
    <Card className="flex flex-col bg-gradient-to-br from-[#171F2E] to-[#071D49] text-white h-full">
      <CardHeader className="items-center pb-2 sm:pb-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#a45ee5]/20 rounded-lg">
            <ShoppingBasket className="text-[#a45ee5]" size={20} />
          </div>
          <CardTitle className="text-base sm:text-lg lg:text-xl font-bold">Best Performing Products</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm text-[#05C3DE]">
          January - June 2025
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-2 sm:pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full min-h-[200px] sm:min-h-[250px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#05C3DE] mx-auto mb-4"></div>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full min-h-[200px] sm:min-h-[250px]">
            <p className="text-red-500 text-sm sm:text-base">Failed to load best products</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center max-w-md mx-auto py-8">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-[#05C3DE] rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="text-white" size={40} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#05C3DE] rounded-full flex items-center justify-center ring-2 ring-[#05C3DE]/50">
                <Plus className="text-white" size={16} />
              </div>
            </div>

            <h4 className="text-2xl font-bold text-white mb-3">Ready to showcase your top products?</h4>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Your product dashboard is waiting for data. Add your first product to start tracking performance.
            </p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full max-w-[180px] sm:max-w-[250px] lg:max-w-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={chartData}
                startAngle={-90}
                endAngle={270}
                innerRadius="10%"
                outerRadius="70%"
              >
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="name" />}
                />
                <RadialBar
                  dataKey="stock"
                  background={{ fill: "rgba(255, 255, 255, 0.1)" }}
                  fill="fill"
                >
                  <LabelList
                    position="insideStart"
                    dataKey="name"
                    className="fill-white capitalize"
                    fontSize={9}
                  />
                </RadialBar>
              </RadialBarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 text-xs sm:text-sm pt-2 sm:pt-4">
        <div className="flex items-center gap-2 font-medium leading-none text-[#05C3DE]">
          <span className="whitespace-nowrap">Trending up by 5.2% this month</span>
          <TrendingUp className="h-4 w-4 flex-shrink-0" />
        </div>
        <div className="leading-tight text-[#00A3E0] text-center sm:text-left">
          Showing top 5 products by stock level
        </div>
      </CardFooter>
    </Card>
  );
};

export default BestProduct;