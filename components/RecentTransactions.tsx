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
  payment: string;
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
    payment:"USDT"
  },
  {
    id: 2,
    product: "Smartwatch E2",
    customer: "Ilham Budi Agung",
    email: "ilhambudi@mail.com",
    price: "R590.00",
    status: "Due",
    payment: "DAI"
  },
  {
    id: 3,
    product: "Smartwatch E2",
    customer: "Ilham Budi Agung",
    email: "ilhambudi@mail.com",
    price: "R590.00",
    status: "Paid",
    payment:"BTC"
  },
  {
    id: 4,
    product: "Smartwatch E2",
    customer: "Ilham Budi Agung",
    email: "ilhambudi@mail.com",
    price: "R590.00",
    status: "Paid",
    payment:"ETH"
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
          <CardTitle className="text-sm font-medium text-white">
            Recent Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="bg-white text-sapphire">
                  <tr>
                    <th className="py-2 px-2 sm:px-4">Product</th>
                    <th className="py-2 px-2 sm:px-4">Customer</th>
                    <th className="py-2 px-2 sm:px-4">Price</th>
                    <th className="py-2 px-2 sm:px-4">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((sale, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-2 px-2 sm:px-4">{sale.product}</td>
                      <td className="py-2 px-2 sm:px-4">{sale.customer}</td>
                      <td className="py-2 px-2 sm:px-4">R{sale.price}</td>
                      <td className="py-2 px-2 sm:px-4 text-dark-turquoise">{sale.payment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-white text-center py-4">No recent transactions</p>
          )}
        </CardContent>
      </Card>
  );
};

export default RecentTransactions;