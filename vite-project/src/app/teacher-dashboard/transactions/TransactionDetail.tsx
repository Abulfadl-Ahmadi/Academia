import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  CreditCard,
  User as UserIcon,
  Mail,
  Phone,
  ShoppingBag,
  Receipt,
  ShieldCheck,
  ChevronDown,
  Printer,
  FileText,
  Hash,
  School
} from "lucide-react";
import { getPaymentMethodLabel, formatPrice } from "./utils";
// @ts-expect-error: No type definitions for moment-jalaali
import moment from "moment-jalaali";

function toPersianDigits(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return "-";
  return num.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
}

function formatJalaliDate(isoDate?: string | null): string {
  if (!isoDate) return "-";
  try {
    return moment(isoDate).format("jYYYY/jMM/jDD - HH:mm");
  } catch {
    return new Date(isoDate).toLocaleDateString("fa-IR");
  }
}

const ZIBAL_STATUS_DESCRIPTIONS: Record<number, { text: string; color: string }> = {
  [-1]: { text: "در انتظار پرداخت", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-200 dark:border-amber-800/60" },
  [-2]: { text: "خطای داخلی درگاه", color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-200 dark:border-rose-800/60" },
  [1]: { text: "پرداخت شده و تأیید شده (موفق)", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-200 dark:border-emerald-800/60" },
  [2]: { text: "پرداخت شده اما هنوز تأیید نشده", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-200 dark:border-blue-800/60" },
  [3]: { text: "لغوشده توسط کاربر", color: "text-muted-foreground bg-muted/60 border-border" },
  [4]: { text: "شماره کارت نامعتبر است", color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-200 dark:border-rose-800/60" },
  [5]: { text: "موجودی حساب کافی نیست", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-200 dark:border-amber-800/60" },
  [6]: { text: "رمز وارد شده اشتباه است", color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-200 dark:border-rose-800/60" },
  [7]: { text: "تعداد درخواست‌ها بیش از حد مجاز", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-200 dark:border-amber-800/60" },
  [8]: { text: "تعداد پرداخت روزانه بیش از حد مجاز", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-200 dark:border-amber-800/60" },
  [9]: { text: "مبلغ پرداخت روزانه بیش از حد مجاز", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-200 dark:border-amber-800/60" },
  [10]: { text: "صادرکننده کارت نامعتبر است", color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-200 dark:border-rose-800/60" },
  [11]: { text: "خطای سوییچ بانک", color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-200 dark:border-rose-800/60" },
  [12]: { text: "کارت قابل دسترسی نیست", color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-200 dark:border-rose-800/60" },
  [15]: { text: "تراکنش استرداد شده", color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-200 dark:border-purple-800/60" },
  [16]: { text: "تراکنش در حال استرداد", color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-200 dark:border-purple-800/60" },
  [18]: { text: "تراکنش ریورس شده (برگشت داده شده)", color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-200 dark:border-purple-800/60" },
};

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const isAdminOrTeacher = currentUser?.role === "admin" || currentUser?.role === "teacher";
  
  const [loading, setLoading] = useState(true);
  const [inquiring, setInquiring] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPayloads, setShowPayloads] = useState(false);

  const fetchTransactionDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/finance/transactions/${id}/`);
      setTransaction(res.data);
    } catch (err: any) {
      console.error("Error fetching transaction details:", err);
      setError("خطا در دریافت اطلاعات و جزئیات تراکنش");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionDetail();
  }, [id]);

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} با موفقیت کپی شد`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleLiveInquiry = async (trackId?: number | string) => {
    if (!trackId && !transaction?.order?.id) {
      toast.error("شناسه تراکنش جهت استعلام یافت نشد");
      return;
    }
    setInquiring(true);
    try {
      const payload = trackId ? { track_id: trackId } : { order_id: transaction.order.id };
      const res = await axiosInstance.post(`/finance/payment/inquiry/`, payload);
      if (res.data?.inquiry_success) {
        toast.success(res.data.message || "استعلام زنده زیبال با موفقیت انجام شد");
        fetchTransactionDetail();
      } else {
        toast.warning(res.data?.message || "پاسخ غیرمنتظره در استعلام");
      }
    } catch (err: any) {
      console.error("Inquiry error:", err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || "خطا در برقراری ارتباط با زیبال";
      toast.error(errMsg);
    } finally {
      setInquiring(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!transaction) return;
    const order = transaction.order || {};
    const orderUser = order.user || transaction.user || {};
    const orderItems = order.items || [];
    const primaryPayment = (transaction.payments && transaction.payments.length > 0) ? transaction.payments[0] : null;
    const isPaid = order.status === "paid" || primaryPayment?.status === "success";

    // Remove any existing print iframe
    const oldFrame = document.getElementById("invoice-print-frame");
    if (oldFrame) {
      oldFrame.remove();
    }

    // Create a hidden iframe
    const iframe = document.createElement("iframe");
    iframe.id = "invoice-print-frame";
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.style.top = "0";
    iframe.style.width = "800px";
    iframe.style.height = "1100px";
    iframe.style.border = "0";
    iframe.style.visibility = "visible";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      toast.error("خطا در ایجاد فریم پرینت");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8">
        <title>فاکتور خرید ${transaction.transaction_code || transaction.id}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; font-family: 'Vazirmatn', 'Ravi', 'Vazir', Tahoma, sans-serif !important; }
          body {
            color: #0f172a !important;
            background: #ffffff !important;
            margin: 0;
            padding: 16px;
            direction: rtl;
            font-size: 13px;
            line-height: 1.6;
            font-family: 'Vazirmatn', 'Ravi', 'Vazir', Tahoma, sans-serif !important;
          }
          .invoice-box {
            max-width: 100%;
            margin: 0 auto;
            border: 2px solid #cbd5e1;
            border-radius: 10px;
            padding: 20px;
            background: #ffffff;
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .header-title {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }
          .header-sub {
            font-size: 12px;
            color: #475569;
            margin-top: 2px;
          }
          .meta-box {
            text-align: left;
            font-size: 12px;
            color: #334155;
          }
          .info-grid {
            display: flex;
            gap: 16px;
            margin-bottom: 20px;
          }
          .info-card {
            flex: 1;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
          }
          .info-card-title {
            font-weight: 700;
            font-size: 13px;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-bottom: 8px;
          }
          .info-line {
            margin-bottom: 4px;
            display: flex;
            justify-content: space-between;
          }
          .info-label { color: #475569; }
          .info-val { font-weight: 600; color: #0f172a; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 16px;
          }
          th, td {
            border: 1px solid #94a3b8;
            padding: 8px 10px;
            text-align: right;
            font-size: 12px;
          }
          th {
            background-color: #f1f5f9;
            color: #0f172a;
            font-weight: 700;
          }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .total-section {
            background: #eff6ff;
            border: 1px solid #93c5fd;
            border-radius: 8px;
            padding: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            font-weight: 800;
            color: #1e40af;
          }
          .footer-note {
            margin-top: 24px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
            border-top: 1px dashed #cbd5e1;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header-row">
            <div>
              <h1 class="header-title">آکادمی آنلاین آرین تفضلی‌زاده - فاکتور رسمی فروش</h1>
              <div class="header-sub">کد تراکنش: ${transaction.transaction_code || transaction.id}</div>
            </div>
            <div class="meta-box">
              <div>تاریخ صدور: ${formatJalaliDate(transaction.created_at)}</div>
              <div>کد سفارش: ${order.order_code || order.id || '-'}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <div class="info-card-title">مشخصات خریدار</div>
              <div class="info-line">
                <span class="info-label">خریدار:</span>
                <span class="info-val">${orderUser.first_name || orderUser.last_name ? `${orderUser.first_name || ''} ${orderUser.last_name || ''}`.trim() : orderUser.username}</span>
              </div>
              ${orderUser.email ? `<div class="info-line"><span class="info-label">ایمیل:</span><span class="info-val">${orderUser.email}</span></div>` : ''}
              ${orderUser.phone ? `<div class="info-line"><span class="info-label">شماره تماس:</span><span class="info-val">${toPersianDigits(orderUser.phone)}</span></div>` : ''}
            </div>

            <div class="info-card">
              <div class="info-card-title">مشخصات پرداخت</div>
              <div class="info-line">
                <span class="info-label">وضعیت فاکتور:</span>
                <span class="info-val" style="color: ${isPaid ? '#059669' : '#d97706'}">${isPaid ? 'پرداخت شده (موفق)' : 'در انتظار پرداخت / لغو شده'}</span>
              </div>
              <div class="info-line">
                <span class="info-label">روش پرداخت:</span>
                <span class="info-val">${getPaymentMethodLabel(transaction.payment_method)}</span>
              </div>
              <div class="info-line">
                <span class="info-label">کد پیگیری بانکی:</span>
                <span class="info-val">${transaction.reference_number ? toPersianDigits(transaction.reference_number) : (primaryPayment?.track_id ? toPersianDigits(primaryPayment.track_id) : '-')}</span>
              </div>
            </div>
          </div>

          <div style="font-weight: 700; font-size: 13px; margin-bottom: 6px;">اقلام فاکتور</div>
          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 40px;">#</th>
                <th>شرح دوره / محصول آموزشی</th>
                <th class="text-center" style="width: 60px;">تعداد</th>
                <th class="text-center" style="width: 110px;">قیمت واحد</th>
                <th class="text-center" style="width: 90px;">تخفیف</th>
                <th class="text-left" style="width: 120px;">مبلغ کل</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems.length > 0 ? orderItems.map((item: any, idx: number) => `
                <tr>
                  <td class="text-center">${toPersianDigits(idx + 1)}</td>
                  <td>${item.product?.title || 'محصول آموزشی'}</td>
                  <td class="text-center">${toPersianDigits(item.quantity)}</td>
                  <td class="text-center">${formatPrice(item.price)}</td>
                  <td class="text-center">${item.discount_amount > 0 ? formatPrice(item.discount_amount) : '-'}</td>
                  <td class="text-left" style="font-weight: 700;">${formatPrice((item.price - (item.discount_amount || 0)) * item.quantity)}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="6" class="text-center">اطلاعات اقلام موجود نیست.</td>
                </tr>
              `}
            </tbody>
          </table>

          <div class="total-section">
            <span>جمع کل پرداخت شده:</span>
            <span>${formatPrice(transaction.amount)}</span>
          </div>

          <div class="footer-note">
            این فاکتور دیجیتال توسط سامانه آکادمی آنلاین آرین تفضلی‌زاده صادر گردیده است.
          </div>
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    const triggerPrint = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    };

    if (iframe.contentWindow?.document?.fonts) {
      iframe.contentWindow.document.fonts.ready.then(() => {
        setTimeout(triggerPrint, 150);
      });
    } else {
      setTimeout(triggerPrint, 300);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">در حال دریافت و بارگذاری جزئیات فاکتور تراکنش...</p>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{error || "تراکنش مورد نظر یافت نشد"}</h2>
        <Button variant="outline" onClick={() => navigate(-1)} className="border-border">
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت
        </Button>
      </div>
    );
  }

  const t = transaction;
  const order = t.order || {};
  const orderUser = order.user || t.user || {};
  const orderItems = order.items || [];
  const primaryPayment = (t.payments && t.payments.length > 0) ? t.payments[0] : null;

  const isPaid = order.status === "paid" || primaryPayment?.status === "success";
  const isFailed = order.status === "cancelled" || primaryPayment?.status === "failed";

  const getStatusBadge = () => {
    if (isPaid) {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/70 hover:bg-emerald-500/25 px-3 py-1 text-sm font-semibold flex items-center gap-1.5 shadow-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          پرداخت شده (موفق)
        </Badge>
      );
    }
    if (isFailed) {
      return (
        <Badge variant="destructive" className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/70 hover:bg-rose-500/25 px-3 py-1 text-sm font-semibold flex items-center gap-1.5 shadow-none">
          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          ناموفق / لغو شده
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800/70 hover:bg-amber-500/25 px-3 py-1 text-sm font-semibold flex items-center gap-1.5 shadow-none">
        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        در انتظار پرداخت
      </Badge>
    );
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="hover:bg-accent text-foreground"
          >
            <ArrowRight className="w-4 h-4 ml-1" />
            بازگشت
          </Button>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              فاکتور و جزئیات تراکنش {t.transaction_code || `#${toPersianDigits(t.id)}`}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              تاریخ ثبت: {formatJalaliDate(t.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Admin / Teacher direct Zibal Inquiry Button */}
          {isAdminOrTeacher && primaryPayment?.track_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLiveInquiry(primaryPayment.track_id)}
              disabled={inquiring}
              className="border-primary/40 text-primary hover:bg-primary/10 dark:border-primary/50 dark:hover:bg-primary/20"
            >
              <RefreshCw className={`w-4 h-4 ml-1.5 ${inquiring ? "animate-spin" : ""}`} />
              {inquiring ? "در حال استعلام..." : "استعلام آنی زیبال"}
            </Button>
          )}

          {t.reference_number && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(t.reference_number, "کد پیگیری")}
              className="border-border text-foreground hover:bg-accent"
            >
              {copiedField === "کد پیگیری" ? (
                <Check className="w-4 h-4 ml-1.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 ml-1.5" />
              )}
              کپی کد پیگیری
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrintInvoice}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <Printer className="w-4 h-4 ml-1.5" />
            چاپ فاکتور
          </Button>
        </div>
      </div>

      {/* Hero Overview Cards */}
      <div className={`grid grid-cols-1 ${isAdminOrTeacher ? "md:grid-cols-4" : "md:grid-cols-3"} gap-4`}>
        {/* Amount Box */}
        <div className="bg-card p-5 rounded-2xl border border-border relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent pointer-events-none" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider relative z-10">مبلغ کل پرداخت</span>
          <div className="mt-2 relative z-10">
            <span className="text-3xl font-black text-foreground tracking-tight">
              {formatPrice(t.amount)}
            </span>
          </div>
        </div>

        {/* Status Box */}
        <div className="bg-card p-5 rounded-2xl border border-border flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground">وضعیت پرداخت</span>
          <div className="mt-3">
            {getStatusBadge()}
          </div>
        </div>

        {/* Payment Method Box */}
        <div className="bg-card p-5 rounded-2xl border border-border flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground">روش پرداخت</span>
          <div className="mt-2 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground block">{getPaymentMethodLabel(t.payment_method)}</span>
              <span className="text-xs text-muted-foreground">درگاه پرداخت شتابی</span>
            </div>
          </div>
        </div>

        {/* Reference Number Box (Only Admin/Teacher view gets extra RRN box, or shared if available) */}
        {isAdminOrTeacher && (
          <div className="bg-card p-5 rounded-2xl border border-border flex flex-col justify-between">
            <span className="text-xs font-medium text-muted-foreground">شماره مرجع بانکی (RRN)</span>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-base font-bold tracking-wider text-foreground">
                {t.reference_number ? toPersianDigits(t.reference_number) : "ثبت نشده"}
              </span>
              {t.reference_number && (
                <button
                  onClick={() => handleCopy(t.reference_number, "شماره مرجع")}
                  className="text-xs text-primary hover:underline"
                >
                  کپی
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className={`grid grid-cols-1 ${isAdminOrTeacher ? "lg:grid-cols-3" : "lg:grid-cols-1"} gap-6`}>

        {/* Primary Order & Items Card */}
        <div className={`${isAdminOrTeacher ? "lg:col-span-2" : "lg:col-span-1"} space-y-6`}>
          <Card className="shadow-xs border-border bg-card">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <Receipt className="w-5 h-5 text-primary" />
                  اطلاعات فاکتور و خریدار
                </CardTitle>
                {order.id && (
                  <Badge variant="outline" className="font-mono border-border text-foreground">
                    کد سفارش: {order.order_code || `#${toPersianDigits(order.id)}`}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Customer Info */}
                <div className="space-y-4 p-4 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/70">
                  <span className="text-xs font-bold text-muted-foreground uppercase">مشخصات خریدار</span>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
                      {orderUser.first_name ? orderUser.first_name[0] : orderUser.username ? orderUser.username[0]?.toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">
                        {orderUser.first_name || orderUser.last_name
                          ? `${orderUser.first_name || ""} ${orderUser.last_name || ""}`.trim()
                          : orderUser.username}
                      </div>
                      {isAdminOrTeacher && <div className="text-xs text-muted-foreground">@{orderUser.username}</div>}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
                    {orderUser.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" /> ایمیل:
                        </span>
                        <span className="font-medium text-foreground">{orderUser.email}</span>
                      </div>
                    )}
                    {(orderUser.phone || orderUser.phone_number) && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" /> شماره تماس:
                        </span>
                        <span className="font-medium text-foreground [direction:ltr]">{toPersianDigits(orderUser.phone || orderUser.phone_number)}</span>
                      </div>
                    )}
                    {orderUser.school && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5" /> مرکز آموزشی / مدرسه:
                        </span>
                        <span className="font-medium text-foreground">{orderUser.school}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction Summary */}
                <div className="space-y-4 p-4 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/70">
                  <span className="text-xs font-bold text-muted-foreground uppercase">خلاصه فاکتور</span>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">کد پیگیری خرید:</span>
                      <span className="font-mono font-bold text-foreground">
                        {t.reference_number ? toPersianDigits(t.reference_number) : (primaryPayment?.track_id ? toPersianDigits(primaryPayment.track_id) : "-")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">زمان پرداخت:</span>
                      <span className="font-medium text-foreground">{formatJalaliDate(primaryPayment?.paid_at || t.created_at)}</span>
                    </div>
                    {t.description && (
                      <div className="pt-2 border-t border-border/60">
                        <span className="text-muted-foreground block mb-1">بابت:</span>
                        <p className="text-foreground whitespace-pre-wrap">{t.description}</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Order Items Table */}
              {orderItems.length > 0 && (
                <div className="mt-6">
                  <span className="text-sm font-bold text-foreground block mb-3 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                    لیست دوره‌ها / محصولات خریداری شده ({toPersianDigits(orderItems.length)} مورد)
                  </span>
                  <div className="rounded-xl border border-border overflow-hidden bg-card">
                    <Table className="w-full text-xs">
                      <TableHeader className="bg-muted/50">
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="text-right text-muted-foreground font-semibold">عنوان محصول</TableHead>
                          <TableHead className="text-center text-muted-foreground font-semibold">تعداد</TableHead>
                          <TableHead className="text-center text-muted-foreground font-semibold">قیمت واحد</TableHead>
                          <TableHead className="text-center text-muted-foreground font-semibold">تخفیف</TableHead>
                          <TableHead className="text-left text-muted-foreground font-semibold">مبلغ نهایی</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item: any) => (
                          <TableRow key={item.id} className="border-b border-border/60 hover:bg-muted/20">
                            <TableCell className="font-medium py-3 text-foreground">
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                  <FileText className="w-3.5 h-3.5" />
                                </span>
                                <span>{item.product?.title || "محصول آموزشی"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-mono text-foreground">{toPersianDigits(item.quantity)}</TableCell>
                            <TableCell className="text-center text-foreground">{formatPrice(item.price)}</TableCell>
                            <TableCell className="text-center text-rose-600 dark:text-rose-400 font-medium">
                              {item.discount_amount > 0 ? formatPrice(item.discount_amount) : "-"}
                            </TableCell>
                            <TableCell className="text-left font-bold text-primary">
                              {formatPrice((item.price - (item.discount_amount || 0)) * item.quantity)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Left Column: Admin/Teacher Specific Gateway Details & Raw Payloads */}
        {isAdminOrTeacher && (
          <div className="space-y-6">
            {/* Gateway Card (Admin View Only) */}
            <Card className="shadow-xs border-border bg-card">
              <CardHeader className="border-b border-border bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    جزئیات درگاه زیبال (ویژه ادمین)
                  </CardTitle>
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800">
                    Zibal Gateway
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {primaryPayment ? (
                  <>
                    {/* Track ID */}
                    <div className="p-3 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border flex items-center justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground block">شناسه پیگیری زیبال (trackId)</span>
                        <span className="font-mono font-bold text-sm tracking-wide text-foreground">
                          {primaryPayment.track_id ? toPersianDigits(primaryPayment.track_id) : "-"}
                        </span>
                      </div>
                      {primaryPayment.track_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(primaryPayment.track_id.toString(), "شناسه پیگیری")}
                          className="h-8 px-2 hover:bg-muted"
                        >
                          {copiedField === "شناسه پیگیری" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Ref Number */}
                    <div className="p-3 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border flex items-center justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground block">شماره مرجع بانکی (refNumber)</span>
                        <span className="font-mono font-bold text-sm tracking-wide text-foreground">
                          {primaryPayment.ref_number ? toPersianDigits(primaryPayment.ref_number) : "-"}
                        </span>
                      </div>
                      {primaryPayment.ref_number && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(primaryPayment.ref_number.toString(), "شماره مرجع")}
                          className="h-8 px-2 hover:bg-muted"
                        >
                          {copiedField === "شماره مرجع" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Card Number */}
                    <div className="p-3 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border flex items-center justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground block">شماره کارت پرداختی (Masked)</span>
                        <span className="font-mono font-bold text-sm tracking-widest [direction:ltr] text-foreground block text-right">
                          {primaryPayment.card_number ? toPersianDigits(primaryPayment.card_number) : "-"}
                        </span>
                      </div>
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    </div>

                    {/* Zibal Status Code & Description */}
                    {primaryPayment.zibal_status !== undefined && primaryPayment.zibal_status !== null && (
                      <div className="p-3 rounded-xl border border-border space-y-1 bg-muted/30 dark:bg-muted/15">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">کد وضعیت زیبال:</span>
                          <Badge variant="outline" className="font-mono border-border text-foreground">
                            Status {toPersianDigits(primaryPayment.zibal_status)}
                          </Badge>
                        </div>
                        <p className={`text-xs font-semibold p-2.5 rounded-lg border mt-2 ${
                          ZIBAL_STATUS_DESCRIPTIONS[primaryPayment.zibal_status]?.color || "bg-muted text-foreground border-border"
                        }`}>
                          {ZIBAL_STATUS_DESCRIPTIONS[primaryPayment.zibal_status]?.text || `کد وضعیت: ${primaryPayment.zibal_status}`}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    سابقه درگاهی مستقیم یافت نشد.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Technical JSON Payload Accordion (ONLY for Admin/Teacher) */}
            {primaryPayment && (
              <Card className="shadow-xs border-border bg-card">
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => setShowPayloads(!showPayloads)}>
                  <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    اطلاعات و پیلودهای خام فنی زیبال (Developer Payload)
                  </CardTitle>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showPayloads ? "rotate-180" : ""}`} />
                </CardHeader>
                {showPayloads && (
                  <CardContent className="pt-2 text-xs space-y-3 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">پیلود ذخیره شده:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] border-border text-foreground hover:bg-accent"
                        onClick={() => handleCopy(JSON.stringify(primaryPayment, null, 2), "داده‌های خام JSON")}
                      >
                        کپی JSON
                      </Button>
                    </div>
                    <pre className="p-3 bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-xl text-[11px] font-mono overflow-x-auto [direction:ltr] max-h-60 whitespace-pre-wrap">
                      {JSON.stringify(primaryPayment, null, 2)}
                    </pre>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
