import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { getStatusLabel, getStatusVariant, formatPrice, getPaymentMethodLabel } from "./utils"
import { School } from "lucide-react"
// @ts-expect-error: No type definitions for moment-jalaali
import moment from 'moment-jalaali'

function convertToJalali(isoDate: string): string {
  return moment(isoDate).format('jYYYY/jMM/jDD HH:mm');
}

export type TransactionUser = {
  id?: number
  username: string
  email: string
  first_name: string
  last_name: string
  school?: string
  phone_number?: string
  grade?: string
}

// Define the Transaction type based on your API response
export type Transaction = {
  id: string
  transaction_code?: string
  order?: {
    id: string | number
    order_code?: string
    status: string
    user?: TransactionUser
  }
  created_by?: TransactionUser
  payment_method: string
  amount: number
  created_at: string
  user?: TransactionUser
  reference_number: string | null
  transaction_type: "purchase" | "refund"
}

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "transaction_code",
    header: "کد تراکنش",
    cell: ({ row }) => {
      const code = row.original.transaction_code || row.original.id;
      return <Link to={`/panel/transactions/${code}`} className="text-primary font-mono font-bold hover:underline">{code}</Link>;
    }
  },
  {
    accessorKey: "order.order_code",
    header: "کد سفارش",
    cell: ({ row }) => {
      const order = row.original.order;
      if (!order) return <span className="text-muted-foreground">-</span>;
      const orderCode = order.order_code || `#${order.id}`;
      return <span className="font-mono text-xs text-muted-foreground">{orderCode}</span>;
    }
  },
  {
    accessorKey: "user.username",
    header: "کاربر",
    cell: ({ row }) => {
      const user = row.original.order?.user || row.original.created_by || row.original.user;
      if (!user) return <span className="text-muted-foreground">-</span>;
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      return (
        <div>
          <div className="font-medium">{fullName || user.username}</div>
          <div className="text-xs text-muted-foreground font-mono" dir="ltr">{user.username}</div>
        </div>
      );
    }
  },
  {
    id: "school",
    header: "مرکز آموزشی / مدرسه",
    cell: ({ row }) => {
      const user = row.original.order?.user || row.original.created_by || row.original.user;
      const school = user?.school;
      if (!school) return <span className="text-muted-foreground/40 text-xs">—</span>;
      return (
        <div className="flex items-center gap-1.5 text-foreground text-xs font-medium">
          <School className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>{school}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "amount",
    header: "مبلغ",
    cell: ({ row }) => {
      const amount = parseInt(row.getValue("amount") || 0);
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
      const status = row.original.order?.status;
      if (!status) return <span className="text-muted-foreground">-</span>;
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
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string;
      return date ? convertToJalali(date) : "-";
    },
  },
  {
    accessorKey: "created_by.username",
    header: "ایجاد شده توسط",
    cell: ({ row }) => {
      const createdBy = row.original.created_by;
      if (!createdBy) return "-";
      return createdBy.username || "-";
    }
  },
]
