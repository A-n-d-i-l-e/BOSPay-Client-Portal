"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StaffMember {
  staffId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export default function StaffDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { getToken } = useAuth();
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch staff details from the staff list
  useEffect(() => {
    const fetchStaffDetails = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Authentication failed: No token received");
        }

        const apiUrl = process.env.BACKEND_URL;
        if (!apiUrl) {
          throw new Error("API URL is undefined. Check environment variables.");
        }

        // Fetch all staff and find the one with matching staffId
        const response = await fetch(`${apiUrl}/api/staff`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const staff = data.staff.find((s: StaffMember) => s.staffId === params.id);
        if (!staff) {
          throw new Error("Staff member not found");
        }
        setStaffMember(staff);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load staff details";
        setError(errorMessage);
        console.error("Error fetching staff details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffDetails();
  }, [getToken, params.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-gray-500">Loading staff details...</p>
      </div>
    );
  }

  if (!staffMember || error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-red-600">Staff Member Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">{error || "We couldn't find the staff member you're looking for."}</p>
          </CardContent>
          <Button onClick={() => router.push("/dashboard/staffmembers")} className="mt-4">
            Back to Staff
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/staffmembers")}
        className="mb-6"
      >
        ← Back to Staff
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {staffMember.firstName || "N/A"} {staffMember.lastName || ""}
          </CardTitle>
          <p className="text-gray-500">{staffMember.email}</p>
        </CardHeader>
        <CardContent>
          <div>
            <h3 className="text-lg font-medium">Role</h3>
            <p className="text-gray-600 capitalize">{staffMember.role}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}