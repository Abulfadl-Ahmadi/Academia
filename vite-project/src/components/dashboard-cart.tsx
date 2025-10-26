"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(price);
};

export default function DashboardCart() {
  const { cart, updateQuantity, removeFromCart, getCartTotal, loading, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const navigate = useNavigate();

  // Debug log
  console.log('Dashboard Cart - cart:', cart, 'loading:', loading);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("سبد خرید خالی است")
      return
    }

    setIsCheckingOut(true);
    try {
      // Use same checkout logic as shop page
      const response = await axiosInstance.post('/shop/purchase/', {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      })

      // Success
      if (response.data.payment_url) {
        // Redirect to payment gateway
        toast.success(response.data.message || "در حال انتقال به درگاه پرداخت...")
        
        setTimeout(() => {
          window.open(response.data.payment_url, '_self')
        }, 1500)
      } else if (response.data.free_purchase) {
        // Free purchase - no payment needed
        toast.success(response.data.message || "محصولات رایگان با موفقیت خریداری شد")
        // Clear cart immediately for free purchases
        await clearCart()
        // Optionally redirect to purchased products page or dashboard
        setTimeout(() => {
          navigate('/panel') // or wherever purchased products are shown
        }, 2000)
      } else {
        // Other success cases (shouldn't happen with current logic)
        toast.success(response.data.message || "سفارش شما با موفقیت ثبت شد")
        // Only clear cart if no payment_url (immediate success)
        await clearCart()
      }

    } catch (error) {
      const errorResponse = error as { response?: { status?: number; data?: { error?: string; message?: string; redirect_to?: string } } }
      
      // Handle address validation errors
      if (errorResponse.response?.data?.error === 'incomplete_address' || 
          errorResponse.response?.data?.error === 'missing_address') {
        toast.error(errorResponse.response.data.message || "اطلاعات آدرس کامل نیست")
        
        // Redirect to address page
        if (errorResponse.response.data.redirect_to) {
          setTimeout(() => {
            navigate(errorResponse.response.data.redirect_to!)
          }, 2000)
        }
      } else {
        toast.error(errorResponse.response?.data?.error || "خطا در تکمیل خرید")
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            سبد خرید
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-muted-foreground mt-2">در حال بارگذاری...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            سبد خرید
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">سبد خرید خالی است</h3>
            <p className="text-sm text-muted-foreground mb-4">
              برای افزودن محصول به سبد خرید، به فروشگاه مراجعه کنید.
            </p>
            <Button onClick={() => navigate("/shop")} variant="outline">
              مراجعه به فروشگاه
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          سبد خرید
          <Badge variant="secondary">{cart.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-4 p-4 border rounded-lg">
              {item.product.image && (
                <img
                  src={item.product.image}
                  alt={item.product.title}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium">{item.product.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(item.product.current_price)} تومان
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={() => removeFromCart(item.product.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          <Separator />
          
          <div className="flex items-center justify-between py-4">
            <span className="text-lg font-medium">مجموع:</span>
            <span className="text-xl font-bold">{formatPrice(getCartTotal())} تومان</span>
          </div>
          
          <Button 
            onClick={handleCheckout}
            disabled={isCheckingOut || cart.length === 0}
            className="w-full"
            size="lg"
          >
            {isCheckingOut ? "در حال پردازش..." : "تکمیل خرید"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}