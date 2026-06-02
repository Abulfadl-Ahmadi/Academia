// src/app/panel/groups/columns.ts
import { type ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Download, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// @ts-ignore
import moment from 'moment-jalaali'

function convertToJalali(isoDate: string): string {
  return moment(isoDate).format('jYYYY/jMM/jDD HH:mm')
}


export type File = {
  id: number
  file_id: string
  title: string
  file: string
  // file_type: string
  st_group: string
  create_at: string // Assuming this is the username of the teacher
  class_session: string // Assuming this is the username of the teacher
}

export const columns: ColumnDef<File>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="px-1">
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
      <div className="px-1">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="انتخاب سطر"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "name",
    header: "نام فایل",
    cell: ({ row }) => {
      const file = row.original.file;
      const fileName = row.original.title;
      return fileName ? (
        <a
          href={`${file}`}
          className="text-blue-600 underline hover:text-blue-800 max-w-[200px] truncate block"
          title={fileName}
        >
          {fileName}
        </a>
      ) : (
        <span>—</span>
      );
    },
  },
  {
    accessorKey: "create_at",
    header: "تاریخ آپلود",
    cell: ({ row }) => {
      const createAt = row.original.create_at;
      return createAt ? (
        <p>
          {convertToJalali(createAt)}
        </p>
      ) : (
        <span>—</span>
      );
    },
  },
  {
    accessorKey: "st_group",
    header: "کلاس",
    cell: ({ row }) => {
      return <span className="truncate max-w-[150px] block">{row.original.st_group || "—"}</span>;
    },
  },
  {
    accessorKey: "class_session",
    header: "جلسه",
    cell: ({ row }) => {
      return <span className="truncate max-w-[150px] block">{row.original.class_session || "—"}</span>;
    },
  },
  {
    id: "actions",
    header: "عملیات",
    cell: ({ row, table }) => {
      const file = row.original;
      const meta = table.options.meta as { handleEdit?: (file: File) => void; handleDelete?: (id: number) => void } | undefined;
      const handleEdit = meta?.handleEdit;
      const handleDelete = meta?.handleDelete;
      
      return (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-6 w-6 p-0">
                <span className="sr-only">منوی عملیات</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>عملیات</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => file.file && window.open(file.file, '_blank')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> دانلود
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleEdit?.(file)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" /> ویرایش
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDelete?.(file.id)}
                className="flex items-center gap-2 text-red-600"
              >
                <Trash2 className="h-4 w-4" /> حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
]
