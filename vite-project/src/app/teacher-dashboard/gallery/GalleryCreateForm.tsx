import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import axiosInstance from "@/lib/axios"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

type GalleryFormProps = {
  onSuccess: (newImage: unknown) => void
  onClose?: () => void
  context?: "dialog" | "drawer"
}

export default function GalleryCreateForm({ onSuccess, onClose }: GalleryFormProps) {
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      is_published: true,
      order: 0,
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setFileError("لطفا یک فایل تصویری انتخاب کنید")
        setSelectedFile(null)
        setPreviewUrl(null)
        return
      }

      setSelectedFile(file)
      setFileError(null)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreateGalleryImage = async (data: {
    title: string;
    description: string;
    is_published: boolean;
    order: number;
  }) => {
    // Check if file is selected
    if (!selectedFile) {
      setFileError("لطفا یک تصویر انتخاب کنید")
      return
    }

    setLoading(true)
    try {
      const uploadData = new FormData()
      uploadData.append("image", selectedFile)
      uploadData.append("title", data.title)
      if (data.description) uploadData.append("description", data.description)
      uploadData.append("is_published", data.is_published.toString())
      uploadData.append("order", data.order.toString())

      console.log("FormData contents:")
      for (const [key, value] of uploadData.entries()) {
        console.log(key, value)
      }

      const response = await axiosInstance.post("/gallery-images/", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      onSuccess(response.data)
      form.reset()
      setSelectedFile(null)
      setPreviewUrl(null)
      setFileError(null)
      onClose?.()
      toast.success("تصویر با موفقیت اضافه شد")
    } catch (error: unknown) {
      console.error("Error creating gallery image:", error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: Record<string, string[]> } }
        if (axiosError.response?.data) {
          // Handle specific field errors
          const errors = axiosError.response.data
          Object.keys(errors).forEach(field => {
            if (errors[field] && Array.isArray(errors[field])) {
              toast.error(`${field}: ${errors[field].join(", ")}`)
            }
          })
        } else {
          toast.error("خطا در اضافه کردن تصویر")
        }
      } else {
        toast.error("خطا در اضافه کردن تصویر")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleCreateGalleryImage)} className="space-y-4">
      <div>
        <Label htmlFor="image">انتخاب تصویر *</Label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-1"
        />
        {fileError && (
          <p className="text-sm text-red-500 mt-1">
            {fileError}
          </p>
        )}
      </div>

      {previewUrl && (
        <div>
          <Label>پیش‌نمایش</Label>
          <div className="mt-1 border rounded-lg overflow-hidden">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-48 object-cover"
            />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="title">عنوان *</Label>
        <Input
          id="title"
          placeholder="عنوان تصویر"
          {...form.register("title")}
          className="mt-1"
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500 mt-1">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description">توضیحات</Label>
        <Textarea
          id="description"
          placeholder="توضیحات تصویر (اختیاری)"
          {...form.register("description")}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="order">ترتیب نمایش</Label>
        <Input
          id="order"
          type="number"
          min="0"
          placeholder="0"
          {...form.register("order", { valueAsNumber: true })}
          className="mt-1"
        />
        {form.formState.errors.order && (
          <p className="text-sm text-red-500 mt-1">
            {form.formState.errors.order.message}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_published"
          checked={form.watch("is_published")}
          onCheckedChange={(checked) => form.setValue("is_published", !!checked)}
        />
        <Label htmlFor="is_published">منتشر شود</Label>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "در حال اضافه کردن..." : "اضافه کردن تصویر"}
      </Button>
    </form>
  )
}