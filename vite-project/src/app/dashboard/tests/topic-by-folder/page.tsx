import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderSelector } from "@/components/FolderSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import axiosInstance from "@/lib/axios";
import {
  AlertCircle,
  BookOpen,
  Clock,
  ExternalLink,
  Layers,
  Loader2,
} from "lucide-react";

interface TopicTestSummary {
  id: number;
  name: string;
  description?: string | null;
  duration?: string | number | null;
  duration_formatted?: string | null;
  test_collection_detail?: {
    id: number;
    name: string;
  } | null;
  folders?: number[] | null;
  is_active?: boolean | null;
  created_at?: string | null;
}

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

const normalizeResponseToArray = (payload: unknown): TopicTestSummary[] => {
  if (Array.isArray(payload)) {
    return payload as TopicTestSummary[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { results?: TopicTestSummary[] }).results)
  ) {
    return (payload as { results: TopicTestSummary[] }).results;
  }

  return [];
};

export default function TopicTestsByFolderPage() {
  const navigate = useNavigate();
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [tests, setTests] = useState<TopicTestSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchTests = async () => {
      if (!selectedFolderId) {
        setTests([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get("/tests/", {
          params: {
            test_type: "topic_based",
            folder: selectedFolderId,
            is_active: true,
          },
        });
        if (!isMounted) {
          return;
        }
        const normalized = normalizeResponseToArray(response.data);
        setTests(normalized);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error("Error fetching topic tests by folder", err);
        setError("بارگذاری آزمون‌ها با خطا مواجه شد. لطفاً دوباره تلاش کنید.");
        setTests([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTests();

    return () => {
      isMounted = false;
    };
  }, [selectedFolderId]);

  const handleFolderSelectionChange = (folderIds: number[]) => {
    if (folderIds.length === 0) {
      setSelectedFolderId(null);
      return;
    }
    const newestId = folderIds[folderIds.length - 1];
    setSelectedFolderId(newestId);
  };

  const sortedTests = useMemo(() => {
    return [...tests].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });
  }, [tests]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">آزمون‌ ساز</h1>
        <p className="text-sm text-muted-foreground">
          پوشه مدنظر خود را انتخاب کنید تا تمام آزمون‌های مبحثی مرتبط با آن را ببینید و وارد
          شوید.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">انتخاب مبحث</CardTitle>
          <CardDescription>
            با انتخاب یک مبحث، آزمون‌های آزاد مرتبط با آن برای شما فهرست می‌شود.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FolderSelector
            selectedFolderIds={selectedFolderId ? [selectedFolderId] : []}
            onSelectionChange={handleFolderSelectionChange}
            showSelectedCount={false}
            required
          />
        </CardContent>
      </Card>

      {!selectedFolderId ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted-foreground">
            <Layers className="h-10 w-10 text-muted-foreground" />
            <p>برای مشاهده آزمون‌ها، ابتدا یک پوشه را از لیست بالا انتخاب کنید.</p>
          </CardContent>
        </Card>
      ) : null}

      {selectedFolderId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">آزمون‌های مرتبط</CardTitle>
            <CardDescription>
              {loading
                ? "در حال بارگذاری آزمون‌های مبحثی..."
                : "آزمون‌های آزادِ مرتبط با پوشه انتخاب شده"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">خطا در دریافت اطلاعات</p>
                  <p className="text-sm text-destructive/80">{error}</p>
                </div>
              </div>
            ) : null}

            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : null}

            {!loading && !error && sortedTests.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted-foreground">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
                <p>هیچ آزمون فعالی برای این پوشه ثبت نشده است.</p>
              </div>
            ) : null}

            {!loading && !error && sortedTests.length > 0
              ? sortedTests.map((test) => (
                  <Card key={test.id} className="border border-border/70">
                    <CardHeader className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-xl font-semibold">{test.name}</CardTitle>
                          <CardDescription className="text-sm leading-6">
                            {test.description || "بدون توضیحات"}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">آزمون مبحثی</Badge>
                          {test.is_active === false ? (
                            <Badge variant="secondary" className="text-xs text-muted-foreground">
                              غیرفعال
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>مدت آزمون: {formatDuration(test.duration ?? test.duration_formatted)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          <span>
                            پوشه‌های مرتبط: {Array.isArray(test.folders) ? test.folders.length : 0} پوشه
                          </span>
                        </div>
                      </div>
                      {test.test_collection_detail ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[11px] font-semibold">
                            مجموعه: {test.test_collection_detail.name}
                          </Badge>
                        </div>
                      ) : null}
                      <Separator />
                    </CardContent>
                    <CardFooter className="flex items-center justify-end">
                      <Button
                        type="button"
                        onClick={() => navigate(`/tests/${test.id}/info`)}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        مشاهده جزئیات آزمون
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
