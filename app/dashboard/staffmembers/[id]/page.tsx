"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@clerk/nextjs";
import { fetchStaff, StaffMember } from "@/data/staff";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loader";

export default function StaffDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { session } = useSession();

  // Fetch staff members
  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      if (!session) throw new Error("No session found");
      const token = await session.getToken();
      if (!token) throw new Error("Token is null");
      console.log("Fetching staff details with token:", token);
      return fetchStaff(token);
    },
    enabled: !!session,
  });

  // Find the staff member by staffId
  const staffMember = members.find((s: StaffMember) => s.staffId === params.id);
  console.log("Found staff member:", staffMember);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner className="text-pacific-blue w-10 h-10" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error.message}</div>;
  }

  if (!staffMember) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-red-500 text-2xl font-bold">Staff Member Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">We couldn&apos;t find the staff member you&apos;re looking for.</p>
          </CardContent>
          <Button
            onClick={() => router.push("/dashboard/staffmembers")}
            className="mt-4 bg-pacific-blue hover:bg-cobalt text-white"
          >
            Back to Staff
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/staffmembers")}
        className="mb-6 text-gray-300 hover:text-white"
      >
        ← Back to Staff
      </Button>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">
            {staffMember.firstName || "N/A"} {staffMember.lastName || ""}
          </CardTitle>
          <p className="text-gray-400">{staffMember.email}</p>
        </CardHeader>
        <CardContent>
          <div>
            <h3 className="text-lg font-medium text-gray-200">Role</h3>
            <p className="text-gray-400 capitalize">{staffMember.role}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}