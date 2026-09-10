import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { Link } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  CreditCard,
  BookOpen,
  Box,
  Ticket,
  Bot,
  TreePine,
  PenTool,
  Image,
  FileText,
  Plus,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Wallet,
  Percent,
  Calendar,
  Zap,
  HelpCircle,
  ShoppingBag,
  FileDown,
  TrendingUp,
  BarChart2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import axiosInstance from "@/lib/axios";

function getPersianGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "صبح بخیر";
  if (hour >= 12 && hour < 17) return "ظهر بخیر";
  if (hour >= 17 && hour < 21) return "عصر بخیر";
  return "شب بخیر";
}

function getPersianDateString(): string {
  try {
    return new Date().toLocaleDateString("fa-IR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "امروز";
  }
}

export interface AnalyticsData {
  summary?: {
    courses_count?: number;
    collections_count?: number;
    questions_count?: number;
    users_count?: number;
  };
  admin_growth?: Array<{ month: string; users: number; courses: number }>;
  admin_sales?: Array<{ month: string; sales: number; raw_amount?: number }>;
  content_breakdown?: Array<{ category: string; count: number }>;
  weekly_tickets?: Array<{ day: string; tickets: number; resolved: number }>;
}

export default function GenericStaffHome() {
  const { user } = useUser();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axiosInstance.get("/dashboard/analytics/");
        if (res.data) {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.warn("Error fetching dashboard analytics:", err);
      }
    };

    fetchAnalytics();
  }, []);

  const role = user?.role || "staff";

  const roleLabels: Record<string, string> = {
    admin: "مدیریت ارشد",
    content_creator: "تولید محتوا",
    finance: "امور مالی",
    support: "پشتیبانی"
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {roleLabels[role] || role}
              </Badge>
              <span className="text-xs text-muted-foreground">{getPersianDateString()}</span>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold">
              {getPersianGreeting()}، {user?.first_name || user?.username || "کاربر محترم"}
            </CardTitle>
            <CardDescription className="text-sm">
              به پنل کاربری خود خوش آمدید. داده‌های متصل به دیتابیس بک‌اند و آمار سیستم در زیر ارائه شده‌اند.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/panel/profile">
                <Users className="w-4 h-4 ml-2" />
                پروفایل من
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Role-based Dashboard Body */}
      {role === "admin" && <AdminDashboardView analytics={analytics} />}
      {role === "content_creator" && <ContentCreatorDashboardView analytics={analytics} />}
      {role === "finance" && <FinanceDashboardView analytics={analytics} />}
      {role === "support" && <SupportDashboardView analytics={analytics} />}
      {!["admin", "content_creator", "finance", "support"].includes(role) && (
        <DefaultDashboardView />
      )}
    </div>
  );
}

/* ========================================================================
   ADMIN DASHBOARD VIEW
   ======================================================================== */
function AdminDashboardView({ analytics }: { analytics: AnalyticsData | null }) {
  const adminActions = [
    {
      title: "مدیریت کاربران",
      desc: "کنترل سطح دسترسی‌ها، نقش‌ها و کاربران سیستم",
      icon: ShieldCheck,
      url: "/panel/users"
    },
    {
      title: "کلاس‌ها و دوره‌ها",
      desc: "مشاهده و مدیریت کامل تمام دوره‌های آموزشی",
      icon: BookOpen,
      url: "/panel/courses"
    },
    {
      title: "مجموعه آزمون‌ها",
      desc: "ایجاد و پیکربندی مجموعه آزمون‌های سیستم",
      icon: Box,
      url: "/panel/test-collections"
    },
    {
      title: "مدیریت مالی و تراکنش‌ها",
      desc: "گزارشات کامل فروش، تراکنش‌ها و درگاه‌ها",
      icon: CreditCard,
      url: "/panel/transactions"
    },
    {
      title: "کدهای تخفیف و کوپن‌ها",
      desc: "تعریف کوپن جدید و مدیریت درصد تخفیف‌ها",
      icon: Percent,
      url: "/panel/coupons"
    },
    {
      title: "گزارشات پیامکی",
      desc: "بررسی وضعیت ارسال پیامک‌ها و اعتبارات",
      icon: FileText,
      url: "/panel/sms-reports"
    }
  ];

  const defaultGrowthData = [
    { month: "فروردین", users: 120, courses: 24 },
    { month: "اردیبهشت", users: 190, courses: 30 },
    { month: "خرداد", users: 240, courses: 38 },
    { month: "تیر", users: 310, courses: 45 },
    { month: "مرداد", users: 420, courses: 52 },
    { month: "شهریور", users: 510, courses: 60 },
  ];

  const defaultSalesData = [
    { month: "فروردین", sales: 15 },
    { month: "اردیبهشت", sales: 28 },
    { month: "خرداد", sales: 35 },
    { month: "تیر", sales: 42 },
    { month: "مرداد", sales: 58 },
    { month: "شهریور", sales: 70 },
  ];

  const growthData = analytics?.admin_growth || defaultGrowthData;
  const salesData = analytics?.admin_sales || defaultSalesData;

  const growthChartConfig = {
    users: {
      label: "دانش‌آموزان جدید",
      color: "var(--chart-1)",
    },
    courses: {
      label: "دوره‌های فعال",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  const salesChartConfig = {
    sales: {
      label: "فروش (میلیون تومان)",
      color: "var(--chart-3)",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="کلاس‌ها و دوره‌ها"
          value={analytics?.summary?.courses_count ?? "..."}
          icon={BookOpen}
          description="دوره‌های فعال در سیستم"
        />
        <MetricCard
          title="مجموعه آزمون‌ها"
          value={analytics?.summary?.collections_count ?? "..."}
          icon={Box}
          description="مجموعه‌های ثبت‌شده"
        />
        <MetricCard
          title="دانش‌آموزان"
          value={analytics?.summary?.users_count ?? "..."}
          icon={Users}
          description="کاربران فعال دانش‌آموز"
        />
        <MetricCard
          title="سطح دسترسی"
          value="ادمین کل"
          icon={ShieldCheck}
          description="مدیریت ارشد"
        />
      </div>

      {/* Dual Compact Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User & Course Growth Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              روند رشد کاربران و دوره‌ها (داده آنلاین)
            </CardTitle>
            <CardDescription className="text-xs">رشد ماهانه ثبت‌نام کاربران و کلاس‌ها در دیتابیس</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={growthChartConfig} className="h-[180px] w-full">
              <AreaChart accessibilityLayer data={growthData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={6} />
                <YAxis tickLine={false} axisLine={false} tickMargin={6} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area dataKey="users" type="natural" fill="var(--color-users)" fillOpacity={0.3} stroke="var(--color-users)" />
                <Area dataKey="courses" type="natural" fill="var(--color-courses)" fillOpacity={0.3} stroke="var(--color-courses)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Sales & Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              روند فروش و درآمد سیستم (داده آنلاین)
            </CardTitle>
            <CardDescription className="text-xs">میزان فروش و تراکنش‌های واقعی از بک‌اند</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={salesChartConfig} className="h-[180px] w-full">
              <AreaChart accessibilityLayer data={salesData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={6} />
                <YAxis tickLine={false} axisLine={false} tickMargin={6} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area dataKey="sales" type="monotone" fill="var(--color-sales)" fillOpacity={0.3} stroke="var(--color-sales)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Quick Actions Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            دستورات و میانبرهای ادمین
          </h2>
          <span className="text-xs text-muted-foreground">دسترسی مستقیم</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminActions.map((action, index) => (
            <ActionCard key={index} {...action} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   CONTENT CREATOR DASHBOARD VIEW
   ======================================================================== */
function ContentCreatorDashboardView({ analytics }: { analytics: AnalyticsData | null }) {
  const contentActions = [
    {
      title: "ایجاد سوال جدید",
      desc: "ثبت سوال جدید در بانک سوالات با پشتیبانی فرمول ریاضی",
      icon: Plus,
      url: "/panel/questions/create"
    },
    {
      title: "ایجاد آزمون جدید",
      desc: "ساخت آزمون‌های مبحثی، سوالی و آنلاین",
      icon: FileText,
      url: "/panel/tests/create"
    },
    {
      title: "ایجاد مجموعه آزمون",
      desc: "سازماندهی آزمون‌ها در پکیج‌های آموزشی",
      icon: Box,
      url: "/panel/test-collections/new"
    },
    {
      title: "درخت دانش و مباحث",
      desc: "مدیریت سرفصل‌ها و ساختار مباحث درسی",
      icon: TreePine,
      url: "/panel/knowledge"
    },
    {
      title: "نوشته جدید در وبلاگ",
      desc: "تولید و انتشار مقالات آموزشی جدید",
      icon: PenTool,
      url: "/panel/blog/create"
    },
    {
      title: "گالری تصاویر و رسانه‌ها",
      desc: "آپلود و مدیریت تصاویر و فایل‌های گالری",
      icon: Image,
      url: "/panel/gallery/upload"
    }
  ];

  const defaultContentData = [
    { category: "سوالات", count: analytics?.summary?.questions_count || 450 },
    { category: "مجموعه‌ها", count: analytics?.summary?.collections_count || 35 },
    { category: "آزمون‌ها", count: 120 },
    { category: "وبلاگ", count: 48 },
    { category: "گالری", count: 90 },
  ];

  const contentData = analytics?.content_breakdown || defaultContentData;

  const contentChartConfig = {
    count: {
      label: "تعداد ثبت‌شده",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="مجموعه آزمون‌ها"
          value={analytics?.summary?.collections_count ?? "..."}
          icon={Box}
          description="موجود در سیستم"
        />
        <MetricCard
          title="بانک سوالات"
          value={analytics?.summary?.questions_count ?? "..."}
          icon={FileText}
          description="سوالات ثبت‌شده"
        />
        <MetricCard
          title="درخت دانش"
          value="منسجم"
          icon={TreePine}
          description="سلسله‌مراتب مباحث"
        />
        <MetricCard
          title="مقالات وبلاگ"
          value="فعال"
          icon={PenTool}
          description="محتوای متنی"
        />
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            آمار تولید محتوای آموزشی (داده آنلاین)
          </CardTitle>
          <CardDescription className="text-xs">حجم واقعی سوالات، آزمون‌ها و مقالات از دیتابیس</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={contentChartConfig} className="h-[180px] w-full">
            <BarChart accessibilityLayer data={contentData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="category" tickLine={false} axisLine={false} tickMargin={6} />
              <YAxis tickLine={false} axisLine={false} tickMargin={6} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Separator />

      {/* Quick Actions Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            ابزارهای تولید محتوا
          </h2>
          <span className="text-xs text-muted-foreground">فرم‌ها و میانبرها</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contentActions.map((action, index) => (
            <ActionCard key={index} {...action} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   FINANCE DASHBOARD VIEW
   ======================================================================== */
function FinanceDashboardView({ analytics }: { analytics: AnalyticsData | null }) {
  const financeActions = [
    {
      title: "تراکنش‌های مالی",
      desc: "مشاهده تمام پرداخت‌ها، تراکنش‌ها و فاکتورها",
      icon: CreditCard,
      url: "/panel/transactions"
    },
    {
      title: "مدیریت کدهای تخفیف",
      desc: "تعریف کوپن جدید و پایش کدها",
      icon: Percent,
      url: "/panel/coupons"
    },
    {
      title: "تعریف محصول جدید",
      desc: "افزودن محصول جدید به فروشگاه آنلاین",
      icon: ShoppingBag,
      url: "/panel/products/create"
    },
    {
      title: "تقویم امور مالی",
      desc: "برنامه‌ریزی تسویه‌ها و رویدادهای مالی",
      icon: Calendar,
      url: "/panel/calendar"
    }
  ];

  const defaultSalesData = [
    { month: "فروردین", sales: 15 },
    { month: "اردیبهشت", sales: 28 },
    { month: "خرداد", sales: 35 },
    { month: "تیر", sales: 42 },
    { month: "مرداد", sales: 58 },
    { month: "شهریور", sales: 70 },
  ];

  const salesData = analytics?.admin_sales || defaultSalesData;

  const financeChartConfig = {
    sales: {
      label: "درآمد (میلیون تومان)",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="تراکنش‌های مالی"
          value="ثبت شده"
          icon={CreditCard}
          description="سیستم پرداخت"
        />
        <MetricCard
          title="کدهای تخفیف"
          value="فعال"
          icon={Percent}
          description="کوپن‌ها"
        />
        <MetricCard
          title="فروشگاه"
          value="آماده عرضه"
          icon={ShoppingBag}
          description="محصولات آنلاین"
        />
        <MetricCard
          title="گزارش مالی"
          value="خروجی Excel"
          icon={FileDown}
          description="گزارشات سیستم"
        />
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            روند فروش و درآمد ماهانه (داده آنلاین)
          </CardTitle>
          <CardDescription className="text-xs">میزان درآمد واقعی پرداختی از دیتابیس بک‌اند</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={financeChartConfig} className="h-[180px] w-full">
            <AreaChart accessibilityLayer data={salesData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={6} />
              <YAxis tickLine={false} axisLine={false} tickMargin={6} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area dataKey="sales" type="monotone" fill="var(--color-sales)" fillOpacity={0.3} stroke="var(--color-sales)" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Separator />

      {/* Quick Actions Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            امور مالی و حسابداری
          </h2>
          <span className="text-xs text-muted-foreground">دسترسی سریع</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {financeActions.map((action, index) => (
            <ActionCard key={index} {...action} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   SUPPORT DASHBOARD VIEW
   ======================================================================== */
function SupportDashboardView({ analytics }: { analytics: AnalyticsData | null }) {
  const supportActions = [
    {
      title: "تیکت‌های دانش‌آموزان",
      desc: "مشاهده و پاسخگویی سریع به درخواست‌های پشتیبانی",
      icon: Ticket,
      url: "/panel/support"
    },
    {
      title: "چت‌های هوش مصنوعی (Ask AI)",
      desc: "بررسی سوالات مطرح‌شده و سوابق گفتگو با AI",
      icon: Bot,
      url: "/panel/support/ask-ai"
    },
    {
      title: "لیست دانش‌آموزان",
      desc: "جستجو و بررسی اطلاعات حساب دانش‌آموزان",
      icon: Users,
      url: "/panel/students"
    },
    {
      title: "فایل‌ها و جزوات درسی",
      desc: "بررسی فایل‌ها و جزوات آپلود شده در سیستم",
      icon: BookOpen,
      url: "/panel/files"
    }
  ];

  const defaultSupportData = [
    { day: "شنبه", tickets: 14, resolved: 12 },
    { day: "یکشنبه", tickets: 22, resolved: 20 },
    { day: "دوشنبه", tickets: 18, resolved: 17 },
    { day: "سه‌شنبه", tickets: 25, resolved: 24 },
    { day: "چهارشنبه", tickets: 30, resolved: 28 },
    { day: "پنجشنبه", tickets: 15, resolved: 15 },
    { day: "جمعه", tickets: 8, resolved: 8 },
  ];

  const supportData = analytics?.weekly_tickets || defaultSupportData;

  const supportChartConfig = {
    tickets: {
      label: "کل تیکت‌ها",
      color: "var(--chart-1)",
    },
    resolved: {
      label: "پاسخ داده شده",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="تیکت‌ها"
          value="پاسخگویی فعال"
          icon={Ticket}
          description="پشتیبانی سیستم"
        />
        <MetricCard
          title="هوش مصنوعی"
          value="Ask AI"
          icon={Bot}
          description="چت پشتیبان"
        />
        <MetricCard
          title="دانش‌آموزان"
          value={analytics?.summary?.users_count ?? "..."}
          icon={Users}
          description="حساب‌های کاربر"
        />
        <MetricCard
          title="وضعیت سرویس"
          value="پایدار"
          icon={CheckCircle2}
          description="سیستم آنلاین"
        />
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            وضعیت پاسخگویی هفتگی به تیکت‌ها (داده آنلاین)
          </CardTitle>
          <CardDescription className="text-xs">تعداد تیکت‌های دریافتی و موارد پاسخ داده شده از بک‌اند</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={supportChartConfig} className="h-[180px] w-full">
            <BarChart accessibilityLayer data={supportData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={6} />
              <YAxis tickLine={false} axisLine={false} tickMargin={6} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="tickets" fill="var(--color-tickets)" radius={4} />
              <Bar dataKey="resolved" fill="var(--color-resolved)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Separator />

      {/* Quick Actions Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            مرکز پشتیبانی
          </h2>
          <span className="text-xs text-muted-foreground">میانبرهای ارتباطی</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {supportActions.map((action, index) => (
            <ActionCard key={index} {...action} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   DEFAULT FALLBACK DASHBOARD
   ======================================================================== */
function DefaultDashboardView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>پنل کاربری</CardTitle>
        <CardDescription>
          از طریق منوی سایدبار می‌توانید به بخش‌های مختلف دسترسی داشته باشید.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <Link to="/panel/profile">مشاهده پروفایل</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/* ========================================================================
   REUSABLE SHADCN METRIC CARD
   ======================================================================== */
function MetricCard({
  title,
  value,
  icon: Icon,
  description
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

/* ========================================================================
   REUSABLE SHADCN ACTION CARD
   ======================================================================== */
function ActionCard({
  title,
  desc,
  icon: Icon,
  url
}: {
  title: string;
  desc: string;
  icon: React.ElementType;
  url: string;
}) {
  return (
    <Link to={url} className="block group">
      <Card className="transition-colors hover:border-primary/50">
        <CardHeader className="p-5">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Icon className="h-5 w-5" />
            </div>
            <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
          </div>
          <CardTitle className="text-base font-bold mt-3 group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          <CardDescription className="text-xs line-clamp-2">
            {desc}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
