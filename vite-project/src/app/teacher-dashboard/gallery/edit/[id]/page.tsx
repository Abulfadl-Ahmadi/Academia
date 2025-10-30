"use client"

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  Save, 
  ArrowRight, 
  ImageIcon, 
  X,
  Loader2,
  Upload 
} from "lucide-react"
import { toast } from "sonner"
import axiosInstance from "@/lib/axios"

interface GalleryImage {
  id: number
  title: string
  description?: string
  image: string
  is_published: boolean
  created_at: string
  updated_at: string
  order: number
}

export default function EditGalleryPage() {
  const navigate = useNavigate()
  const params = useParams()
  const imageId = params.id

  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [image, setImage] = useState<GalleryImage | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0,
    is_published: true
  })

  useEffect(() => {
    if (imageId) {
      fetchImage()
    }
  }, [imageId])

  const fetchImage = async () => {
    try {
      setFetchLoading(true)
      const response = await axiosInstance.get(`/gallery-images/${imageId}/`)
      const imageData = response.data
      
      setImage(imageData)
      setFormData({
        title: imageData.title || '',
        description: imageData.description || '',
        order: imageData.order || 0,
        is_published: imageData.is_published ?? true
      })
    } catch (err) {
      console.error('Error fetching image:', err)
      toast.error('خطا در بارگیری اطلاعات تصویر')
      navigate('/panel/gallery')
    } finally {
      setFetchLoading(false)
    }
  }

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

    if (!formData.title.trim()) {
      toast.error('لطفاً عنوان تصویر را وارد کنید')
      return
    }

    try {
      setLoading(true)

      // Create FormData for file upload
      const uploadData = new FormData()
      
      // Only include image if a new file is selected
      if (selectedFile) {
        uploadData.append('image', selectedFile)
      }
      
      uploadData.append('title', formData.title.trim())
      uploadData.append('description', formData.description.trim())
      uploadData.append('order', formData.order.toString())
      uploadData.append('is_published', formData.is_published.toString())

      await axiosInstance.patch(`/gallery-images/${imageId}/`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      toast.success('تصویر با موفقیت به‌روزرسانی شد')
      navigate('/panel/gallery')
    } catch (err: any) {
      console.error('Error updating image:', err)
      
      if (err.response?.data?.error) {
        toast.error(err.response.data.error)
      } else if (err.response?.data?.detail) {
        toast.error(err.response.data.detail)
      } else {
        toast.error('خطا در به‌روزرسانی تصویر')
      }
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>در حال بارگیری اطلاعات تصویر...</p>
        </div>
      </div>
    )
  }

  if (!image) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600">تصویر مورد نظر یافت نشد</p>
        <Button onClick={() => navigate('/panel/gallery')} className="mt-4">
          بازگشت به گالری
        </Button>
      </div>
    )
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
          <h1 className="text-2xl font-bold">ویرایش تصویر</h1>
          <p className="text-muted-foreground">
            ویرایش اطلاعات تصویر در گالری
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Image */}
        <Card>
          <CardHeader>
            <CardTitle>تصویر فعلی</CardTitle>
            <CardDescription>
              برای تغییر تصویر، فایل جدید انتخاب کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <img
                src={selectedFile ? previewUrl : image.image}
                alt={image.title}
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
              
              {!selectedFile ? (
                <div className="text-center">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="max-w-xs mx-auto"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    فایل‌های مجاز: JPG, PNG, GIF (حداکثر ۵ مگابایت)
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4 ml-2" />
                      حذف تصویر جدید
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{selectedFile.name}</p>
                    <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} مگابایت</p>
                  </div>
                </div>
              )}
            </div>
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
              <Label htmlFor="is_published">انتشار در گالری</Label>
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
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ml-2" />
                ذخیره تغییرات
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}