import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";

interface Order {
  id: number;
  user: {
    username: string;
    email: string;
  };
  total_amount: number;
  status: string;
  created_at: string;
  items: Array<{
    product: {
      title: string;
      product_type: string;
    };
    quantity: number;
    price: number;
  }>;
}

interface CreateTransactionProps {
  onTransactionCreated?: () => void;
}

export default function CreateTransaction({ onTransactionCreated }: CreateTransactionProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [formData, setFormData] = useState({
    amount: "",
    payment_method: "cash",
    reference_number: "",
    description: "",
    admin_notes: "",
  });

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await axiosInstance.get("/finance/orders/pending/");
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      toast.error("خطا در دریافت سفارشات در انتظار");
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleOrderSelect = (orderId: string) => {
    if (orderId === "-") {
      setSelectedOrder(null);
      return;
    }
    const order = orders.find(o => o.id === parseInt(orderId));
    setSelectedOrder(order || null);
    if (order) {
      setFormData(prev => ({
        ...prev,
        amount: order.total_amount.toString(),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrder) {
      toast.error("لطفاً یک سفارش انتخاب کنید");
      return;
    }

    try {
      setLoading(true);
      
      const transactionData = {
        order: selectedOrder.id,
        amount: parseInt(formData.amount),
        transaction_type: "purchase",
        payment_method: formData.payment_method,
        reference_number: formData.reference_number,
        description: formData.description,
        admin_notes: formData.admin_notes,
      };

      await axiosInstance.post("/finance/transactions/", transactionData);

      toast.success("تراکنش با موفقیت ثبت شد");

      // Reset form
      setFormData({
        amount: "",
        payment_method: "cash",
        reference_number: "",
        description: "",
        admin_notes: "",
      });
      setSelectedOrder(null);

      // Refresh orders
      await fetchPendingOrders();

      // Notify parent component
      if (onTransactionCreated) {
        onTransactionCreated();
      }

    } catch (error: any) {
      console.error("Error creating transaction:", error);
      toast.error(error.response?.data?.message || "خطا در ثبت تراکنش");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ایجاد تراکنش جدید</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Selection */}
            <div className="space-y-2">
              <Label htmlFor="order">انتخاب سفارش</Label>
              <Select onValueChange={handleOrderSelect} value={selectedOrder?.id.toString() || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="سفارش را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {ordersLoading ? (
                    <SelectItem value="-" disabled>در حال بارگذاری...</SelectItem>
                  ) : orders.length === 0 ? (
                    <SelectItem value="-" disabled>سفارش در انتظاری یافت نشد</SelectItem>
                  ) : (
                    orders.map((order) => (
                      <SelectItem key={order.id} value={order.id.toString()}>
                        سفارش #{order.id} - {order.user.username} - {formatPrice(order.total_amount)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Order Details */}
            {selectedOrder && (
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-3">جزئیات سفارش انتخاب شده:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>کاربر:</span>
                      <span>{selectedOrder.user.username} ({selectedOrder.user.email})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>مبلغ کل:</span>
                      <span className="font-medium">{formatPrice(selectedOrder.total_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>تاریخ سفارش:</span>
                      <span>{formatDate(selectedOrder.created_at)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <span className="font-medium">محصولات:</span>
                      <div className="mt-1 space-y-1">
                        {selectedOrder.items.map((item, index) => (
                          <div key={index} className="text-xs text-muted-foreground">
                            {item.product.title} ({item.product.product_type}) - {item.quantity} عدد
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">مبلغ (تومان)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="مبلغ را وارد کنید"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">روش پرداخت</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقدی</SelectItem>
                    <SelectItem value="bank_transfer">انتقال بانکی</SelectItem>
                    <SelectItem value="credit_card">کارت اعتباری</SelectItem>
                    <SelectItem value="online_payment">پرداخت آنلاین</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_number">شماره مرجع</Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                placeholder="شماره فاکتور، رسید یا مرجع بانکی"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="توضیحات تراکنش"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_notes">یادداشت ادمین</Label>
              <Textarea
                id="admin_notes"
                value={formData.admin_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                placeholder="یادداشت‌های داخلی (اختیاری)"
                rows={3}
              />
            </div>

            <Button type="submit" disabled={loading || !selectedOrder} className="w-full">
              {loading ? "در حال ثبت..." : "ثبت تراکنش"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
