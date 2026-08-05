import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { getStatusLabel, getStatusVariant, formatPrice, getPaymentMethodLabel } from "./utils"
// @ts-expect-error: No type definitions for moment-jalaali
import moment from 'moment-jalaali'

function convertToJalali(isoDate: string): string {
  return moment(isoDate).format('jYYYY/jMM/jDD HH:mm');
}

// Define the Transaction type based on your API response
export type Transaction = {
  id: string
  order: {
    id: string
    status: string
    user: {
      username: string
      email: string
      first_name: string
      last_name: string
    }
  }
  created_by: {
    username: string
  }
  payment_method: string
  amount: number
  created_at: string
  user: {
    username: string
    email: string
    first_name: string
    last_name: string
  }
  reference_number: string | null
  transaction_type: "purchase" | "refund"
}

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "id",
    header: "شماره تراکنش",
    cell: ({ row }) => {
      const id = row.getValue("id");
      return <Link to={`/panel/transactions/${id}`} className="text-blue-600 underline">{id}</Link>;
    }
  },
  {
    accessorKey: "order.id",
    header: "شماره سفارش",
  },
  {
    accessorKey: "user.username",
    header: "کاربر",
    cell: ({ row }) => {
      const user = row.original.order.user;
      const fullName = `${user.first_name} ${user.last_name}`.trim();
      return (
        <div>
          <div>{fullName || user.username}</div>
          <div className="text-sm text-muted-foreground">{user.username}</div>
        </div>
      );
    }
  },
  {
    accessorKey: "amount",
    header: "مبلغ",
    cell: ({ row }) => {
      const amount = parseInt(row.getValue("amount"));
      return formatPrice(amount);
    },
  },
  {
    accessorKey: "payment_method",
    header: "روش پرداخت",
    cell: ({ row }) => {
      const paymentMethod = row.original.payment_method;
      return getPaymentMethodLabel(paymentMethod);
    },
  },
  {
    accessorKey: "order.status",
    header: "وضعیت سفارش",
    cell: ({ row }) => {
      const status = row.original.order.status;
      return (
        <Badge variant={getStatusVariant(status)}>
          {getStatusLabel(status)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "تاریخ",
    cell: ({ row }) => convertToJalali(row.getValue("created_at")),
  },
  {
    accessorKey: "created_by.username",
    header: "ایجاد شده توسط",
  },
]
