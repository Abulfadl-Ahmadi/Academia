import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tableHeaders } from "@/constants/persian-text";

// @ts-expect-error - moment-jalaali doesn't have proper types
import moment from 'moment-jalaali';

function convertToJalali(isoDate: string): string {
  return moment(isoDate).format('jYYYY/jMM/jDD HH:mm');
}

export type Product = {
  id: number;
  title: string;
  description: string;
  product_type: string;
  price: number;
  image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sales_count?: number;
  // Physical product fields
  weight?: number;
  dimensions?: string;
  stock_quantity?: number;
  requires_shipping?: boolean;
  shipping_cost?: number;
};

export const createColumns = (onEdit: (id: number) => void, onDelete: (id: number) => void): ColumnDef<Product>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="px-2">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="انتخاب همه"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="px-2">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="انتخاب سطر"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: () => <span className="font-iransans">{tableHeaders.title}</span>,
    cell: ({ row }) => <div className="font-medium font-iransans">{row.getValue("title")}</div>,
  },
  {
    accessorKey: "product_type",
    header: () => <span className="font-iransans">{tableHeaders.productType}</span>,
    cell: ({ row }) => {
      const type = row.getValue("product_type") as string;
      const isPhysical = ["book", "notebook", "pamphlet", "stationery"].includes(type);
      
      return (
        <div className="product-type-cell font-iransans text-right" dir="rtl">
          <div className="flex items-center gap-2">
            <span>
              {type === "course" && "دوره آموزشی"}
              {type === "file" && "فایل"}
              {type === "test" && "آزمون"}
              {type === "book" && "کتاب"}
              {type === "notebook" && "دفتر"}
              {type === "pamphlet" && "جزوه"}
              {type === "stationery" && "لوازم تحریر"}
              {!["course", "file", "test", "book", "notebook", "pamphlet", "stationery"].includes(type) && type}
            </span>
            {isPhysical && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                فیزیکی
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: () => <span className="font-iransans">{tableHeaders.price}</span>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      const formatted = new Intl.NumberFormat("fa-IR").format(price);
      return <div className="font-iransans">{formatted}</div>;
    },
  },
  {
    accessorKey: "is_active",
    header: () => <span className="font-iransans">{tableHeaders.status}</span>,
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean;
      return isActive ? (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 font-iransans">فعال</Badge>
      ) : (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 font-iransans">غیرفعال</Badge>
      );
    },
  },
  {
    accessorKey: "sales_count",
    header: () => <span className="font-iransans">{tableHeaders.salesCount}</span>,
    cell: ({ row }) => {
      const salesCount = row.getValue("sales_count") as number;
      return <div className="font-iransans">{salesCount || 0}</div>;
    },
  },
  {
    accessorKey: "stock_quantity",
    header: () => <span className="font-iransans">موجودی</span>,
    cell: ({ row }) => {
      const type = row.getValue("product_type") as string;
      const isPhysical = ["book", "notebook", "pamphlet", "stationery"].includes(type);
      const stock = row.getValue("stock_quantity") as number;
      
      if (!isPhysical) {
        return <div className="font-iransans text-muted-foreground">—</div>;
      }
      
      return (
        <div className="font-iransans">
          <span className={stock <= 5 ? "text-red-600" : stock <= 20 ? "text-yellow-600" : "text-green-600"}>
            {stock || 0}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: () => <span className="font-iransans">{tableHeaders.createdAt}</span>,
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string;
      return <div className="font-iransans">{date ? convertToJalali(date) : "—"}</div>;
    },
  },
  {
    id: "actions",
    header: () => <span className="font-iransans">{tableHeaders.actions}</span>,
    cell: ({ row }) => {
      const product = row.original;
      
      return (
        <div className="flex justify-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 ml-auto">
                <span className="sr-only">منوی عملیات</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>عملیات</DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => window.location.href = `/shop/products/${product.id}`}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" /> مشاهده
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onEdit(product.id)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" /> ویرایش
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(product.id)}
              className="text-red-600 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" /> حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      );
    },
  }
];
