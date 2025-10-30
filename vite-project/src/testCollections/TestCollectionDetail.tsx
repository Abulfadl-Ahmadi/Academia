import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { useUser } from "@/context/UserContext";
import {
  BookOpen,
  Users,
  Calendar,
  User,
  BarChart3,
  TrendingUp,
  Edit,
  ArrowRight,
  FileText,
  PlayCircle,
  Clock,
  Plus,
  CheckCircle,
  Share2,
  MoreHorizontal,
} from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ShareTestModal from "@/components/ShareTestModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper function for formatting Persian date and time
const formatPersianDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const persianDate = date.toLocaleDateString("fa-IR");
  const persianTime = date.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date: persianDate, time: persianTime };
};

interface Test {
  id: number;
  name: string;
  description: string;
  questions_count: number;
  time_limit: number;
  is_active: boolean;
  created_at: string;
  start_time: string;
  end_time: string;
  pdf_file_url: string;
  answers_file_url?: string;
  status?: string; // "completed", "in_progress", etc.
}

interface TestCollection {
  id: number;
  name: string;
  description: string;
  total_tests: number;
  student_count: number;
  created_by_name: string;
  created_at: string;
  is_active: boolean;
  course_details: Array<{ id: number; title: string }>;
  tests?: Array<Test>;
}

export default function TestCollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [collection, setCollection] = useState<TestCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  const handleViewResult = (testId: number) => {
    navigate(`/panel/tests/result/${testId}`);
  };

  const handleEditTest = (testId: number) => {
    navigate(`/panel/test-collections/${id}/tests/${testId}/edit`);
  };

  const handleTestStatistics = (testId: number) => {
    // فعلاً به صفحه نتایج آزمون هدایت می‌کنیم
    navigate(`/panel/tests/result/${testId}`);
  };

  const handleShareTest = (test: Test) => {
    setSelectedTest(test);
    setShareModalOpen(true);
  };

  const fetchCollection = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/test-collections/${id}/`);
      setCollection(response.data);
    } catch (error) {
      console.error("Error fetching test collection:", error);
      toast.error("خطا در دریافت جزئیات مجموعه آزمون");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">مجموعه آزمون یافت نشد</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          مجموعه آزمون مورد نظر وجود ندارد یا حذف شده است.
        </p>
        <Button
          onClick={() => navigate("/panel/test-collections")}
          className="mt-4"
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          بازگشت به لیست
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/panel/test-collections")}
        >
          <ArrowRight className="h-4 w-4 ml-1" />
          بازگشت
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <h1 className="text-3xl font-bold">{collection.name}</h1>
          <Badge variant={collection.is_active ? "default" : "secondary"}>
            {collection.is_active ? "فعال" : "غیرفعال"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* اطلاعات اصلی */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>جزئیات مجموعه آزمون</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  توضیحات
                </h3>
                <p className="mt-1 text-sm">
                  {collection.description || "توضیحی ارائه نشده"}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {collection.total_tests}
                    </p>
                    <p className="text-xs text-muted-foreground">آزمون</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {collection.student_count}
                    </p>
                    <p className="text-xs text-muted-foreground">دانش‌آموز</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  کلاس‌های مرتبط
                </h3>
                <div className="flex flex-wrap gap-2">
                  {collection.course_details &&
                  collection.course_details.length > 0 ? (
                    collection.course_details.map((course) => (
                      <Badge key={course.id} variant="outline">
                        {course.title}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      هیچ کلاسی متصل نشده
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>ایجاد شده توسط: {collection.created_by_name}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  تاریخ ایجاد:{" "}
                  {new Date(collection.created_at).toLocaleDateString("fa-IR")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* عملیات */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>عملیات</CardTitle>
            </CardHeader>
            <CardContent>
              {user?.role === "teacher" ? (
                <div className="gap-2 space-y-2">
                  <div>
                    <Link
                      to={`/panel/test-collections/${collection.id}/statistics`}
                    >
                      <Button className="w-full justify-start">
                        <BarChart3 className="ml-2 h-4 w-4" />
                        مشاهده آمار
                      </Button>
                    </Link>
                  </div>

                  <div>
                    <Link
                      to={`/panel/test-collections/${collection.id}/progress`}
                    >
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <TrendingUp className="ml-2 h-4 w-4" />
                        پیشرفت دانش‌آموزان
                      </Button>
                    </Link>
                  </div>

                  <div>
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="ml-2 h-4 w-4" />
                      مدیریت آزمون‌ها
                    </Button>
                  </div>

                  <div>
                    <Link to={`/panel/test-collections/${collection.id}/edit`}>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Edit className="ml-2 h-4 w-4" />
                        ویرایش مجموعه
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <Link
                    to={`/panel/test-collections/${collection.id}/progress`}
                  >
                    <Button className="w-full justify-start">
                      <TrendingUp className="ml-2 h-4 w-4" />
                      پیشرفت من
                    </Button>
                  </Link>

                  <div className="text-sm text-muted-foreground text-center p-4">
                    شما می‌توانید پیشرفت خود را در این مجموعه آزمون مشاهده کنید
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* لیست آزمون‌های موجود */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              آزمون‌های موجود
            </CardTitle>
            {user?.role === "teacher" && (
              <Link to={`/panel/test-collections/${id}/create-test`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 ml-1" />
                  افزودن آزمون
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {collection.tests && collection.tests.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {collection.tests.map((test) => (
                <Card
                  key={test.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{test.name}</CardTitle>
                        <Badge
                          variant={test.is_active ? "default" : "secondary"}
                        >
                          {test.is_active ? "فعال" : "غیرفعال"}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user?.role === "teacher" ? (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(test.pdf_file_url, "_blank")
                                }
                              >
                                <FileText className="h-4 w-4 ml-2" />
                                سوالات
                              </DropdownMenuItem>
                              {test.answers_file_url && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(test.answers_file_url, "_blank")
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 ml-2" />
                                  پاسخنامه
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleEditTest(test.id)}
                              >
                                <Edit className="h-4 w-4 ml-2" />
                                ویرایش آزمون
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleTestStatistics(test.id)}
                              >
                                <BarChart3 className="h-4 w-4 ml-2" />
                                آمار و نتایج
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(
                                    `/test-poster/${test.id}`,
                                    "_blank"
                                  )
                                }
                              >
                                <Share2 className="h-4 w-4 ml-2" />
                                اشتراک‌گذاری
                              </DropdownMenuItem>
                            </>
                          ) : test.status === "completed" ? (
                            <DropdownMenuItem
                              onClick={() => handleViewResult(test.id)}
                            >
                              <CheckCircle className="h-4 w-4 ml-2" />
                              مشاهده نتیجه
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => navigate(`/tests/${test.id}/info`)}
                            >
                              <PlayCircle className="h-4 w-4 ml-2" />
                              شروع آزمون
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {test.description && (
                      <CardDescription className="mt-2">
                        {test.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{test.questions_count} سوال</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{test.time_limit} دقیقه</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4 text-green-600" />
                        <span>
                          شروع: {formatPersianDateTime(test.start_time).date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-red-600" />
                        <span>
                          پایان: {formatPersianDateTime(test.end_time).date}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      ایجاد شده در:{" "}
                      {formatPersianDateTime(test.created_at).date} -{" "}
                      {formatPersianDateTime(test.created_at).time}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="flex gap-2 w-full">
                      {user?.role === "teacher" ? (
                        <div className="text-sm text-muted-foreground">
                          برای عملیات بیشتر از منوی سه نقطه استفاده کنید
                        </div>
                      ) : test.status === "completed" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewResult(test.id)}
                          className="w-full"
                        >
                          <CheckCircle className="h-4 w-4 ml-1" />
                          مشاهده نتیجه
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/tests/${test.id}/info`)}
                          className="w-full"
                        >
                          <PlayCircle className="h-4 w-4 ml-1" />
                          شروع آزمون
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                هیچ آزمونی یافت نشد
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {user?.role === "teacher"
                  ? "هنوز آزمونی به این مجموعه اضافه نشده است."
                  : "هیچ آزمونی در این مجموعه موجود نیست."}
              </p>
              {user?.role === "teacher" && (
                <Link to={`/panel/test-collections/${id}/create-test`}>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 ml-1" />
                    اولین آزمون را اضافه کنید
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Test Modal */}
      {selectedTest && collection && (
        <ShareTestModal
          test={selectedTest}
          collection={collection}
          isOpen={shareModalOpen}
          onOpenChange={setShareModalOpen}
          shareUrl={`${window.location.origin}/test-collections/${collection.id}/tests/${selectedTest.id}`}
        />
      )}
    </div>
  );
}
