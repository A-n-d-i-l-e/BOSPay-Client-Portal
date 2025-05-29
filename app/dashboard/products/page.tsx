"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProducts, Product } from "@/data/products";
import { useSession } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AddProducts from "@/components/AddProducts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loader";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { fetchUserOrganizationId } from "@/data/org";

const ProductsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isOrgIdLoading, setIsOrgIdLoading] = useState(true);

  const { session } = useSession();
  const queryClient = useQueryClient();

  // Fetch organization ID
  useEffect(() => {
    let isMounted = true;

    const fetchOrgId = async () => {
      setIsOrgIdLoading(true);
      if (session && isMounted) {
        try {
          const token = await session.getToken();
          const id = await fetchUserOrganizationId(token as string);
          if (isMounted) {
            setOrgId(id);
          }
        } catch (error) {
          if (isMounted) {
            console.error("Error fetching organization ID:", error);
          }
        }
      }
      if (isMounted) {
        setIsOrgIdLoading(false);
      }
    };

    fetchOrgId();

    return () => {
      isMounted = false;
    };
  }, [session]);

  // Fetch products data
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["products", orgId],
    queryFn: async () => {
      if (!session) throw new Error("No session found");
      if (!orgId) throw new Error("Organization ID not found");
      const token = await session.getToken();
      if (!token) throw new Error("Token is null");
      return fetchProducts(token);
    },
    enabled: !!session && !!orgId && !isOrgIdLoading,
  });

  // Create a memoized version of the modal close handler
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["products", orgId] });
  }, [queryClient, orgId]);

  // Extract unique categories
  const categories = ["All", ...Array.from(new Set(products.map((product: Product) => product.category)))];

  // Filter products
  const filteredProducts = products.filter((product: Product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = searchTerm === "" || product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStock =
      stockFilter === "All" ||
      (stockFilter === "In Stock" && product.stock > 0) ||
      (stockFilter === "Low Stock" && product.stock > 0 && product.stock <= 10) ||
      (stockFilter === "Out of Stock" && product.stock === 0);

    return matchesCategory && matchesSearch && matchesStock;
  });

  if (isLoading || isOrgIdLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner className="text-pacific-blue w-10 h-10" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Product List</h1>
        <Button
          className="bg-pacific-blue text-white rounded-lg px-6 py-3 shadow-lg hover:bg-cobalt transition-all duration-300 transform hover:scale-105"
          onClick={() => setIsModalOpen(true)}
          disabled={!orgId}
        >
          + Add Product
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label htmlFor="search" className="text-sm font-medium text-gray-300">
            Search Products
          </label>
          <Input
            id="search"
            type="text"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-600 text-gray-200 bg-gray-800 px-4 text-sm shadow-sm focus:border-pacific-blue focus:ring focus:ring-light-blue-gradient"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium text-gray-300">
            Category
          </label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category" className="h-10 w-full rounded-lg border border-gray-600 text-gray-200 bg-gray-800 px-4 text-sm shadow-sm focus:border-pacific-blue focus:ring focus:ring-light-blue-gradient">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor="stock" className="text-sm font-medium text-gray-300">
            Stock Status
          </label>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger id="stock" className="h-10 w-full rounded-lg border border-gray-600 text-gray-200 bg-gray-800 px-4 text-sm shadow-sm focus:border-pacific-blue focus:ring focus:ring-light-blue-gradient">
              <SelectValue placeholder="Select stock status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Stock</SelectItem>
              <SelectItem value="In Stock">In Stock</SelectItem>
              <SelectItem value="Low Stock">Low Stock</SelectItem>
              <SelectItem value="Out of Stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden bg-gray-800 border-gray-700">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={product.imageUrl || "https://via.placeholder.com/150"}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 hover:scale-110"
                    unoptimized={true}
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 line-clamp-2">{product.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-pacific-blue font-bold text-lg">
                      R{product.price.toFixed(2)}
                    </span>
                    <Badge
                      variant={
                        product.stock > 10
                          ? "default"
                          : product.stock > 0
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {product.stock > 10
                        ? "In Stock"
                        : product.stock > 0
                        ? `Low Stock (${product.stock})`
                        : "Out of Stock"}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/dashboard/products/${product.id}`}>
                    <Button className="w-full bg-pacific-blue hover:bg-cobalt transition-colors">
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-400 text-lg py-12">
            No products available.{" "}
            <span
              className="text-pacific-blue font-medium cursor-pointer hover:underline"
              onClick={() => setIsModalOpen(true)}
            >
              Add some products!
            </span>
          </div>
        )}
      </motion.div>

      
      <Dialog 
        key="add-product-dialog"
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
      >
        <DialogContent className="sm:max-w-lg bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add New Product</DialogTitle>
          </DialogHeader>
          {/* Use memo'd handler and a stable key to preserve component instance */}
          <AddProducts 
            key="add-product-form"
            onClose={handleModalClose} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsPage;
