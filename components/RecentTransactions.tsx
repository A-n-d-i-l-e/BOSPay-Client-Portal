import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  Chip,
  Card,
  CardHeader,
} from "@nextui-org/react";
import { CardTitle, CardContent } from "./ui/card";
import { ChipProps } from "@nextui-org/react";

type Transaction = {
  id: number;
  product: string;
  customer: string;
  email: string;
  price: string;
  status: "Paid" | "Due";
};

const transactions: Transaction[] = [
  {
    id: 1,
    product: "Handmade Pouch",
    customer: "John Bushmill",
    email: "johnb@mail.com",
    price: "$121.00",
    status: "Paid",
  },
  {
    id: 2,
    product: "Smartwatch E2",
    customer: "Ilham Budi Agung",
    email: "ilhambudi@mail.com",
    price: "$590.00",
    status: "Due",
  },
  {
    id: 3,
    product: "Smartwatch E2",
    customer: "Ilham Budi Agung",
    email: "ilhambudi@mail.com",
    price: "$590.00",
    status: "Paid",
  },
];

const statusColorMap: Record<"Paid" | "Due", ChipProps["color"]> = {
  Paid: "success",
  Due: "warning",
};

const RecentTransactions = () => {
  console.log("Transactions data:", transactions);
  return (
    <Card className="border border-midnight-express">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-sapphire">
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table aria-label="Recent Transactions">
          <TableHeader>
            <TableColumn>Product</TableColumn>
            <TableColumn>Customer</TableColumn>
            <TableColumn>Price</TableColumn>
            <TableColumn>Status</TableColumn>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{tx.product}</TableCell>
                <TableCell>
                  <User
                    avatarProps={{ src: "https://via.placeholder.com/50" }}
                    name={tx.customer}
                    description={tx.email}
                  />
                </TableCell>
                <TableCell>{tx.price}</TableCell>
                <TableCell>
                  <Chip
                    className="capitalize"
                    color={statusColorMap[tx.status]}
                    size="sm"
                    variant="flat"
                  >
                    {tx.status}
                  </Chip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;