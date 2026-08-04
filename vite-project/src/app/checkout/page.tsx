"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, CreditCard, CheckCircle, Tag, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { couponsApi, type ValidateCouponResponse } from "@/api/coupons";
import { toast } from "sonner";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(price);
};

export default function CheckoutPage() {
  const { cart, getCartTotal, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<ValidateCouponResponse | null>(null);

  const navigate = useNavigate();

  const subtotal = getCartTotal();
  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

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
        toast.success(`کد تخفیف ${res.code} با موفقیت اعمال شد!`);
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

  const handlePurchase = async () => {
    if (!cart || cart.length === 0) return;

    setIsProcessing(true);

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

      if (response.status === 200 || response.status === 201) {
        setOrderSuccess(true);
        await clearCart();

        if (response.data.free_purchase) {
          toast.success(response.data.message || "محصولات با موفقیت ثبت‌نام شد");
        } else if (response.data.payment_url) {
          window.location.href = response.data.payment_url;
          return;
        }

        setTimeout(() => {
          navigate('/dashboard/products');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error during purchase:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'خطای ناشناخته';
      toast.error(`خطا در ایجاد سفارش: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-600 mb-2">خرید موفق!</h2>
              <p className="text-muted-foreground mb-4">
                سفارش شما با موفقیت ثبت شد. در حال انتقال به صفحه محصولات...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              سبد خرید خالی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                سبد خرید شما خالی است. برای خرید به فروشگاه مراجعه کنید.
              </p>
              <Button onClick={() => navigate('/shop')}>
                مراجع به فروشگاه
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              تکمیل خرید
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Order Summary */}
              <div>
                <h3 className="text-lg font-medium mb-4">خلاصه سفارش</h3>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.product.image && (
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <h4 className="font-medium">{item.product.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            تعداد: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">
                          {formatPrice(item.total)} تومان
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Coupon Input Box */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-primary" />
                  کد تخفیف دارید؟
                </h4>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-mono text-sm">
                        {appliedCoupon.code}
                      </Badge>
                      <span className="text-xs text-emerald-700">
                        {appliedCoupon.discount_type === "percentage"
                          ? `(${appliedCoupon.discount_value}٪ تخفیف)`
                          : `(${formatPrice(appliedCoupon.discount_value)} تومان تخفیف)`}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveCoupon}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                    >
                      <X className="w-4 h-4 ml-1" />
                      حذف کد
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="کد تخفیف را وارد کنید..."
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      className="font-mono uppercase"
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponCodeInput.trim()}
                      variant="secondary"
                    >
                      {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "اعمال کد"}
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>مبلغ اولیه:</span>
                  <span>{formatPrice(subtotal)} تومان</span>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-emerald-600 font-medium">
                    <span>تخفیف:</span>
                    <span>{formatPrice(discountAmount)}- تومان</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-lg font-bold text-foreground pt-2">
                  <span>مبلغ قابل پرداخت:</span>
                  <span className="text-xl text-primary">{formatPrice(finalTotal)} تومان</span>
                </div>
              </div>

              <Separator />

              {/* Purchase Button */}
              <Button
                onClick={handlePurchase}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? "در حال پردازش..." : `پرداخت ${formatPrice(finalTotal)} تومان`}
              </Button>

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={isProcessing}
                >
                  بازگشت
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}