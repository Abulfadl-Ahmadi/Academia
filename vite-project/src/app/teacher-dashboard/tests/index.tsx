import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import {
  Activity,
  Calendar,
  CircleDot,
  Clock,
  FileText,
  FilterX,
  Folder,
  Layers,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Target,
} from "lucide-react";

type TestTypeOption = "scheduled" | "topic_based" | "practice";
type ContentTypeOption = "pdf" | "typed_question";

interface TestSummary {
  id: number;
  name: string;
  description?: string | null;
  test_type?: TestTypeOption | null;
  content_type?: ContentTypeOption | null;
  is_active?: boolean;
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration?: string | number | null;
  frequency?: string | null;
  test_collection?: number | null;
  test_collection_detail?: {
    id: number;
    name: string;
  } | null;
  folders?: number[] | null;
  questions?: number[] | null;
}

const testTypeLabels: Record<TestTypeOption, string> = {
  scheduled: "زمان‌بندی شده",
  topic_based: "مبحثی",
  practice: "تمرینی",
};

const contentTypeLabels: Record<ContentTypeOption, string> = {
  pdf: "فایل PDF",
  typed_question: "سوال تایپ شده",
};

const numberFormatter = new Intl.NumberFormat("fa-IR");

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
};

const formatDuration = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") {
    return "نامشخص";
  }

  if (typeof value === "number") {
    const totalMinutes = Math.round(value);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) {
      return `${minutes} دقیقه`;
    }
    return `${hours} ساعت و ${minutes} دقیقه`;
  }

  if (typeof value === "string") {
    const isoMatch = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
    if (isoMatch) {
      const hours = isoMatch[1] ? parseInt(isoMatch[1], 10) : 0;
      const minutes = isoMatch[2] ? parseInt(isoMatch[2], 10) : 0;
      if (!hours && !minutes) {
        const seconds = isoMatch[3] ? parseInt(isoMatch[3], 10) : 0;
        return `${seconds} ثانیه`;
      }
      if (!hours) {
        return `${minutes} دقیقه`;
      }
      return `${hours} ساعت و ${minutes} دقیقه`;
    }

    if (value.includes(":")) {
      const parts = value.split(":").map((part) => parseInt(part, 10));
      const hours = parts[0] || 0;
      const minutes = parts[1] || 0;
      if (!hours) {
        return `${minutes} دقیقه`;
      }
      return `${hours} ساعت و ${minutes} دقیقه`;
    }

    const numeric = parseFloat(value);
    if (!Number.isNaN(numeric)) {
      return `${numeric} دقیقه`;
    }
  }

  return "نامشخص";
};

const determineScheduleBadge = (test: TestSummary) => {
  if (!test.start_time || !test.end_time || test.test_type !== "scheduled") {
    return test.is_active ? { label: "فعال", tone: "success" } : { label: "غیرفعال", tone: "muted" };
  }

  const now = Date.now();
  const start = new Date(test.start_time).getTime();
  const end = new Date(test.end_time).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return test.is_active ? { label: "فعال", tone: "success" } : { label: "غیرفعال", tone: "muted" };
  }

  if (now < start) {
    return { label: "در صف اجرا", tone: "info" };
  }
  if (now >= start && now <= end) {
    return { label: "در حال برگزاری", tone: "success" };
  }
  return { label: "پایان یافته", tone: "secondary" };
};

const TestsList = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchValue, setSearchValue] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [contentFilter, setContentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadTests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get("/tests/");
      let results: TestSummary[] = [];
      if (Array.isArray(response.data)) {
        results = response.data as TestSummary[];
      } else if (response.data && Array.isArray(response.data.results)) {
        results = response.data.results as TestSummary[];
      }
      setTests(results);
    } catch (fetchError) {
      console.error("Error loading tests:", fetchError);
      setError("بارگذاری آزمون‌ها با خطا مواجه شد");
      toast.error("خطا در بارگذاری آزمون‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const resetFilters = () => {
    setSearchValue("");
    setTypeFilter("all");
    setContentFilter("all");
    setStatusFilter("all");
  };

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const matchesSearch = test.name
        ?.toLowerCase()
        .includes(searchValue.trim().toLowerCase()) ||
        test.description?.toLowerCase().includes(searchValue.trim().toLowerCase());

      const matchesType =
        typeFilter === "all" || (test.test_type && test.test_type === typeFilter);

      const matchesContent =
        contentFilter === "all" || (test.content_type && test.content_type === contentFilter);

      const matchesStatus = (() => {
        if (statusFilter === "all") return true;
        if (statusFilter === "active") return test.is_active;
        if (statusFilter === "inactive") return test.is_active === false;
        if (statusFilter === "scheduled") return test.test_type === "scheduled";
        if (statusFilter === "topic") return test.test_type === "topic_based";
        if (statusFilter === "practice") return test.test_type === "practice";
        return true;
      })();

      return Boolean(matchesSearch) && matchesType && matchesContent && matchesStatus;
    });
  }, [tests, searchValue, typeFilter, contentFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = tests.length;
    const active = tests.filter((item) => item.is_active).length;
    const pdf = tests.filter((item) => item.content_type === "pdf").length;
    const typed = tests.filter((item) => item.content_type === "typed_question").length;
    return { total, active, pdf, typed };
  }, [tests]);

  const handleCreate = () => {
    navigate("/panel/tests/create");
  };

  const handleViewResults = (id: number) => {
    navigate(`/panel/tests/result/${id}`);
  };

  const handleNavigateToCollection = (test: TestSummary) => {
    if (test.test_collection_detail) {
      navigate(`/panel/test-collections/${test.test_collection_detail.id}`);
    }
  };

  const handleEditShortcut = (test: TestSummary) => {
    navigate(`/panel/tests/${test.id}/edit`);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("آیا از حذف این آزمون اطمینان دارید؟");
    if (!confirmed) {
      return;
    }
    try {
      await axiosInstance.delete(`/tests/${id}/`);
      toast.success("آزمون حذف شد");
      setTests((prev) => prev.filter((item) => item.id !== id));
    } catch (deleteError) {
      console.error("Error deleting test:", deleteError);
      toast.error("حذف آزمون با خطا مواجه شد");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">مدیریت آزمون‌ها</h1>
          <p className="text-sm text-muted-foreground">
            مشاهده، فیلتر و مدیریت همه آزمون‌های ایجاد شده در یک نما
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          آزمون جدید
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>کل آزمون‌ها</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{numberFormatter.format(stats.total)}</span>
              <Badge variant="outline" className="text-xs">همه</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>آزمون‌های فعال</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-green-600">
                {numberFormatter.format(stats.active)}
              </span>
              <Badge variant="outline" className="text-xs">فعال</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>آزمون‌های PDF</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">
                {numberFormatter.format(stats.pdf)}
              </span>
              <Badge variant="outline" className="text-xs">PDF</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>آزمون‌های سوالی</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-600">
                {numberFormatter.format(stats.typed)}
              </span>
              <Badge variant="outline" className="text-xs">Typed</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">فیلترها و جستجو</CardTitle>
          <CardDescription>جستجوی سریع در بین آزمون‌ها با انتخاب نوع و وضعیت</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">جستجو</span>
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="نام یا توضیح آزمون را جستجو کنید"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">نوع آزمون</span>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="همه نوع‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="scheduled">زمان‌بندی شده</SelectItem>
                  <SelectItem value="topic_based">مبحثی</SelectItem>
                  <SelectItem value="practice">تمرینی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">نوع محتوا</span>
              <Select value={contentFilter} onValueChange={setContentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="همه محتواها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="pdf">فایل PDF</SelectItem>
                  <SelectItem value="typed_question">سوال تایپ شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">وضعیت نمایش</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="همه وضعیت‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="inactive">غیرفعال</SelectItem>
                  <SelectItem value="scheduled">زمان‌بندی شده</SelectItem>
                  <SelectItem value="topic">مبحثی</SelectItem>
                  <SelectItem value="practice">تمرینی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={loadTests}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              بروزرسانی داده‌ها
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={resetFilters}
            >
              <FilterX className="h-4 w-4" />
              حذف فیلترها
            </Button>
            <span className="text-xs text-muted-foreground">
              {filteredTests.length === tests.length
                ? `${numberFormatter.format(filteredTests.length)} آزمون نمایش داده می‌شود`
                : `${numberFormatter.format(filteredTests.length)} از ${numberFormatter.format(tests.length)} آزمون نمایش داده می‌شود`}
            </span>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-6">
            <Activity className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">{error}</p>
              <p className="text-sm text-destructive/80">
                لطفاً اتصال خود را بررسی کرده و مجدداً تلاش کنید.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <div className="flex h-72 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTests.length === 0 ? (
        <Card className="py-16 text-center">
          <CardContent className="space-y-3">
            <CircleDot className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">آزمونی یافت نشد</h2>
            <p className="text-sm text-muted-foreground">
              هیچ آزمونی با فیلترهای انتخابی موجود نیست. فیلترها را تغییر دهید یا آزمون جدیدی بسازید.
            </p>
            <Button onClick={handleCreate} size="sm" className="mt-2">
              <Plus className="ml-2 h-4 w-4" />
              ساخت اولین آزمون
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredTests.map((test) => {
            const scheduleBadge = determineScheduleBadge(test);
            const foldersCount = Array.isArray(test.folders) ? test.folders.length : 0;
            const questionsCount = Array.isArray(test.questions) ? test.questions.length : 0;
            return (
              <Card key={test.id} className="flex h-full flex-col">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-semibold">{test.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {test.description || "بدون توضیحات"}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {test.test_type ? (
                        <Badge variant="outline" className="text-xs">
                          <Target className="ml-1 h-3.5 w-3.5" />
                          {testTypeLabels[test.test_type]}
                        </Badge>
                      ) : null}
                      {test.content_type ? (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="ml-1 h-3.5 w-3.5" />
                          {contentTypeLabels[test.content_type]}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={scheduleBadge.tone === "success" ? "default" : "outline"}
                      className={scheduleBadge.tone === "success" ? "bg-green-600" : ""}
                    >
                      {scheduleBadge.label}
                    </Badge>
                    {test.is_active === false ? (
                      <Badge variant="outline" className="text-xs text-destructive">
                        غیرفعال شده
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>شروع: {formatDateTime(test.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>پایان: {formatDateTime(test.end_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>مدت آزمون: {formatDuration(test.duration)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      <span>
                        مجموعه: {test.test_collection_detail?.name || "بدون مجموعه"}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Folder className="h-3.5 w-3.5" /> {foldersCount} پوشه
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> {questionsCount} سوال متصل
                    </span>
                    {test.frequency ? (
                      <span className="flex items-center gap-1">
                        <CircleDot className="h-3.5 w-3.5" /> تکرار: {test.frequency}
                      </span>
                    ) : null}
                  </div>
                </CardContent>

                <CardFooter className="mt-auto flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => handleViewResults(test.id)}
                    >
                      <Activity className="h-4 w-4" />
                      نتایج آزمون
                    </Button>
                    {test.test_collection_detail ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNavigateToCollection(test)}
                      >
                        مشاهده مجموعه
                      </Button>
                    ) : null}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditShortcut(test)}>
                        ویرایش / بازبینی
                      </DropdownMenuItem>
                      {test.test_collection_detail ? (
                        <DropdownMenuItem onClick={() => handleNavigateToCollection(test)}>
                          باز کردن مجموعه مرتبط
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(test.id)}
                      >
                        حذف آزمون
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TestsList;