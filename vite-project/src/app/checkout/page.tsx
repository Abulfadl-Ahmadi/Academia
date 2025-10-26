"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, CreditCard, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(price);
};

export default function CheckoutPage() {
  const { cart, getCartTotal, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const navigate = useNavigate();

  const handlePurchase = async () => {
    if (!cart || cart.length === 0) return;

    setIsProcessing(true);
    
    try {
      // اینجا درخواست خرید را ارسال می‌کنیم
      const response = await axiosInstance.post('/shop/purchase/', {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      });

      if (response.status === 200 || response.status === 201) {
        setOrderSuccess(true);
        await clearCart();
        
        // Show success message for free purchases
        if (response.data.free_purchase) {
          toast.success(response.data.message || "محصولات رایگان با موفقیت خریداری شد");
        }
        
        // بعد از 3 ثانیه به صفحه محصولات کاربر می‌رویم
        setTimeout(() => {
          navigate('/dashboard/products');
        }, 3000);
      }
    } catch (error) {
      console.error('Error during purchase:', error);
      const errorResponse = error as { response?: { data?: { detail?: string } }; message?: string };
      const errorMessage = errorResponse.response?.data?.detail || errorResponse.message || 'خطای ناشناخته';
      alert(`خطا در ایجاد سفارش: ${errorMessage}`);
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
                مراجعه به فروشگاه
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

              {/* Total */}
              <div className="flex items-center justify-between text-lg font-medium">
                <span>مجموع کل:</span>
                <span className="text-xl font-bold">{formatPrice(getCartTotal())} تومان</span>
              </div>

              <Separator />

              {/* Purchase Button */}
              <Button
                onClick={handlePurchase}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? "در حال پردازش..." : `پرداخت ${formatPrice(getCartTotal())} تومان`}
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