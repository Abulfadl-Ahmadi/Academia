import { useState, useEffect, useCallback, useRef } from "react";
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
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { Search, Filter, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { columns, type Transaction } from "./columns";
import { getStatusLabel, getPaymentMethodLabel, formatDate, formatPrice } from "./utils";
import * as XLSX from "xlsx";

const PAGE_SIZE = 30;

export default function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Global stats for current filter
  const [stats, setStats] = useState({
    total_count: 0,
    total_purchases: 0,
    total_refunds: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    payment_method: "",
    transaction_type: "",
    status: "",
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const observerTarget = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [filters.search]);

  // Fetch stats based on current filters
  const fetchStats = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.payment_method && filters.payment_method !== "-") params.payment_method = filters.payment_method;
      if (filters.transaction_type && filters.transaction_type !== "-") params.transaction_type = filters.transaction_type;
      if (filters.status && filters.status !== "-") params.status = filters.status;

      const res = await axiosInstance.get("/finance/transactions/stats/", { params });
      if (res.data) {
        setStats({
          total_count: res.data.total_count || 0,
          total_purchases: res.data.total_purchases || 0,
          total_refunds: res.data.total_refunds || 0,
        });
      }
    } catch {
      // Best-effort stats
    }
  }, [debouncedSearch, filters.payment_method, filters.transaction_type, filters.status]);

  // Fetch transactions (page-based)
  const fetchPage = useCallback(
    async (pageToFetch: number, isReset = false) => {
      if (isReset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params: Record<string, string | number> = {
          page: pageToFetch,
          page_size: PAGE_SIZE,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (filters.payment_method && filters.payment_method !== "-") params.payment_method = filters.payment_method;
        if (filters.transaction_type && filters.transaction_type !== "-") params.transaction_type = filters.transaction_type;
        if (filters.status && filters.status !== "-") params.status = filters.status;

        const response = await axiosInstance.get("/finance/transactions/", { params });

        let results: Transaction[] = [];
        let nextUrl: string | null = null;

        if (Array.isArray(response.data)) {
          results = response.data;
        } else if (response.data && Array.isArray(response.data.results)) {
          results = response.data.results;
          nextUrl = response.data.next;
        } else if (response.data && Array.isArray(response.data.data)) {
          results = response.data.data;
        }

        setTransactions((prev) => {
          if (isReset) {
            return results;
          }
          const existingIds = new Set(prev.map((t) => t.id));
          const uniqueNew = results.filter((t) => !existingIds.has(t.id));
          return [...prev, ...uniqueNew];
        });

        setPage(pageToFetch);
        setHasMore(Boolean(nextUrl) && results.length > 0);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("خطا در دریافت تراکنش‌ها");
        if (isReset) {
          setTransactions([]);
        }
      } finally {
        if (isReset) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [debouncedSearch, filters.payment_method, filters.transaction_type, filters.status]
  );

  // Trigger reset on filter or search change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPage(1, true);
    fetchStats();
  }, [debouncedSearch, filters.payment_method, filters.transaction_type, filters.status, fetchPage, fetchStats]);

  // Infinite scroll intersection observer attached to table container
  useEffect(() => {
    const rootElem = tableContainerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchPage(page + 1, false);
        }
      },
      { root: rootElem, threshold: 0.1, rootMargin: "150px" }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, page, fetchPage]);

  // Handle scroll inside fixed table container
  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 150) {
      if (hasMore && !loading && !loadingMore) {
        fetchPage(page + 1, false);
      }
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value === "-" ? "" : value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      payment_method: "",
      transaction_type: "",
      status: "",
    });
  };

  // Build export rows
  const buildExportRows = (dataset: Transaction[]) => {
    const headers = [
      "شماره تراکنش",
      "شماره سفارش",
      "کاربر",
      "مرکز آموزشی / مدرسه",
      "مبلغ",
      "روش پرداخت",
      "وضعیت",
      "تاریخ",
    ];
    const rows = dataset.map((t) => {
      const user = t.order?.user || t.created_by || t.user || {};
      const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
      const orderId = t.order?.order_code || (t.order?.id ? `#${t.order.id}` : "-");
      const status = t.order?.status || "";
      const school = user.school || "-";
      return [
        (t.transaction_code || t.id).toString(),
        orderId,
        fullName || user.username || "-",
        school,
        (t.amount || 0).toString(),
        getPaymentMethodLabel(t.payment_method),
        getStatusLabel(status),
        formatDate(t.created_at),
      ];
    });
    return [headers, ...rows];
  };

  // Fetch all filtered records for export if needed
  const getAllFilteredTransactions = async (): Promise<Transaction[]> => {
    if (transactions.length >= stats.total_count && stats.total_count > 0) {
      return transactions;
    }
    try {
      setExporting(true);
      toast.info("در حال آماده‌سازی فایل خروجی کامل...");
      const params: Record<string, string | number> = {
        page_size: 5000,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.payment_method && filters.payment_method !== "-") params.payment_method = filters.payment_method;
      if (filters.transaction_type && filters.transaction_type !== "-") params.transaction_type = filters.transaction_type;
      if (filters.status && filters.status !== "-") params.status = filters.status;

      const res = await axiosInstance.get("/finance/transactions/", { params });
      return res.data?.results || res.data || transactions;
    } catch {
      return transactions;
    } finally {
      setExporting(false);
    }
  };

  const exportTransactions = async () => {
    const dataToExport = await getAllFilteredTransactions();
    const csvContent = buildExportRows(dataToExport)
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const exportTransactionsExcel = async () => {
    const dataToExport = await getAllFilteredTransactions();
    const data = buildExportRows(dataToExport);
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "تراکنش‌ها");
    XLSX.writeFile(workbook, `transactions_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>لیست تراکنش‌ها</span>
              {stats.total_count > 0 && (
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  ({transactions.length} از {stats.total_count})
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={exportTransactions}
                variant="outline"
                size="sm"
                disabled={exporting || loading}
              >
                <Download className="w-4 h-4 ml-2" />
                خروجی CSV
              </Button>
              <Button
                onClick={exportTransactionsExcel}
                variant="outline"
                size="sm"
                disabled={exporting || loading}
              >
                <FileSpreadsheet className="w-4 h-4 ml-2" />
                خروجی اکسل
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="search">جستجو</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="جستجو در نام، شماره مرجع، کد..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">روش پرداخت</Label>
              <Select
                value={filters.payment_method || "-"}
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
                value={filters.transaction_type || "-"}
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
                value={filters.status || "-"}
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

          {/* Initial Loading */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="text-sm text-muted-foreground">در حال بارگذاری تراکنش‌ها...</div>
            </div>
          ) : (
            <>
              {/* Transactions Table with fixed height and internal infinite scroll */}
              <DataTable
                columns={columns}
                data={transactions}
                showPagination={false}
                maxHeight="560px"
                containerRef={tableContainerRef}
                onScroll={handleTableScroll}
                footerContent={
                  <div
                    ref={observerTarget}
                    className="w-full py-4 flex items-center justify-center border-t bg-muted/10"
                  >
                    {loadingMore && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>در حال بارگذاری تراکنش‌های بیشتر...</span>
                      </div>
                    )}
                    {!hasMore && transactions.length > 0 && (
                      <div className="text-xs text-muted-foreground py-1">
                        همه تراکنش‌ها بارگذاری شدند (مجموع: {stats.total_count || transactions.length} تراکنش)
                      </div>
                    )}
                  </div>
                }
              />
            </>
          )}

          {/* Financial Summary */}
          <div className="mt-6 p-4 rounded-lg bg-muted/40 border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total_count ? stats.total_count.toLocaleString("fa-IR") : transactions.length.toLocaleString("fa-IR")}
                </div>
                <div className="text-sm text-muted-foreground">کل تراکنش‌ها</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(
                    stats.total_purchases ||
                    transactions
                      .filter((t) => t.transaction_type === "purchase")
                      .reduce((sum, t) => sum + (t.amount || 0), 0)
                  )}
                </div>
                <div className="text-sm text-muted-foreground">مجموع خریدها</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatPrice(
                    stats.total_refunds ||
                    transactions
                      .filter((t) => t.transaction_type === "refund")
                      .reduce((sum, t) => sum + (t.amount || 0), 0)
                  )}
                </div>
                <div className="text-sm text-muted-foreground">مجموع بازپرداخت‌ها</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
