"use client";

import React, { useMemo } from "react";
import { TrendingUp, PieChart as PieChart2, Plus, HandCoins, ShoppingBasket } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
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
  stock: {
    label: "Stock",
  },
};

const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#ffffff" fontSize={10}>{`${payload.name} ${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" fontSize={10}>
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const ProductPieChart: React.FC = () => {
  const { session } = useSession();
  const [activeIndex, setActiveIndex] = React.useState(0);

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
    const sortedProducts = [...products].sort((a, b) => b.stock - a.stock).slice(0, 5);
    return sortedProducts.map((product: Product, index: number) => ({
      name: product.name,
      stock: product.stock,
      fill: COLORS[index % COLORS.length],
    }));
  }, [products]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <Card className="flex flex-col bg-gradient-to-br from-[#171F2E] to-[#071D49] text-white h-full">
      <CardHeader className="items-center pb-2 sm:pb-4 text-center sm:text-left">
      <div className="flex items-center gap-3">
          <div className="p-2 bg-[#a45ee5]/20 rounded-lg">
            <ShoppingBasket className="text-[#a45ee5]" size={20} />
          </div>
          <CardTitle className="text-lg sm:text-xl font-bold">Product Distribution</CardTitle>
        </div>
        {/* <CardTitle className="text-base sm:text-lg lg:text-xl font-bold">Product Distribution</CardTitle> */}
        <CardDescription className="text-xs sm:text-sm text-[#05C3DE]">
          January - June 2025
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-2 sm:pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full min-h-[200px] sm:min-h-[250px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              {/* <p className="text-white text-lg font-medium">Loading product data...</p> */}
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full min-h-[200px] sm:min-h-[250px]">
            <p className="text-red-500 text-sm sm:text-base">Failed to load product data</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center max-w-md mx-auto py-8">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-[#05C3DE] rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart2 className="text-emerald-400" size={40} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#05C3DE] rounded-full flex items-center justify-center ring-2 ring-[#05C3DE]/50">
                <Plus className="text-white" size={16} />
              </div>
            </div>

            <h4 className="text-2xl font-bold text-white mb-3">Ready to analyze your product distribution?</h4>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Your product dashboard is waiting for data. Add your first product to start tracking stock distribution.
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
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full max-w-[180px] sm:max-w-[250px] lg:max-w-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={chartData}
                  dataKey="stock"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="70%"
                  onMouseEnter={onPieEnter}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
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

export default ProductPieChart;