"use client"

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, ArrowRight, Star, Clock, FileText, BookOpen, FileCheck, Tag } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/context/CartContext"
import axiosInstance from "@/lib/axios"

interface Product {
  id: number
  title: string
  description: string
  price: number
  current_price: number
  product_type: 'course' | 'file' | 'test'
  image?: string
  file?: number
  course?: number
  test?: number
  has_active_discount: boolean
  created_at: string
  creator?: {
    username: string
    first_name: string
    last_name: string
  }
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()

  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    try {
      const response = await axiosInstance.get(`/shop/products/${id}/`)
      setProduct(response.data)
    } catch (error) {
      toast.error("خطا در بارگذاری محصول")
      navigate('/shop')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    addToCart(product, quantity)
    
    toast.success(`${product.title} به سبد خرید اضافه شد`)
  }

  const getProductIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-6 h-6" />
      case 'file':
        return <FileText className="w-6 h-6" />
      case 'test':
        return <FileCheck className="w-6 h-6" />
      default:
        return <FileText className="w-6 h-6" />
    }
  }

  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case 'course':
        return 'دوره آموزشی'
      case 'file':
        return 'فایل و جزوه'
      case 'test':
        return 'آزمون'
      default:
        return type
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-4">محصول یافت نشد</h2>
          <Button onClick={() => navigate('/shop')}>
            <ArrowRight className="w-4 h-4 mr-2" />
            بازگشت به فروشگاه
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/shop')}
        className="mb-6"
      >
        <ArrowRight className="w-4 h-4 mr-2" />
        بازگشت به فروشگاه
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Image */}
        <div className="lg:col-span-2">
          <Card>
            {/* Product Image */}
            <div className="relative aspect-video overflow-hidden rounded-t-lg">
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <div className="text-center">
                    {getProductIcon(product.product_type)}
                    <p className="text-lg text-muted-foreground mt-4">{getProductTypeLabel(product.product_type)}</p>
                  </div>
                </div>
              )}
              {product.has_active_discount && (
                <div className="absolute top-4 right-4">
                  <Badge variant="destructive" className="text-sm">
                    <Tag className="w-3 h-3 mr-1" />
                    تخفیف ویژه
                  </Badge>
                </div>
              )}
            </div>
            
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="flex items-center gap-2">
                  {getProductIcon(product.product_type)}
                  {getProductTypeLabel(product.product_type)}
                </Badge>
              </div>
              <CardTitle className="text-3xl">{product.title}</CardTitle>
              <CardDescription className="text-lg">
                {product.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Product Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>تاریخ انتشار: {formatDate(product.created_at)}</span>
                  </div>
                  {product.creator && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span>مدرس: {product.creator.first_name} {product.creator.last_name}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Product Features */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">ویژگی‌های محصول</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>دسترسی نامحدود</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>پشتیبانی کامل</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>به‌روزرسانی رایگان</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>کیفیت تضمین شده</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">اطلاعات تکمیلی</h3>
                  <div className=" p-4 rounded-lg">
                    <p className="text-muted-foreground leading-relaxed">
                      این محصول با بالاترین کیفیت و مطابق با آخرین استانداردهای آموزشی تهیه شده است. 
                      پس از خرید، دسترسی کامل به محتوا خواهید داشت و می‌توانید در هر زمان و مکان از آن استفاده کنید.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>اطلاعات خرید</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg">قیمت:</span>
                  <div className="text-right">
                    {product.has_active_discount && (
                      <div className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.price)} تومان
                      </div>
                    )}
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPrice(product.current_price)} تومان
                    </div>
                  </div>
                </div>
                {product.has_active_discount && (
                  <Badge variant="secondary" className="w-fit">
                    {Math.round(((product.price - product.current_price) / product.price) * 100)}% تخفیف
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Quantity */}
              <div className="space-y-2">
                <label className="text-sm font-medium">تعداد:</label>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span>مجموع:</span>
                  <span className="font-bold">{formatPrice(product.current_price * quantity)} تومان</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>مالیات (9.9%):</span>
                  <span>{formatPrice(Math.round(product.current_price * quantity * 0.099))} تومان</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                  <span>مبلغ نهایی:</span>
                  <span className="text-blue-600">
                    {formatPrice(Math.round(product.current_price * quantity * 1.099))} تومان
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleAddToCart}
                  className="w-full"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  افزودن به سبد خرید
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/shop')}
                >
                  ادامه خرید
                </Button>
              </div>

              {/* Guarantee */}
              <div className="text-center text-sm text-muted-foreground bg-green-500/7 p-3 rounded-lg">
                <div className="font-medium text-green-700 mb-1">✅ تضمین کیفیت</div>
                <div>در صورت عدم رضایت، تا ۷ روز امکان بازگشت</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
