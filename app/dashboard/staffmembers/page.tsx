"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@clerk/nextjs";
import { fetchStaff, inviteStaff, StaffMember } from "@/data/staff";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loader";

export default function StaffManagementDashboard() {
  const router = useRouter();
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "cashier">("manager");
  const [error, setError] = useState<string | null>(null);

  // Fetch staff members
  const { data: members = [], isLoading, error: queryError } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      if (!session) throw new Error("No session found");
      const token = await session.getToken();
      if (!token) throw new Error("Token is null");
      console.log("Fetching staff with token:", token);
      return fetchStaff(token);
    },
    enabled: !!session,
  });

  // Invite staff mutation
  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("No session found");
      const token = await session.getToken();
      if (!token) throw new Error("Token is null");
      if (!inviteEmail || !inviteFirstName || !inviteLastName || !inviteRole) {
        throw new Error("Please enter email, first name, last name, and select a role");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
        throw new Error("Please enter a valid email address");
      }

      const payload = {
        email: inviteEmail,
        role: inviteRole,
        firstName: inviteFirstName,
        lastName: inviteLastName,
      };
      console.log("POST /api/staff/invite payload:", payload);
      return inviteStaff(payload, token);
    },
    onSuccess: (data) => {
      console.log("POST /api/staff/invite response data:", data);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setInviteEmail("");
      setInviteFirstName("");
      setInviteLastName("");
      setInviteRole("manager");
      setIsDialogOpen(false);
      setError(null);
      alert("Invitation sent successfully!");
    },
    onError: (err: Error) => {
      const errorMessage = err.message || "Failed to send invitation";
      setError(errorMessage);
      console.error("Invite error:", err);
      alert(`Failed to send invitation: ${errorMessage}`);
    },
  });

  // Filter members based on search term
  const filteredMembers = members.filter((member: StaffMember) => {
    const userName = `${member.firstName || ""} ${member.lastName || ""}`.toLowerCase();
    const email = member.email?.toLowerCase() || "";
    return userName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  // Handle viewing staff details
  const handleViewDetails = (staffId: string) => {
    router.push(`/dashboard/staffmembers/${staffId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner className="text-pacific-blue w-10 h-10" />
      </div>
    );
  }

  if (queryError) {
    return <div className="p-6 text-red-500">Error: {queryError.message}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md mb-6">{error}</div>
      )}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Staff Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-pacific-blue text-white rounded-lg px-6 py-3 shadow-lg hover:bg-cobalt">
              + Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Invite New Members</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  placeholder="Enter email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  type="email"
                  className="bg-gray-700 text-gray-200 border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="firstName" className="text-gray-300">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                  className="bg-gray-700 text-gray-200 border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-gray-300">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                  className="bg-gray-700 text-gray-200 border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="role" className="text-gray-300">Role</Label>
                <Select
                  onValueChange={(value) => setInviteRole(value as "manager" | "cashier")}
                  defaultValue={inviteRole}
                >
                  <SelectTrigger className="bg-gray-700 text-gray-200 border-gray-600">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setIsDialogOpen(false)}
                className="bg-gray-600 hover:bg-gray-500"
              >
                Cancel
              </Button>
              <Button
                onClick={() => inviteMutation.mutate()}
                disabled={inviteMutation.isPending}
                className="bg-pacific-blue hover:bg-cobalt"
              >
                {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-8">
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-10 w-full rounded-lg border border-gray-600 text-gray-200 bg-gray-800 px-4 text-sm"
        />
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <Card key={member.staffId} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white">
                  {member.firstName || "N/A"} {member.lastName || ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 break-words">{member.email}</p>
                <p className="text-sm font-medium mt-2 capitalize text-gray-200">
                  Role: {member.role}
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewDetails(member.staffId)}
                  className="w-full bg-pacific-blue hover:bg-cobalt text-white"
                >
                  View
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-400 text-lg py-12">
            No staff members found.
          </div>
        )}
      </div>
    </div>
  );
}
