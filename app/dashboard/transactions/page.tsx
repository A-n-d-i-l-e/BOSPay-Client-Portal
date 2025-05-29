
"use client"

import { useState, useMemo } from "react"
import { useQuery, type QueryKey } from "@tanstack/react-query"
import { fetchConfirmedTransactions, type ConfirmedTransaction } from "@/data/transactions"
import { fetchInvoiceRecords, type InvoiceRecord } from "@/data/invoiceRecords"
import { fetchUserOrganizationId } from "@/data/org"
import { useAuth } from "@clerk/nextjs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Filter,
  ArrowDownUp,
  RefreshCw,
  ChevronRight,
  Bitcoin,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"

// Define a union type for combined transactions
type CombinedTransaction = (ConfirmedTransaction | InvoiceRecord) & { type: "confirmed" | "invoice" }

// Helper type guard function for runtime checks
function isConfirmedTransaction(txn: CombinedTransaction): txn is ConfirmedTransaction & { type: "confirmed" } {
  return txn.type === "confirmed"
}

function isInvoiceRecord(txn: CombinedTransaction): txn is InvoiceRecord & { type: "invoice" } {
  return txn.type === "invoice"
}

// Status badge component for consistent styling
function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    const lowerStatus = status.toLowerCase()

    if (lowerStatus === "confirmed" || lowerStatus === "paid") {
      return {
        color: "bg-green-500",
        icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
      }
    } else if (lowerStatus === "failed" || lowerStatus === "expired") {
      return {
        color: "bg-red-500",
        icon: <XCircle className="h-3 w-3 mr-1" />,
      }
    } else if (lowerStatus === "pending") {
      return {
        color: "bg-amber-500",
        icon: <Clock className="h-3 w-3 mr-1" />,
      }
    } else {
      return {
        color: "bg-gray-500",
        icon: <AlertCircle className="h-3 w-3 mr-1" />,
      }
    }
  }

  const { color, icon } = getStatusConfig(status)

  return (
    <Badge className={`text-white flex items-center ${color}`}>
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

// Transaction card component with currency-specific logos
function TransactionCard({ txn }: { txn: CombinedTransaction }) {
  const formattedDate = new Date(txn.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const formattedTime = new Date(txn.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  const status = isConfirmedTransaction(txn) ? txn.statusReadable : (txn as InvoiceRecord).status
  const currency = isConfirmedTransaction(txn) ? txn.tokenSymbol : (txn as InvoiceRecord).currency ?? "Unknown"
  const amount = isConfirmedTransaction(txn) ? txn.tokenAmount : Number(txn.amount).toFixed(8)
  const id = isConfirmedTransaction(txn) ? txn.transactionHash : txn.invoiceId
  const idLabel = isConfirmedTransaction(txn) ? "Tx Hash" : "Invoice ID"
  const type = isConfirmedTransaction(txn) ? "Confirmed" : "Invoice"

  // Currency logo component
  const CurrencyLogo = () => {
    const logoStyles = "h-6 w-6 rounded-full object-contain"
    const safeCurrency = currency || "Unknown" // Ensure currency is never undefined
    switch (safeCurrency.toUpperCase()) {
      case "BTC":
        return (
          <Image
            src="https://img.icons8.com/fluency/48/bitcoin.png"
            alt="Bitcoin"
            width={24}
            height={24}
            className={logoStyles}
          />
        )
      case "ETH":
        return (
          <Image
            src="https://img.icons8.com/color/48/ethereum.png"
            alt="Ethereum"
            width={24}
            height={24}
            className={logoStyles}
          />
        )
      case "USDC":
        return (
          <Image
            src="https://yagolpa5fi.ufs.sh/f/b7ffdead-364a-43ab-b43c-77f1bc31e9ac-tnizi2.png"
            alt="USDC"
            width={24}
            height={24}
            className={logoStyles}
          />
        )
      case "USDT":
        return (
          <Image
            src="https://img.icons8.com/color/48/tether--v2.png"
            alt="Tether"
            width={24}
            height={24}
            className={logoStyles}
          />
        )
      case "DAI":
        return (
          <div className="h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">
            DAI
          </div>
        )
      default:
        return (
          <div className="h-6 w-6 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold">
            {safeCurrency[0] || "?"}
          </div>
        )
    }
  }

  return (
    <Link href={`/dashboard/transactions/${txn.invoiceId}`}>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <CurrencyLogo />
              <div>
                <CardTitle className="text-lg">{currency}</CardTitle>
                <CardDescription className="text-xs">{type}</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">
                {currency} {amount}
              </div>
              {txn.convertedAmount && (
                <div className="text-sm text-gray-600">R{Number.parseFloat(txn.convertedAmount).toFixed(2)}</div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-500">{idLabel}:</div>
            <div className="text-right font-mono truncate">{id.substring(0, 16)}...</div>
            <div className="text-gray-500">Date:</div>
            <div className="text-right">{formattedDate}</div>
            <div className="text-gray-500">Time:</div>
            <div className="text-right">{formattedTime}</div>
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex justify-end">
          <StatusBadge status={status} />
        </CardFooter>
      </Card>
    </Link>
  )
}

// Loading skeleton for transactions
function TransactionSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-12 mt-1" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-16 mt-1" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-end">
        <Skeleton className="h-6 w-20" />
      </CardFooter>
    </Card>
  )
}

export default function CryptoTransactionHistoryPage() {
  const { getToken, userId } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [limit, setLimit] = useState(50)
  const [skip, setSkip] = useState(0)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // 1. Fetch the organization ID first (needed for Invoice Records)
  const {
    data: orgId,
    isLoading: isLoadingOrgId,
    isError: isErrorOrgId,
  } = useQuery<string | null, Error>({
    queryKey: ["userOrgId", userId] as QueryKey,
    queryFn: async () => {
      const token = await getToken()
      if (!token) {
        console.error("Clerk token is null when fetching org ID.")
        throw new Error("Authentication token not available.")
      }
      return fetchUserOrganizationId(token)
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 60,
  })

  // 2. Fetch Confirmed Transactions
  const {
    data: confirmedTransactions = [],
    isLoading: isLoadingConfirmed,
    isError: isErrorConfirmed,
  } = useQuery<ConfirmedTransaction[], Error>({
    queryKey: ["confirmedTransactionsList", userId] as QueryKey,
    queryFn: async () => {
      const token = await getToken()
      if (!token) {
        console.error("Clerk token is null when fetching transactions list.")
        throw new Error("Authentication token not available.")
      }
      return fetchConfirmedTransactions(token)
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })

  // 3. Fetch Invoice Records
  const {
    data: invoiceRecords = [],
    isLoading: isLoadingInvoices,
    isError: isErrorInvoices,
  } = useQuery<InvoiceRecord[], Error>({
    queryKey: ["invoiceRecordsList", orgId, limit, skip] as QueryKey,
    queryFn: async () => {
      if (!orgId) {
        console.warn("Org ID not available, skipping invoice records fetch.")
        return []
      }
      const token = await getToken()
      if (!token) {
        console.error("Clerk token is null when fetching invoice records.")
        throw new Error("Authentication token not available.")
      }
      return fetchInvoiceRecords(token, orgId, limit, skip)
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
  })

  // Combine and flatten both transaction types
  const allTransactions = useMemo<CombinedTransaction[]>(() => {
    const confirmed = confirmedTransactions.map((txn) => ({ ...txn, type: "confirmed" as const }))
    const invoices = invoiceRecords.map((txn) => ({ ...txn, type: "invoice" as const }))

    // Combine and sort by creation date
    const combined = [...confirmed, ...invoices].sort((a, b) => {
      const dateA = new Date(a?.createdAt ?? 0).getTime()
      const dateB = new Date(b?.createdAt ?? 0).getTime()

      if (isNaN(dateA) && isNaN(dateB)) return 0
      if (isNaN(dateA)) return 1
      if (isNaN(dateB)) return -1

      return sortOrder === "desc" ? dateB - dateA : dateA - dateB
    })

    return combined
  }, [confirmedTransactions, invoiceRecords, sortOrder])

  // Filtering logic applied to the combined list
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((txn) => {
      // Filter by tab first
      if (activeTab === "confirmed" && txn.type !== "confirmed") return false
      if (activeTab === "invoices" && txn.type !== "invoice") return false

      // Then apply search term
      if (!searchTerm) return true

      const lowerSearchTerm = searchTerm.toLowerCase()

      const matchesInvoiceId = txn.invoiceId.toLowerCase().includes(lowerSearchTerm)
      const matchesTokenSymbol = isConfirmedTransaction(txn) && txn.tokenSymbol?.toLowerCase().includes(lowerSearchTerm)
      const matchesTransactionHash =
        isConfirmedTransaction(txn) && txn.transactionHash.toLowerCase().includes(lowerSearchTerm)
      const matchesStatus = isConfirmedTransaction(txn)
        ? txn.statusReadable.toLowerCase().includes(lowerSearchTerm)
        : isInvoiceRecord(txn)
          ? txn.status.toLowerCase().includes(lowerSearchTerm)
          : false

      return matchesInvoiceId || matchesTokenSymbol || matchesTransactionHash || matchesStatus
    })
  }, [allTransactions, searchTerm, activeTab])

  // Combine loading states
  const isLoading = isLoadingOrgId || isLoadingConfirmed || isLoadingInvoices
  // Combine error states
  const isError = isErrorOrgId || isErrorConfirmed || isErrorInvoices

  // Display loading/error messages
  if (isLoadingOrgId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <TransactionSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isErrorOrgId) {
    return (
      <Card className="max-w-4xl mx-auto p-6">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            Error Loading Organization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Error loading organization information. Please try again.</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!orgId && !isLoadingOrgId) {
    return (
      <Card className="max-w-4xl mx-auto p-6">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            No Organization Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Could not find organization for the current user. Cannot display transactions.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Transactions</h1>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {/* Search and Filter Section */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by ID, currency, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  title={sortOrder === "desc" ? "Newest first" : "Oldest first"}
                >
                  <ArrowDownUp className="h-4 w-4" />
                </Button>

                {/* Filter Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Filter className="mr-2 h-4 w-4" /> Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Transaction Filters</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-6 my-6">
                      {/* Crypto/Currency Filter */}
                      <div>
                        <Label htmlFor="crypto" className="text-sm font-medium mb-2 block">
                          Currency
                        </Label>
                        <Select defaultValue="All">
                          <SelectTrigger id="crypto">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Currencies</SelectItem>
                            <SelectItem value="BTC">BTC</SelectItem>
                            <SelectItem value="ETH">ETH</SelectItem>
                            <SelectItem value="USDT">USDT</SelectItem>
                            <SelectItem value="USDC">USDC</SelectItem>
                            <SelectItem value="DAI">DAI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      {/* Status Filter */}
                      <div>
                        <Label htmlFor="status" className="text-sm font-medium mb-2 block">
                          Status
                        </Label>
                        <Select defaultValue="All">
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      {/* Date Range Filter */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label htmlFor="days" className="text-sm font-medium">
                            Time Period
                          </Label>
                          <span className="text-sm text-gray-500">Last 7 days</span>
                        </div>
                        <Slider defaultValue={[7]} max={30} min={1} step={1} />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1 day</span>
                          <span>30 days</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Amount Range Filter */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label htmlFor="amount" className="text-sm font-medium">
                            Amount Range
                          </Label>
                          <span className="text-sm text-gray-500">R0 - R1000</span>
                        </div>
                        <Slider defaultValue={[0, 500]} max={1000} min={0} step={10} />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>R0 / BTC 0</span>
                          <span>R1000 / BTC 1</span>
                        </div>
                      </div>
                    </div>
                    <SheetFooter>
                      <Button variant="outline" className="w-full">
                        Clear Filters
                      </Button>
                      <Button className="w-full">Apply Filters</Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Transaction Cards Display */}
            {isLoadingConfirmed || isLoadingInvoices ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <TransactionSkeleton key={i} />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="rounded-full bg-gray-100 p-3">
                    <Search className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">No transactions found</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    No transactions or invoices match your current filters. Try adjusting your search or filters.
                  </p>
                  {searchTerm && (
                    <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-2">
                      Clear Search
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTransactions.map((txn) => (
                  <TransactionCard key={txn.invoiceId} txn={txn} />
                ))}
              </div>
            )}

            {/* Load More Button - Only show if there are transactions and potentially more to load */}
            {filteredTransactions.length > 0 && filteredTransactions.length % limit === 0 && (
              <div className="flex justify-center mt-6">
                <Button variant="outline" onClick={() => setSkip(skip + limit)} className="w-full sm:w-auto">
                  Load More <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="confirmed" className="mt-0">
            {/* Same content structure as "all" tab but filtered for confirmed transactions */}
            {/* This content is automatically filtered by the filteredTransactions logic */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search confirmed transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {isLoadingConfirmed ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <TransactionSkeleton key={i} />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="rounded-full bg-gray-100 p-3">
                    <Search className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">No confirmed transactions</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    No confirmed transactions match your current search criteria.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTransactions.map((txn) => (
                  <TransactionCard key={txn.invoiceId} txn={txn} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="mt-0">
            {/* Same content structure as "all" tab but filtered for invoices */}
            {/* This content is automatically filtered by the filteredTransactions logic */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {isLoadingInvoices ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <TransactionSkeleton key={i} />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="rounded-full bg-gray-100 p-3">
                    <Bitcoin className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">No invoices found</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    No invoice records match your current search criteria.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTransactions.map((txn) => (
                  <TransactionCard key={txn.invoiceId} txn={txn} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}