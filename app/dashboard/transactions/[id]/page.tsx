"use client"

import type React from "react"

import { useParams, useRouter } from "next/navigation"
import { useQuery, type QueryKey } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { fetchConfirmedTransactionById, type ConfirmedTransaction } from "@/data/transactions"
import { fetchInvoiceRecordById, type InvoiceRecord } from "@/data/invoiceRecords"
import { useAuth } from "@clerk/nextjs"
import {
  RefreshCw,
  Bitcoin,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  Calendar,
  Clock3,
  Hash,
  CreditCard,
  Building,
  User,
  QrCode,
  ExternalLink,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// Define a union type for the data on the details page
type TransactionDetail = ConfirmedTransaction | InvoiceRecord

// Helper type guard functions for runtime checks
function isConfirmedTransaction(txn: TransactionDetail): txn is ConfirmedTransaction {
  return (txn as ConfirmedTransaction).transactionHash !== undefined
}

function isInvoiceRecord(txn: TransactionDetail): txn is InvoiceRecord {
  return (txn as InvoiceRecord).status !== undefined && (txn as ConfirmedTransaction).transactionHash === undefined
}

// Status badge component
function StatusBadge({ status, type }: { status: string; type: "confirmed" | "invoice" }) {
  const getStatusConfig = (status: string, type: "confirmed" | "invoice") => {
    const lowerStatus = status.toLowerCase()

    if (type === "confirmed") {
      if (lowerStatus === "confirmed") return { color: "bg-green-500", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> }
      if (lowerStatus === "failed") return { color: "bg-red-500", icon: <XCircle className="h-3 w-3 mr-1" /> }
    } else if (type === "invoice") {
      if (lowerStatus === "paid") return { color: "bg-green-500", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> }
      if (lowerStatus === "expired") return { color: "bg-red-500", icon: <XCircle className="h-3 w-3 mr-1" /> }
      if (lowerStatus === "pending") return { color: "bg-amber-500", icon: <Clock className="h-3 w-3 mr-1" /> }
    }

    return { color: "bg-gray-500", icon: <AlertCircle className="h-3 w-3 mr-1" /> }
  }

  const { color, icon } = getStatusConfig(status, type)

  return (
    <Badge className={`text-white flex items-center ${color}`}>
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

// Detail item component for consistent styling
function DetailItem({
  label,
  value,
  icon,
  className,
  fullWidth = false,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  className?: string
  fullWidth?: boolean
}) {
  return (
    <div className={cn("p-4 bg-gray-50 rounded-lg", fullWidth ? "col-span-2" : "", className)}>
      <div className="flex items-center gap-2 mb-1 text-gray-500">
        {icon}
        <h3 className="text-sm font-medium">{label}</h3>
      </div>
      <div
        className={cn(
          "font-medium break-all text-gray-800",
          typeof value === "string" && value.length > 30 ? "text-sm" : "text-base",
        )}
      >
        {value}
      </div>
    </div>
  )
}

// Loading skeleton for transaction details
function TransactionDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-4 w-full max-w-md mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TransactionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { getToken, userId } = useAuth()

  const transactionId = Array.isArray(params.id) ? params.id[0] : params.id

  // Attempt to get data from router state first
  const initialDataFromState = undefined

  // Fetch the specific transaction details
  const {
    data: transaction,
    isLoading,
    isError,
    error,
  } = useQuery<TransactionDetail | null, Error>({
    queryKey: ["transactionDetail", transactionId, userId] as QueryKey,
    queryFn: async () => {
      if (!transactionId) {
        console.warn("Transaction ID is not available in route params, skipping fetch.")
        return null
      }
      const token = await getToken()
      if (!token) {
        console.error("Clerk token is null when fetching transaction details.")
        throw new Error("Authentication token not available.")
      }

      // Attempt to fetch as a ConfirmedTransaction first
      let data: ConfirmedTransaction | InvoiceRecord | null = await fetchConfirmedTransactionById(transactionId, token)

      if (data) {
        console.log(`Found ConfirmedTransaction for ID ${transactionId}`)
        return data as ConfirmedTransaction
      }

      // If not found as ConfirmedTransaction, attempt to fetch as an InvoiceRecord
      console.log(`ConfirmedTransaction not found for ID ${transactionId}, attempting to fetch as InvoiceRecord.`)
      data = await fetchInvoiceRecordById(transactionId, token)

      if (data) {
        console.log(`Found InvoiceRecord for ID ${transactionId}`)
        return data as InvoiceRecord
      }

      console.warn(`No transaction or invoice found for ID ${transactionId}`)
      return null
    },
    enabled: !!transactionId && !!userId,
    placeholderData: initialDataFromState ? () => initialDataFromState as TransactionDetail : undefined,
    retry: (failureCount, error) => {
      if (
        (error as any).message?.includes("404") ||
        (error as any).message?.includes("Authentication") ||
        (error as any).message?.includes("Authorization")
      ) {
        return false
      }
      return failureCount < 3
    },
  })

  // Determine the type of transaction for rendering based on fetched data
  const currentTransaction = transaction || initialDataFromState

  const isConfirmed = currentTransaction ? isConfirmedTransaction(currentTransaction) : false
  const isInvoice = currentTransaction ? isInvoiceRecord(currentTransaction) : false

  // Loading state
  if (isLoading && !currentTransaction) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <TransactionDetailsSkeleton />
      </div>
    )
  }

  // Error state
  if (isError && !currentTransaction) {
    console.error("Transaction Details Query Error:", error)
    return (
      <div className="container mx-auto py-8 px-4 max-w-lg">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/transactions")}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Transactions
        </Button>

        <Card className="border-red-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-red-600 gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">There was an error fetching the transaction details: {error.message}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" /> Retry Fetching
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Transaction not found state
  if (!currentTransaction && !isLoading && !isError) {
    if (transactionId) {
      return (
        <div className="container mx-auto py-8 px-4 max-w-lg">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/transactions")}
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Transactions
          </Button>

          <Card className="border-amber-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-amber-600 gap-2">
                <AlertCircle className="h-5 w-5" />
                Transaction Not Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                We couldn&apos;t find a transaction or invoice with ID:{" "}
                <span className="font-mono">{transactionId}</span>
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => router.push("/dashboard/transactions")} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Transactions
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    } else {
      return (
        <div className="container mx-auto py-8 px-4 max-w-lg">
          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600 gap-2">
                <AlertCircle className="h-5 w-5" />
                Invalid Transaction ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">No transaction ID was provided in the URL.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => router.push("/dashboard/transactions")} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Transactions
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }
  }

  // Display transaction details
  // We are guaranteed 'currentTransaction' is not null here
  const displayTransaction = currentTransaction as TransactionDetail

  const formattedDate = new Date(displayTransaction.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const formattedTime = new Date(displayTransaction.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  // Get transaction type for display
  const transactionType = isConfirmed ? "confirmed" : "invoice"
  const transactionStatus = isConfirmed
    ? (displayTransaction as ConfirmedTransaction).statusReadable
    : (displayTransaction as InvoiceRecord).status

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/transactions")}
        className="mb-6 flex items-center gap-2 hover:bg-gray-100"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Transactions
      </Button>

      {/* Transaction Details Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                {isConfirmed ? (
                  <div className="p-2 rounded-full bg-gray-100">
                    <Wallet className="h-5 w-5 text-gray-600" />
                  </div>
                ) : (
                  <div className="p-2 rounded-full bg-gray-100">
                    <Bitcoin className="h-5 w-5 text-gray-600" />
                  </div>
                )}
                <CardTitle className="text-xl">{isConfirmed ? "Confirmed Transaction" : "Invoice Record"}</CardTitle>
              </div>
              <CardDescription className="mt-1">
                Created on {formattedDate} at {formattedTime}
              </CardDescription>
            </div>
            <StatusBadge status={transactionStatus} type={transactionType} />
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="details">Transaction Details</TabsTrigger>
              <TabsTrigger value="metadata">Metadata & IDs</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-0">
              {/* Transaction ID Banner */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Transaction ID</div>
                  <div className="font-mono text-sm break-all text-gray-800">{displayTransaction.invoiceId}</div>
                </div>
                {isConfirmed && (
                  <Button variant="outline" size="sm" className="shrink-0">
                    <ExternalLink className="h-3 w-3 mr-1" /> View on Blockchain
                  </Button>
                )}
              </div>

              {/* Transaction Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Common Details */}
                <DetailItem label="Date" value={formattedDate} icon={<Calendar className="h-4 w-4" />} />
                <DetailItem label="Time" value={formattedTime} icon={<Clock3 className="h-4 w-4" />} />

                {/* Conditional Details based on Type */}
                {isConfirmed && (
                  <>
                    <DetailItem
                      label="Transaction Hash"
                      value={(displayTransaction as ConfirmedTransaction).transactionHash}
                      icon={<Hash className="h-4 w-4" />}
                      fullWidth
                    />
                    <DetailItem
                      label="Crypto Currency"
                      value={(displayTransaction as ConfirmedTransaction).tokenSymbol || "N/A"}
                      icon={<CreditCard className="h-4 w-4" />}
                    />
                    <DetailItem
                      label="Crypto Amount"
                      value={`${(displayTransaction as ConfirmedTransaction).tokenSymbol} ${
                        (displayTransaction as ConfirmedTransaction).tokenAmount || "N/A"
                      }`}
                      icon={<Bitcoin className="h-4 w-4" />}
                    />
                    <DetailItem
                      label="From Address"
                      value={(displayTransaction as ConfirmedTransaction).fromAddress}
                      icon={<Wallet className="h-4 w-4" />}
                      fullWidth
                    />
                    <DetailItem
                      label="Merchant Address"
                      value={(displayTransaction as ConfirmedTransaction).merchantAddress}
                      icon={<Building className="h-4 w-4" />}
                      fullWidth
                    />
                    {/* <DetailItem
                      label="Transaction Fee"
                      value={(displayTransaction as ConfirmedTransaction).txFee || "N/A"}
                      icon={<CreditCard className="h-4 w-4" />}
                    /> */}
                  </>
                )}

                {isInvoice && (
                  <>
                    <DetailItem
                      label="Store ID"
                      value={(displayTransaction as InvoiceRecord).storeId}
                      icon={<Building className="h-4 w-4" />}
                      fullWidth
                    />
                    <DetailItem
                      label="Currency"
                      value={(displayTransaction as InvoiceRecord).currency}
                      icon={<CreditCard className="h-4 w-4" />}
                    />
                    <DetailItem
                      label={`Amount (${(displayTransaction as InvoiceRecord).currency})`}
                      value={(displayTransaction as InvoiceRecord).amount.toFixed(8)}
                      icon={<Bitcoin className="h-4 w-4" />}
                    />
                    <DetailItem
                      label={`BosPay Fee (${(displayTransaction as InvoiceRecord).currency})`}
                      value={(displayTransaction as InvoiceRecord).bosPayFee.toFixed(8)}
                      icon={<CreditCard className="h-4 w-4" />}
                    />
                    <DetailItem
                      label={`Net Amount (${(displayTransaction as InvoiceRecord).currency})`}
                      value={(displayTransaction as InvoiceRecord).netAmount.toFixed(8)}
                      icon={<Bitcoin className="h-4 w-4" />}
                    />
                  </>
                )}

                {/* Converted Amount (if present) */}
                {displayTransaction.convertedAmount && (
                  <DetailItem
                    label="Amount in ZAR"
                    value={`R${Number.parseFloat(displayTransaction.convertedAmount).toFixed(2)}`}
                    icon={<CreditCard className="h-4 w-4" />}
                    className="bg-gray-100"
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Display common fields safely */}
                <DetailItem
                  label="Invoice ID"
                  value={displayTransaction.invoiceId}
                  icon={<Hash className="h-4 w-4" />}
                  fullWidth
                />

                {/* {displayTransaction.userId && (
                  <DetailItem
                    label="User ID"
                    value={displayTransaction.userId}
                    icon={<User className="h-4 w-4" />}
                    fullWidth
                  />
                )} */}

                {/* {displayTransaction.staffId && (
                  <DetailItem
                    label="Staff ID"
                    value={displayTransaction.staffId}
                    icon={<User className="h-4 w-4" />}
                    fullWidth
                  />
                )} */}

                {displayTransaction.qrCodeId && (
                  <DetailItem
                    label="QR Code ID"
                    value={displayTransaction.qrCodeId}
                    icon={<QrCode className="h-4 w-4" />}
                    fullWidth
                  />
                )}

                {/* {displayTransaction.orgId && (
                  <DetailItem
                    label="Organization ID"
                    value={displayTransaction.orgId}
                    icon={<Building className="h-4 w-4" />}
                    fullWidth
                  />
                )} */}

                <DetailItem
                  label="Created At"
                  value={new Date(displayTransaction.createdAt).toLocaleString()}
                  icon={<Calendar className="h-4 w-4" />}
                />

                {displayTransaction.updatedAt && (
                  <DetailItem
                    label="Updated At"
                    value={new Date(displayTransaction.updatedAt).toLocaleString()}
                    icon={<RefreshCw className="h-4 w-4" />}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="border-t pt-6 flex justify-between">
          <Button variant="outline" onClick={() => router.push("/dashboard/transactions")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Transactions
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
