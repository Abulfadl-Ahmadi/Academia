import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { Search, Filter, Download } from "lucide-react";

interface Transaction {
  id: number;
  order: {
    id: number;
    user: {
      username: string;
      email: string;
    };
    total_amount: number;
    status: string;
    created_at: string;
  };
  amount: number;
  transaction_type: string;
  payment_method: string;
  reference_number: string;
  description: string;
  admin_notes: string;
  created_at: string;
  created_by: {
    username: string;
  };
}

export default function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    payment_method: "",
    transaction_type: "",
    status: "",
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/finance/transactions/");
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("خطا در دریافت تراکنش‌ها");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(transaction =>
        transaction.order.user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
        transaction.order.user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        transaction.reference_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
        transaction.order.id.toString().includes(filters.search)
      );
    }

    // Payment method filter
    if (filters.payment_method) {
      filtered = filtered.filter(transaction =>
        transaction.payment_method === filters.payment_method
      );
    }

    // Transaction type filter
    if (filters.transaction_type) {
      filtered = filtered.filter(transaction =>
        transaction.transaction_type === filters.transaction_type
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(transaction =>
        transaction.order.status === filters.status
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    if (value === "-") {
      setFilters(prev => ({ ...prev, [key]: "" }));
      return;
    }
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      payment_method: "",
      transaction_type: "",
      status: "",
    });
  };

  const exportTransactions = () => {
    const csvContent = [
      ["شماره تراکنش", "شماره سفارش", "کاربر", "مبلغ", "روش پرداخت", "وضعیت", "تاریخ"],
      ...filteredTransactions.map(t => [
        t.id.toString(),
        t.order.id.toString(),
        t.order.user.username,
        t.amount.toString(),
        getPaymentMethodLabel(t.payment_method),
        getStatusLabel(t.order.status),
        formatDate(t.created_at)
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "نقدی",
      bank_transfer: "انتقال بانکی",
      credit_card: "کارت اعتباری",
      online_payment: "پرداخت آنلاین",
    };
    return labels[method] || method;
  };

  // const getTransactionTypeLabel = (type: string) => {
  //   const labels: Record<string, string> = {
  //     purchase: "خرید",
  //     refund: "بازپرداخت",
  //     credit: "اعتبار",
  //     debit: "بدهی",
  //   };
  //   return labels[type] || type;
  // };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "در انتظار",
      confirmed: "تأیید شده",
      paid: "پرداخت شده",
      cancelled: "لغو شده",
      refunded: "بازپرداخت شده",
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      confirmed: "secondary",
      paid: "default",
      cancelled: "destructive",
      refunded: "secondary",
    };
    return variants[status] || "default";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>لیست تراکنش‌ها</span>
            <Button onClick={exportTransactions} variant="outline" size="sm">
              <Download className="w-4 h-4 ml-2" />
              خروجی CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="search">جستجو</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="جستجو در کاربر، ایمیل، شماره مرجع..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">روش پرداخت</Label>
              <Select
                value={filters.payment_method}
                onValueChange={(value) => handleFilterChange("payment_method", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="همه روش‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">همه روش‌ها</SelectItem>
                  <SelectItem value="cash">نقدی</SelectItem>
                  <SelectItem value="bank_transfer">انتقال بانکی</SelectItem>
                  <SelectItem value="credit_card">کارت اعتباری</SelectItem>
                  <SelectItem value="online_payment">پرداخت آنلاین</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_type">نوع تراکنش</Label>
              <Select
                value={filters.transaction_type}
                onValueChange={(value) => handleFilterChange("transaction_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="همه انواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">همه انواع</SelectItem>
                  <SelectItem value="purchase">خرید</SelectItem>
                  <SelectItem value="refund">بازپرداخت</SelectItem>
                  <SelectItem value="credit">اعتبار</SelectItem>
                  <SelectItem value="debit">بدهی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">وضعیت سفارش</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="همه وضعیت‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="confirmed">تأیید شده</SelectItem>
                  <SelectItem value="paid">پرداخت شده</SelectItem>
                  <SelectItem value="cancelled">لغو شده</SelectItem>
                  <SelectItem value="refunded">بازپرداخت شده</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={clearFilters} variant="outline" className="w-full">
                <Filter className="w-4 h-4 ml-2" />
                پاک کردن فیلترها
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-right">شماره تراکنش</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">شماره سفارش</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">کاربر</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">مبلغ</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">روش پرداخت</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">وضعیت سفارش</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">تاریخ</th>
                  <th className="border border-gray-200 px-4 py-2 text-right">ایجاد شده توسط</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                      تراکنشی یافت نشد
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        #{transaction.id}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        #{transaction.order.id}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        <div>
                          <div className="font-medium">{transaction.order.user.username}</div>
                          <div className="text-sm text-gray-500">{transaction.order.user.email}</div>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right font-medium">
                        {formatPrice(transaction.amount)}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        {getPaymentMethodLabel(transaction.payment_method)}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        <Badge variant={getStatusVariant(transaction.order.status)}>
                          {getStatusLabel(transaction.order.status)}
                        </Badge>
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right">
                        {transaction.created_by.username}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {filteredTransactions.length}
                </div>
                <div className="text-sm text-gray-600">کل تراکنش‌ها</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(
                    filteredTransactions
                      .filter(t => t.transaction_type === "purchase")
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </div>
                <div className="text-sm text-gray-600">مجموع خریدها</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatPrice(
                    filteredTransactions
                      .filter(t => t.transaction_type === "refund")
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </div>
                <div className="text-sm text-gray-600">مجموع بازپرداخت‌ها</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
