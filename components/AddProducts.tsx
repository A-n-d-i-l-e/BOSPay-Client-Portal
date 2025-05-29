"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@clerk/nextjs";
import { fetchUserOrganizationId, BACKEND_URL } from "@/data/org";

interface AddProductsProps {
  onClose: () => void;
}

function AddProducts({ onClose }: AddProductsProps) {
  // Use a single state object for all form fields to reduce the number of re-renders
  const [formState, setFormState] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
  });

  // Separate state for image-related data
  const [imageState, setImageState] = useState({
    image: null as File | null,
    previewUrl: null as string | null,
  });

  const [orgId, setOrgId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { session } = useSession();

  // This ref will track whether we're in the middle of an image state update
  const isImageStateUpdating = useRef(false);

  // Get organization ID on mount
  useEffect(() => {
    let isMounted = true;

    const fetchOrgId = async () => {
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
            alert("Failed to fetch organization details.");
          }
        }
      }
    };

    fetchOrgId();

    return () => {
      isMounted = false;
    };
  }, [session]);

  // Clean up preview URL when component unmounts or when preview URL changes
  useEffect(() => {
    return () => {
      if (imageState.previewUrl) {
        URL.revokeObjectURL(imageState.previewUrl);
      }
    };
  }, [imageState.previewUrl]);

  // Handle form field changes
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Handle image selection
  const handleImageSelect = (file: File | undefined) => {
    // Signal that we're updating image state
    isImageStateUpdating.current = true;
    
    // Clean up previous preview URL before creating a new one
    if (imageState.previewUrl) {
      URL.revokeObjectURL(imageState.previewUrl);
    }

    if (file && file.type.startsWith("image/")) {
      const newPreviewUrl = URL.createObjectURL(file);
      setImageState({
        image: file,
        previewUrl: newPreviewUrl
      });
    } else {
      setImageState({
        image: null,
        previewUrl: null
      });
    }

    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    // Signal that we're done updating image state
    isImageStateUpdating.current = false;
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleImageSelect(e.target.files?.[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const uploadImageToBlobStorage = async (file: File, token: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("imageFile", file);

      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Image upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Image upload error:", error);
      throw new Error("Failed to upload image.");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      alert("You need to be logged in to add a product.");
      return;
    }
    
    if (!orgId) {
      alert("Organization details are missing. Please try again.");
      return;
    }

    try {
      const token = await session.getToken();

      let imageUrl = null;
      if (imageState.image) {
        imageUrl = await uploadImageToBlobStorage(imageState.image, token as string);
      }

      const response = await fetch(`${BACKEND_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formState.name,
          category: formState.category,
          price: parseFloat(formState.price),
          stock: parseInt(formState.stock, 10),
          description: formState.description,
          imageUrl,
          orgId,
          userId: session.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add product: ${response.statusText}`);
      }

      alert("Product added successfully!");
      
      // Reset form
      setFormState({
        name: "",
        category: "",
        price: "",
        stock: "",
        description: "",
      });
      
      // Reset image state
      if (imageState.previewUrl) {
        URL.revokeObjectURL(imageState.previewUrl);
      }
      setImageState({
        image: null,
        previewUrl: null
      });
      
      // Close modal
      onClose();
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error adding product.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardDescription>Fill in the details to add a new product.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleAddProduct} ref={formRef}>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formState.name}
              onChange={handleFieldChange}
              placeholder="Enter product name"
              required
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formState.category}
              onChange={handleFieldChange}
              placeholder="Enter product category (e.g., Food, Drinks)"
              required
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              value={formState.price}
              onChange={handleFieldChange}
              placeholder="Enter product price"
              type="number"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="stock">Stock Level</Label>
            <Input
              id="stock"
              value={formState.stock}
              onChange={handleFieldChange}
              placeholder="Enter stock level"
              type="number"
              min="0"
              required
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formState.description}
              onChange={handleFieldChange}
              placeholder="Enter product description"
              rows={4}
              required
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="image">Product Image</Label>
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {imageState.previewUrl ? (
                <Image
                  src={imageState.previewUrl}
                  alt="Uploaded Image Preview"
                  width={100}
                  height={100}
                  className="object-cover rounded-lg mx-auto"
                  unoptimized={true}
                />
              ) : (
                <p className="text-gray-500">
                  Drag and drop an image here, or{" "}
                  <span className="text-blue-600 underline">browse files</span>
                </p>
              )}
              <input
                ref={fileInputRef}
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>
          <Button type="submit" disabled={!orgId}>
            Add Product
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default AddProducts;
