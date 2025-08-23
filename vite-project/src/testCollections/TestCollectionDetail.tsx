import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { useUser } from "@/context/UserContext";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { AxiosError } from "axios";
import { 
  BookOpen, 
  Users, 
  Calendar,
  User,
  BarChart3,
  TrendingUp,
  Edit,
  ArrowLeft,
  FileText,
  PlayCircle,
  Clock,
  Plus,
  CheckCircle
} from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";

async function getDeviceId() {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
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
  course_details: Array<{id: number, title: string}>;
  tests?: Array<{
    id: number;
    name: string;
    description: string;
    questions_count: number;
    time_limit: number;
    is_active: boolean;
    created_at: string;
    pdf_file_url: string;
    answers_file_url?: string;
    status?: string; // "completed", "in_progress", etc.
  }>;
}

export default function TestCollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [collection, setCollection] = useState<TestCollection | null>(null);
  const [loading, setLoading] = useState(true);

  const handleStartTest = async (testId: number) => {
    try {
      const res = await axiosInstance.post(`/enter-test/`, {
        test_id: testId,
        device_id: await getDeviceId(),
      });

      console.log("Session started:", res.data);

      // ریدایرکت به صفحه آزمون با session data
      navigate(`/tests/${testId}/detail`, { state: { session: res.data } });
    } catch (err) {
      console.error("Error starting session:", err);
      const error = err as AxiosError<{error?: string, detail?: string, message?: string, redirect_to?: string}>;
      
      // Handle completed test case specifically
      if (error.response?.data?.error === "completed" && error.response?.data?.redirect_to) {
        toast.info(error.response.data.message || "شما قبلا این آزمون را به اتمام رسانده‌اید");
        navigate(error.response.data.redirect_to); // Redirect to the test results page
        return;
      }
      
      // Handle other errors
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("خطا در شروع آزمون");
      }
    }
  };
  
  const handleViewResult = (testId: number) => {
    navigate(`/panel/tests/result/${testId}`);
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
        <Button onClick={() => navigate("/panel/test-collections")} className="mt-4">
          <ArrowLeft className="ml-2 h-4 w-4" />
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
          <ArrowLeft className="h-4 w-4 ml-1" />
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
                <h3 className="text-sm font-medium text-muted-foreground">توضیحات</h3>
                <p className="mt-1 text-sm">
                  {collection.description || "توضیحی ارائه نشده"}
                </p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{collection.total_tests}</p>
                    <p className="text-xs text-muted-foreground">آزمون</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">{collection.student_count}</p>
                    <p className="text-xs text-muted-foreground">دانش‌آموز</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">کلاس‌های مرتبط</h3>
                <div className="flex flex-wrap gap-2">
                  {collection.course_details && collection.course_details.length > 0 ? (
                    collection.course_details.map((course) => (
                      <Badge key={course.id} variant="outline">
                        {course.title}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">هیچ کلاسی متصل نشده</p>
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
                  تاریخ ایجاد: {new Date(collection.created_at).toLocaleDateString('fa-IR')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* عملیات */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>عملیات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user?.role === "teacher" ? (
                <>
                  <Link to={`/panel/test-collections/${collection.id}/statistics`}>
                    <Button className="w-full justify-start">
                      <BarChart3 className="ml-2 h-4 w-4" />
                      مشاهده آمار
                    </Button>
                  </Link>
                  
                  <Link to={`/panel/test-collections/${collection.id}/progress`}>
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="ml-2 h-4 w-4" />
                      پیشرفت دانش‌آموزان
                    </Button>
                  </Link>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="ml-2 h-4 w-4" />
                    مدیریت آزمون‌ها
                  </Button>
                  
                  <Link to={`/panel/test-collections/${collection.id}/edit`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Edit className="ml-2 h-4 w-4" />
                      ویرایش مجموعه
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to={`/panel/test-collections/${collection.id}/progress`}>
                    <Button className="w-full justify-start">
                      <TrendingUp className="ml-2 h-4 w-4" />
                      پیشرفت من
                    </Button>
                  </Link>
                  
                  <div className="text-sm text-muted-foreground text-center p-4">
                    شما می‌توانید پیشرفت خود را در این مجموعه آزمون مشاهده کنید
                  </div>
                </>
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
            <div className="space-y-4">
              {collection.tests.map((test) => (
                <div key={test.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{test.name}</h3>
                        <Badge variant={test.is_active ? "default" : "secondary"}>
                          {test.is_active ? "فعال" : "غیرفعال"}
                        </Badge>
                      </div>
                      {test.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {test.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{test.questions_count} سوال</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{test.time_limit} دقیقه</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(test.created_at).toLocaleDateString('fa-IR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {user?.role === "teacher" ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(test.pdf_file_url, '_blank')}
                          >
                            <FileText className="h-4 w-4 ml-1" />
                            سوالات
                          </Button>
                          {test.answers_file_url && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(test.answers_file_url, '_blank')}
                            >
                              <CheckCircle className="h-4 w-4 ml-1" />
                              پاسخنامه
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : test.status === "completed" ? (
                        <Button 
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewResult(test.id)}
                        >
                          <CheckCircle className="h-4 w-4 ml-1" />
                          مشاهده نتیجه
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          onClick={() => handleStartTest(test.id)}
                        >
                          <PlayCircle className="h-4 w-4 ml-1" />
                          شروع آزمون
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">هیچ آزمونی یافت نشد</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {user?.role === "teacher" 
                  ? "هنوز آزمونی به این مجموعه اضافه نشده است."
                  : "هیچ آزمونی در این مجموعه موجود نیست."
                }
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
