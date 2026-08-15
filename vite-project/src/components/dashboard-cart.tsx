"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Trash2, Plus, Minus, Tag, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { couponsApi, type ValidateCouponResponse } from "@/api/coupons";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(price);
};

const TAX_RATE = 0.10; // 10%

export default function DashboardCart() {
  const { cart, updateQuantity, removeFromCart, getCartTotal, loading, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<ValidateCouponResponse | null>(null);

  const navigate = useNavigate();

  const subtotal = getCartTotal();
  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const tax = Math.max(0, subtotal - discountAmount) * TAX_RATE;
  const finalTotal = Math.max(0, subtotal - discountAmount) + tax;

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) {
      toast.error("لطفاً کد تخفیف را وارد کنید");
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const productIds = cart.map(item => item.product.id);
      const res = await couponsApi.validateCoupon({
        code: couponCodeInput.trim(),
        product_ids: productIds,
        total_amount: subtotal,
      });

      if (res.valid) {
        setAppliedCoupon(res);
        toast.success(`کد تخفیف ${res.code} اعمال شد`);
      }
    } catch (error: any) {
      console.error("Error applying coupon:", error);
      const errMsg = error.response?.data?.error || "کد تخفیف معتبر نیست";
      toast.error(errMsg);
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    toast.info("کد تخفیف حذف شد");
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("سبد خرید خالی است");
      return;
    }

    setIsCheckingOut(true);
    try {
      const payload: any = {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      };

      if (appliedCoupon) {
        payload.coupon_code = appliedCoupon.code;
      }

      const response = await axiosInstance.post('/shop/purchase/', payload);

      if (response.data.payment_url) {
        toast.success(response.data.message || "در حال انتقال به درگاه پرداخت...");
        setTimeout(() => {
          window.open(response.data.payment_url, '_self');
        }, 1500);
      } else if (response.data.free_purchase) {
        toast.success(response.data.message || "محصولات با موفقیت ثبت شد");
        await clearCart();
        setTimeout(() => {
          navigate('/panel');
        }, 2000);
      } else {
        toast.success(response.data.message || "سفارش شما ثبت شد");
        await clearCart();
      }

    } catch (error: any) {
      const errorResponse = error as { response?: { status?: number; data?: { error?: string; message?: string; redirect_to?: string } } };
      
      if (errorResponse.response?.data?.error === 'incomplete_address' || 
          errorResponse.response?.data?.error === 'missing_address') {
        toast.error(errorResponse.response.data.message || "اطلاعات آدرس کامل نیست");
        if (errorResponse.response.data.redirect_to) {
          setTimeout(() => {
            navigate(errorResponse.response.data.redirect_to!);
          }, 2000);
        }
      } else {
        toast.error(errorResponse.response?.data?.error || "خطا در تکمیل خرید");
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

          {/* Coupon input */}
          <div className="pt-1">
            <h4 className="text-xs font-medium mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-primary" />
              کد تخفیف
            </h4>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded text-xs">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-mono">
                    {appliedCoupon.code}
                  </Badge>
                  <span>
                    ({appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}٪` : `${formatPrice(appliedCoupon.discount_value)} ت`})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="h-6 px-1 text-red-600 hover:text-red-700"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <Input
                  placeholder="کد تخفیف..."
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  className="h-9 font-mono uppercase text-xs"
                />
                <Button
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon || !couponCodeInput.trim()}
                  variant="secondary"
                  size="sm"
                  className="h-9 px-3 text-xs"
                >
                  {isValidatingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : "اعمال"}
                </Button>
              </div>
            )}
          </div>

          <Separator />
          
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>مبلغ کل:</span>
              <span>{formatPrice(subtotal)} تومان</span>
            </div>

            {appliedCoupon && (
              <div className="flex items-center justify-between text-emerald-600 text-xs font-medium">
                <span>سود شما از تخفیف:</span>
                <span>{formatPrice(discountAmount)}- تومان</span>
              </div>
            )}

            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>مالیات ({TAX_RATE * 100}%):</span>
              <span>{formatPrice(tax)} تومان</span>
            </div>

            <div className="flex items-center justify-between py-2 text-base font-bold">
              <span>مبلغ نهایی:</span>
              <span className="text-primary">{formatPrice(finalTotal)} تومان</span>
            </div>
          </div>
          
          <Button 
            onClick={handleCheckout}
            disabled={isCheckingOut || cart.length === 0}
            className="w-full"
            size="lg"
          >
            {isCheckingOut ? "در حال پردازش..." : `تکمیل خرید (${formatPrice(finalTotal)} تومان)`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}