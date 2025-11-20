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
  Trophy,
} from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
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

  const handleViewResult = (testId: number) => {
    navigate(`/panel/tests/result/${testId}`);
  };

  const handleViewAnswerSheet = (testId: number) => {
    navigate(`/panel/tests/${testId}/answer-sheet`);
  };

  const handleEditTest = (testId: number) => {
    navigate(`/panel/test-collections/${id}/tests/${testId}/edit`);
  };

  const handleTestStatistics = (testId: number) => {
    navigate(`/panel/tests/${testId}/statistics`);
  };

  const handleViewLeaderboard = (testId: number) => {
    navigate(`/panel/tests/${testId}/leaderboard`);
  };

  const getTestStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) {
      return { label: "آغاز نشده", variant: "secondary" as const, isActive: false };
    } else if (now > end) {
      return { label: "پایان یافته", variant: "destructive" as const, isActive: false };
    } else {
      return { label: "فعال", variant: "default" as const, isActive: true };
    }
  };

  const formatTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "پایان یافته";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} روز و ${hours} ساعت`;
    } else if (hours > 0) {
      return `${hours} ساعت و ${minutes} دقیقه`;
    } else {
      return `${minutes} دقیقه`;
    }
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
                      to={`/panel/question-tests/${collection.id}/leaderboard`}
                    >
                      <Button className="w-full justify-start">
                      <BarChart3 className="ml-2 h-4 w-4" />
                      لیست نفرات برتر
                    </Button>
                    </Link>
                  </div>
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
              {collection.tests.map((test) => {
                const testStatus = getTestStatus(test.start_time, test.end_time);
                const timeRemaining = formatTimeRemaining(test.end_time);
                const canStartTest = testStatus.isActive;
                
                return (
                <Card
                  key={test.id}
                  className={`hover:shadow-md transition-shadow ${!canStartTest ? 'opacity-75' : ''}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{test.name}</CardTitle>
                        <Badge
                          variant={testStatus.variant}
                        >
                          {testStatus.label}
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
                                onClick={() => handleViewLeaderboard(test.id)}
                              >
                                <Trophy className="h-4 w-4 ml-2" />
                                برترین‌ها
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
                            <>
                              <DropdownMenuItem
                                onClick={() => handleViewResult(test.id)}
                              >
                                <CheckCircle className="h-4 w-4 ml-2" />
                                مشاهده نتیجه
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleViewAnswerSheet(test.id)}
                              >
                                <FileText className="h-4 w-4 ml-2" />
                                مشاهده پاسخ‌نامه
                              </DropdownMenuItem>
                            </>
                          ) : testStatus.label === "پایان یافته" ? (
                            <>
                              {test.pdf_file_url && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(test.pdf_file_url, "_blank")
                                  }
                                >
                                  <FileText className="h-4 w-4 ml-2" />
                                  مشاهده سوالات
                                </DropdownMenuItem>
                              )}
                              {test.answers_file_url && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(test.answers_file_url, "_blank")
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 ml-2" />
                                  مشاهده پاسخنامه
                                </DropdownMenuItem>
                              )}
                              {!test.pdf_file_url && (
                                <DropdownMenuItem
                                  onClick={() => navigate(`/tests/${test.id}/review`)}
                                >
                                  <FileText className="h-4 w-4 ml-2" />
                                  مشاهده سوالات
                                </DropdownMenuItem>
                              )}
                            </>
                          ) : canStartTest ? (
                            <DropdownMenuItem
                              onClick={() => navigate(`/tests/${test.id}/info`)}
                            >
                              <PlayCircle className="h-4 w-4 ml-2" />
                              شروع آزمون
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem disabled>
                              <Clock className="h-4 w-4 ml-2" />
                              {testStatus.label}
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
                          شروع: {formatPersianDateTime(test.start_time).date} - {formatPersianDateTime(test.start_time).time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-red-600" />
                        <span>
                          پایان: {formatPersianDateTime(test.end_time).date} - {formatPersianDateTime(test.end_time).time}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        باقیمانده: 
                      </span>
                      <span className={canStartTest ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {timeRemaining}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
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
                        <div className="flex gap-2 w-full">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewResult(test.id)}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 ml-1" />
                            مشاهده نتیجه
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAnswerSheet(test.id)}
                            className="flex-1"
                          >
                            <FileText className="h-4 w-4 ml-1" />
                            پاسخ‌نامه
                          </Button>
                        </div>
                      ) : testStatus.label === "پایان یافته" ? (
                        <div className="flex gap-2 w-full">
                          {test.pdf_file_url ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(test.pdf_file_url, "_blank")}
                                className="flex-1"
                              >
                                <FileText className="h-4 w-4 ml-1" />
                                سوالات
                              </Button>
                              {test.answers_file_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(test.answers_file_url, "_blank")}
                                  className="flex-1"
                                >
                                  <CheckCircle className="h-4 w-4 ml-1" />
                                  پاسخنامه
                                </Button>
                              )}
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/tests/${test.id}/review`)}
                              className="w-full"
                            >
                              <FileText className="h-4 w-4 ml-1" />
                              مشاهده سوالات
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/tests/${test.id}/info`)}
                          disabled={!canStartTest}
                          className="w-full"
                        >
                          {canStartTest ? (
                            <>
                              <PlayCircle className="h-4 w-4 ml-1" />
                              شروع آزمون
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 ml-1" />
                              {testStatus.label}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              )})}
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
    </div>
  );
}
