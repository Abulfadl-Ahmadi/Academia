import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import axiosInstance from "@/lib/axios"

export type GalleryImage = {
  id: number
  title: string
  description?: string
  image_url: string
  is_published: boolean
  order: number
  created_at: string
  updated_at: string
}

const handleTogglePublish = async (imageId: number, currentStatus: boolean) => {
  try {
    await axiosInstance.patch(`/gallery-images/${imageId}/`, {
      is_published: !currentStatus
    })
    
    toast.success(!currentStatus ? 'تصویر منتشر شد' : 'انتشار تصویر لغو شد')
    // Refresh the page to update the data
    window.location.reload()
  } catch (err) {
    console.error('Error toggling publish status:', err)
    toast.error('خطا در تغییر وضعیت انتشار')
  }
}

const handleDelete = async (imageId: number) => {
  if (!confirm('آیا از حذف این تصویر اطمینان دارید؟')) {
    return
  }
  
  try {
    await axiosInstance.delete(`/gallery-images/${imageId}/`)
    toast.success('تصویر حذف شد')
    // Refresh the page to update the data
    window.location.reload()
  } catch (err) {
    console.error('Error deleting image:', err)
    toast.error('خطا در حذف تصویر')
  }
}

export const columns: ColumnDef<GalleryImage>[] = [
  {
    accessorKey: "image_url",
    header: "تصویر",
    cell: ({ row }) => {
      const imageUrl = row.getValue("image_url") as string
      return (
        <div className="w-16 h-16 rounded-lg overflow-hidden border">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={row.getValue("title")} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">بدون تصویر</span>
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "title",
    header: "عنوان",
    cell: ({ row }) => {
      const title = row.getValue("title") as string
      return <div className="font-medium">{title}</div>
    },
  },
  {
    accessorKey: "description",
    header: "توضیحات",
    cell: ({ row }) => {
      const description = row.getValue("description") as string
      return (
        <div className="max-w-[200px] truncate" title={description}>
          {description || "—"}
        </div>
      )
    },
  },
  {
    accessorKey: "order",
    header: "ترتیب",
    cell: ({ row }) => {
      const order = row.getValue("order") as number
      return <div className="text-center">{order}</div>
    },
  },
  {
    accessorKey: "is_published",
    header: "وضعیت",
    cell: ({ row }) => {
      const isPublished = row.getValue("is_published") as boolean
      return (
        <Badge variant={isPublished ? "default" : "secondary"}>
          {isPublished ? "منتشر شده" : "پیش‌نویس"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "تاریخ ایجاد",
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string
      return <div>{new Date(date).toLocaleDateString('fa-IR')}</div>
    },
  },
  {
    id: "actions",
    header: "عملیات",
    cell: ({ row }) => {
      const image = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">باز کردن منو</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>عملیات</DropdownMenuLabel>
            
            <DropdownMenuItem
              onClick={() => window.open(image.image_url, '_blank')}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              مشاهده تصویر
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => window.location.href = `/panel/gallery/edit/${image.id}`}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" />
              ویرایش
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => handleTogglePublish(image.id, image.is_published)}
              className="cursor-pointer"
            >
              {image.is_published ? 'لغو انتشار' : 'انتشار'}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={() => handleDelete(image.id)}
              className="cursor-pointer text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]