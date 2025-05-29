"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@clerk/nextjs";
import React, { useState, useEffect } from "react";
import {
  fetchProductById,
  updateProductById,
  deleteProductById,
  Product,
} from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fetchUserOrganizationId } from "@/data/org";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const { session } = useSession();
  const [orgId, setOrgId] = useState<string | null>(null);

  // Fetch organization ID when session is available
  useEffect(() => {
    const fetchOrgId = async () => {
      if (session) {
        try {
          const token = await session.getToken();
          const id = await fetchUserOrganizationId(token as string);
          setOrgId(id);
        } catch (error) {
          console.error("Error fetching organization ID:", error);
        }
      }
    };
    fetchOrgId();
  }, [session]);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id, orgId],
    queryFn: async () => {
      if (!session) throw new Error("No session found");
      if (!orgId) throw new Error("Organization ID not found");
      const token = await session.getToken();
      if (!token) throw new Error("Token is null");
      return fetchProductById(id as string, token);
    },
    enabled: !!id && !!session && !!orgId,
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedProduct: Partial<Product>) => {
      if (!session) throw new Error("No session found");
      if (!orgId) throw new Error("Organization ID not found");
      const token = await session.getToken();
      if (!token) throw new Error("Token is null");
      return updateProductById(id as string, { ...updatedProduct, orgId }, token);
    },
    onSuccess: () => {
      setShowSuccessAlert(true);
      setTimeout(() => router.push("/dashboard/products"), 2000);
    },
    onError: (err) => {
      console.error("Failed to save product:", err);
      setShowErrorAlert(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("No session found");
      if (!orgId) throw new Error("Organization ID not found");
      const token = await session.getToken();
      if (!token) throw new Error("Token is null");
      return deleteProductById(id as string, token);
    },
    onSuccess: () => {
      setShowSuccessAlert(true);
      setTimeout(() => router.push("/dashboard/products"), 2000);
    },
    onError: (err) => {
      console.error("Failed to delete product:", err);
      setShowErrorAlert(true);
    },
  });

  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    category: "",
    description: "",
    price: 0,
    stock: 0,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData(product);
      if (product.category) {
        setCategories([product.category]);
      }
    }
  }, [product]);

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-t-2 border-b-2 border-pacific-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-4 text-sm sm:text-base">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!product) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-4 text-sm sm:text-base">
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>Product not found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-2 sm:px-4 py-2 sm:py-8"
    >
      <Button
        variant="ghost"
        className="mb-2 sm:mb-6 flex items-center gap-2 hover:bg-pacific-blue/10"
        onClick={() => router.push("/dashboard/products")}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back to Products</span>
      </Button>

      <Card className="w-full max-w-full sm:max-w-3xl mx-auto bg-gray-800 border-gray-700 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-gray-700 p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-2xl font-bold text-white">
            Edit Product
          </CardTitle>
        </CardHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full flex-nowrap overflow-x-auto bg-gray-800 border-b border-gray-700 p-1 sm:p-2">
            <TabsTrigger
              value="details"
              className="text-gray-300 data-[state=active]:text-pacific-blue"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="text-gray-300 data-[state=active]:text-pacific-blue"
            >
              Inventory
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <CardContent className="space-y-3 p-3 sm:space-y-6 sm:p-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  Product Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter product name"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-300">
                  Category
                </Label>
                <Select
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  defaultValue={formData.category}
                >
                  <SelectTrigger className={cn("bg-gray-700 border-gray-600 text-white", "max-w-[200px] sm:max-w-full")}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter product description"
                  rows={4}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </TabsContent>
          <TabsContent value="inventory">
            <CardContent className="space-y-3 p-3 sm:space-y-6 sm:p-6">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-gray-300">
                  Price (R)
                </Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  type="number"
                  placeholder="Enter product price"
                  min="0"
                  step="0.01"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-gray-300">
                  Stock Level
                </Label>
                <Input
                  id="stock"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: Number(e.target.value) })
                  }
                  type="number"
                  placeholder="Enter stock level"
                  min="0"
                  step="1"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex flex-col sm:flex-row justify-between sm:space-x-4 space-y-2 sm:space-y-0 p-3 sm:p-6">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending || !orgId}
            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || !orgId}
            className="bg-pacific-blue hover:bg-cobalt w-full sm:w-auto"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>

      {showSuccessAlert && (
        <Alert className="max-w-md mx-auto mt-2 sm:mt-4 bg-green-600 text-white text-sm sm:text-base">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            {updateMutation.isSuccess
              ? "Product updated successfully!"
              : "Product deleted successfully!"}
          </AlertDescription>
        </Alert>
      )}

      {showErrorAlert && (
        <Alert variant="destructive" className="max-w-md mx-auto mt-2 sm:mt-4 text-sm sm:text-base">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {updateMutation.isError
              ? "Failed to update product."
              : "Failed to delete product."}
          </AlertDescription>
        </Alert>
      )}
    </motion.div>
  );
}