"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer"
import { ShoppingCart, Search, Filter, Clock, FileText, BookOpen, FileCheck, X } from "lucide-react"
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
}

interface Discount {
  id: number
  code: string
  percentage: number
  is_available: boolean
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [loading, setLoading] = useState(true)
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null)
  const { cart, addToCart, removeFromCart, updateQuantity, getCartTotal, getCartCount, clearCart } = useCart()

  const TAX_RATE = 0.099 // 9.9%

  const filterAndSortProducts = useCallback(() => {
    let filtered = products

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by product type
    if (selectedType !== 'all') {
      filtered = filtered.filter(product => product.product_type === selectedType)
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered = [...filtered].sort((a, b) => a.current_price - b.current_price)
        break
      case 'price-high':
        filtered = [...filtered].sort((a, b) => b.current_price - a.current_price)
        break
      case 'newest':
        filtered = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filtered = [...filtered].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, selectedType, sortBy])

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, searchTerm, selectedType, sortBy, filterAndSortProducts])

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get('/shop/products/')
      
      // Handle both array and pagination format
      let productsData = [];
      if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        productsData = response.data.results;
      } else {
        console.warn("Products data is not an array:", response.data);
        productsData = [];
      }
      
      setProducts(productsData)
    } catch {
      toast.error("خطا در بارگذاری محصولات")
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: Product) => {
    addToCart(product)
    toast.success(`${product.title} به سبد خرید اضافه شد`)
  }

  const handleRemoveFromCart = (productId: number) => {
    removeFromCart(productId)
    toast.info("محصول از سبد خرید حذف شد")
  }

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId)
      return
    }
    updateQuantity(productId, quantity)
  }

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) return

    try {
      const response = await axiosInstance.post('/shop/discounts/validate_code/', {
        code: discountCode
      })

      if (response.data.is_valid) {
        setAppliedDiscount(response.data.discount)
        toast.success(`${response.data.discount.percentage}% تخفیف اعمال شد`)
      }
    } catch {
      toast.error("کد تخفیف نامعتبر است")
    }
  }

  const calculateSubtotal = () => {
    return getCartTotal()
  }

  const calculateDiscount = () => {
    if (!appliedDiscount) return 0
    return (calculateSubtotal() * appliedDiscount.percentage) / 100
  }

  const calculateTax = () => {
    const subtotal = calculateSubtotal()
    const discount = calculateDiscount()
    return (subtotal - discount) * TAX_RATE
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discount = calculateDiscount()
    const tax = calculateTax()
    return subtotal - discount + tax
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("سبد خرید خالی است")
      return
    }

    try {
      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        discount_code: appliedDiscount?.code || undefined
      }))

      // Create order
      const orderResponse = await axiosInstance.post('/finance/orders/', { items })
      const orderId = orderResponse.data.id

      toast.success("سفارش شما ایجاد شد. در حال انتقال به درگاه پرداخت...")

      // Clear cart
      clearCart()
      setAppliedDiscount(null)
      setDiscountCode('')

      // Redirect to payment page with order ID
      window.location.href = `/payment/initiate?orderId=${orderId}&amount=${calculateTotal()}`

    } catch {
      toast.error("خطا در ایجاد سفارش")
    }
  }

  const getProductIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-5 h-5" />
      case 'file':
        return <FileText className="w-5 h-5" />
      case 'test':
        return <FileCheck className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="@container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">فروشگاه</h1>
          <p className="text-muted-foreground mt-2">محصولات آموزشی با کیفیت</p>
        </div>

        <Drawer direction="left">
          <DrawerTrigger asChild>
            <Button
              className="relative"
              variant="outline"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              سبد خرید
              {getCartCount() > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                  {getCartCount()}
                </Badge>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-w-md h-full">
            <DrawerHeader className="text-right">
              <div className="flex items-center justify-between">
                <DrawerTitle className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  سبد خرید
                </DrawerTitle>
                <DrawerClose asChild>
                  <Button variant="ghost" size="sm">
                    <X className="w-4 h-4" />
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">سبد خرید خالی است</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        {/* Product Image */}
                        <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                              {getProductIcon(item.product.product_type)}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">{item.product.title}</h4>
                          <p className="text-sm text-muted-foreground">{formatPrice(item.product.current_price)} تومان</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Discount Code */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="کد تخفیف"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={validateDiscountCode}>
                        اعمال
                      </Button>
                    </div>
                    {appliedDiscount && (
                      <Badge variant="secondary" className="w-fit">
                        {appliedDiscount.percentage}% تخفیف اعمال شد
                      </Badge>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Price Summary */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>جمع کل:</span>
                      <span>{formatPrice(calculateSubtotal())} تومان</span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex justify-between text-emerald-600">
                        <span>تخفیف:</span>
                        <span>-{formatPrice(calculateDiscount())} تومان</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>مالیات (9.9%):</span>
                      <span>{formatPrice(calculateTax())} تومان</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>مبلغ نهایی:</span>
                      <span className="text-primary">{formatPrice(calculateTotal())} تومان</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    className="w-full mt-4"
                  >
                    تکمیل خرید
                  </Button>
                </>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Main Content */}
        <div>
          {/* Filters */}
          <div className=" rounded-lg shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground " />
                <Input
                  placeholder="جستجو در محصولات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="نوع محصول" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه محصولات</SelectItem>
                  <SelectItem value="course">دوره آموزشی</SelectItem>
                  <SelectItem value="file">فایل و جزوه</SelectItem>
                  <SelectItem value="test">آزمون</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="مرتب‌سازی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">جدیدترین</SelectItem>
                  <SelectItem value="oldest">قدیمی‌ترین</SelectItem>
                  <SelectItem value="price-low">ارزان‌ترین</SelectItem>
                  <SelectItem value="price-high">گران‌ترین</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground flex items-center">
                <Filter className="w-4 h-4 mr-1" />
                {filteredProducts.length} محصول
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer pt-0" onClick={() => window.location.href = `/shop/${product.id}`}>
                {/* Product Image */}
                <div className="relative aspect-video overflow-hidden rounded-t-lg">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                      <div className="text-center">
                        {getProductIcon(product.product_type)}
                        <p className="text-sm text-muted-foreground mt-2">{getProductTypeLabel(product.product_type)}</p>
                      </div>
                    </div>
                  )}
                  {product.has_active_discount && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="destructive" className="text-xs">
                        تخفیف
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getProductIcon(product.product_type)}
                      {getProductTypeLabel(product.product_type)}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {product.has_active_discount && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.price)} تومان
                        </span>
                      )}
                      <span className="text-xl font-bold text-primary">
                        {formatPrice(product.current_price)} تومان
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(product.created_at).toLocaleDateString('fa-IR')}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      className="flex-1"
                      size="sm"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      افزودن به سبد خرید
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/shop/${product.id}`;
                      }}
                    >
                      جزئیات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground  mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">محصولی یافت نشد</h3>
              <p className="text-muted-foreground">لطفاً فیلترهای خود را تغییر دهید</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}