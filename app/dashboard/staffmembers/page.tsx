"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
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

interface StaffMember {
  staffId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export default function StaffManagementDashboard() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "cashier">("manager");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch staff members
  useEffect(() => {
    console.log("API URL:", process.env.BACKEND_URL);
    const fetchStaff = async () => {
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
        setMembers(data.staff || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load staff members";
        setError(errorMessage);
        console.error("Error fetching staff:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [getToken]);

  // Filter members based on search term
  const filteredMembers = members.filter((member) => {
    const userName = `${member.firstName || ""} ${member.lastName || ""}`.toLowerCase();
    const email = member.email?.toLowerCase() || "";
    return userName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  // Handle viewing staff details
  const handleViewDetails = (staffId: string) => {
    router.push(`/dashboard/staffmembers/${staffId}`);
  };

  // Handle inviting new staff members
  const handleInviteMembers = async () => {
    if (!inviteEmail || !inviteFirstName || !inviteLastName || !inviteRole) {
      setError("Please enter email, first name, last name, and select a role");
      return;
    }

    // Validate email format
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail);
    if (!isValidEmail) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication failed: No token received");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL is undefined. Check environment variables.");
      }

      const response = await fetch(`${apiUrl}/api/staff/invite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          firstName: inviteFirstName,
          lastName: inviteLastName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      // Refresh staff list
      const updatedResponse = await fetch(`${apiUrl}/api/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setMembers(updatedData.staff || []);
      } else {
        throw new Error("Failed to refresh staff list after invitation.");
      }

      setInviteEmail("");
      setInviteFirstName("");
      setInviteLastName("");
      setInviteRole("manager");
      setIsDialogOpen(false);
      setError(null);
      alert("Invitation sent successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send invitation";
      setError(errorMessage);
      console.error("Invite error:", err);
      alert(`Failed to send invitation: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold">Staff Management</h1>
        <p className="text-gray-500">Loading staff data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 w-full max-w-full">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>
      )}
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Staff Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="w-full sm:w-auto">
              + Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite New Members</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="Enter email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  type="email"
                />
              </div>
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  onValueChange={(value) => setInviteRole(value as "manager" | "cashier")}
                  defaultValue={inviteRole}
                >
                  <SelectTrigger>
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
              <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteMembers}>Send Invitation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-full">
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <Card key={member.staffId} className="w-full">
              <CardHeader>
                <CardTitle className="text-lg">
                  {member.firstName || "N/A"} {member.lastName || ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 break-words">{member.email}</p>
                <p className="text-sm font-medium mt-2 capitalize">Role: {member.role}</p>
              </CardContent>
              <CardFooter>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewDetails(member.staffId)}
                >
                  View
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-4">
            No members found.
          </div>
        )}
      </div>
    </div>
  );
}