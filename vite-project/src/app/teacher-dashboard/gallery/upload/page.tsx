"use client"

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  Upload, 
  ArrowRight, 
  ImageIcon, 
  X,
  Loader2 
} from "lucide-react"
import { toast } from "sonner"
import axiosInstance from "@/lib/axios"

export default function UploadGalleryPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0,
    is_published: true
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('لطفاً فقط فایل‌های تصویری انتخاب کنید')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حداکثر اندازه فایل ۵ مگابایت است')
        return
      }

      setSelectedFile(file)
      
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast.error('لطفاً یک تصویر انتخاب کنید')
      return
    }

    if (!formData.title.trim()) {
      toast.error('لطفاً عنوان تصویر را وارد کنید')
      return
    }

    try {
      setLoading(true)

      // Create FormData for file upload
      const uploadData = new FormData()
      uploadData.append('image', selectedFile)
      uploadData.append('title', formData.title.trim())
      uploadData.append('description', formData.description.trim())
      uploadData.append('order', formData.order.toString())
      uploadData.append('is_published', formData.is_published.toString())

      const response = await axiosInstance.post('/gallery-images/', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      toast.success('تصویر با موفقیت آپلود شد')
      navigate('/panel/gallery')
    } catch (err: any) {
      console.error('Error uploading image:', err)
      
      if (err.response?.data?.error) {
        toast.error(err.response.data.error)
      } else if (err.response?.data?.detail) {
        toast.error(err.response.data.detail)
      } else {
        toast.error('خطا در آپلود تصویر')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          بازگشت
        </Button>
        <div>
          <h1 className="text-2xl font-bold">آپلود تصویر جدید</h1>
          <p className="text-muted-foreground">
            تصویر جدید به گالری صفحه اصلی اضافه کنید
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>انتخاب تصویر</CardTitle>
            <CardDescription>
              فایل‌های مجاز: JPG, PNG, GIF (حداکثر ۵ مگابایت)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedFile ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      فایل تصویر را بکشید و رها کنید یا کلیک کنید
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  <p>{selectedFile.name}</p>
                  <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} مگابایت</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Details */}
        <Card>
          <CardHeader>
            <CardTitle>جزئیات تصویر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان تصویر *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="عنوان تصویر را وارد کنید"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات (اختیاری)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="توضیحات تصویر را وارد کنید"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">ترتیب نمایش</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                عدد کمتر به معنای نمایش زودتر در گالری است
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
              />
              <Label htmlFor="is_published">انتشار فوری در گالری</Label>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            انصراف
          </Button>
          <Button type="submit" disabled={loading || !selectedFile}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                در حال آپلود...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 ml-2" />
                آپلود تصویر
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}