import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { AxiosError } from "axios";
import { 
  FileText, 
  Clock, 
  Calendar,
  AlertTriangle,
  PlayCircle,
  ArrowLeft,
  CheckCircle,
  Users,
  BookOpen,
  Shield,
  Timer
} from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

async function getDeviceId() {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
}

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
  status?: string;
  collection: {
    id: number;
    name: string;
    created_by_name: string;
  };
}

export default function TestDetailPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const fetchTest = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/tests/${testId}/`);
      setTest(response.data);
    } catch (err) {
      console.error("Error fetching test:", err);
      toast.error("خطا در بارگیری اطلاعات آزمون");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [testId, navigate]);

  useEffect(() => {
    if (testId) {
      fetchTest();
    }
  }, [testId, fetchTest]);

  const handleStartTest = async () => {
    if (!test) return;
    
    try {
      setStarting(true);
      const res = await axiosInstance.post(`/enter-test/`, {
        test_id: test.id,
        device_id: await getDeviceId(),
      });

      console.log("Session started:", res.data);
      toast.success("آزمون با موفقیت شروع شد");
      setConfirmDialogOpen(false);

      // ریدایرکت به صفحه آزمون با session data
      navigate(`/tests/${test.id}/detail`, { state: { session: res.data } });
    } catch (err) {
      console.error("Error starting session:", err);
      const error = err as AxiosError<{error?: string, detail?: string, message?: string, redirect_to?: string}>;
      
      // Handle completed test case specifically
      if (error.response?.data?.error === "completed" && error.response?.data?.redirect_to) {
        toast.info(error.response.data.message || "شما قبلا این آزمون را به اتمام رسانده‌اید");
        navigate(error.response.data.redirect_to);
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
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">در حال بارگیری اطلاعات آزمون...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">آزمون یافت نشد</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          آزمون مورد نظر وجود ندارد یا دسترسی به آن ندارید.
        </p>
        <Button className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 ml-1" />
          بازگشت
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 ml-1" />
          بازگشت
        </Button>
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-3xl font-bold">{test.name}</h1>
          <Badge variant={test.is_active ? "default" : "secondary"}>
            {test.is_active ? "فعال" : "غیرفعال"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Test Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                جزئیات آزمون
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {test.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">توضیحات</h3>
                  <p className="mt-1 text-sm">{test.description}</p>
                </div>
              )}
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{test.questions_count}</p>
                    <p className="text-xs text-muted-foreground">سوال</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">{test.time_limit}</p>
                    <p className="text-xs text-muted-foreground">دقیقه</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">مجموعه آزمون</h3>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-green-500" />
                  <Link 
                    to={`/test-collections/${test.collection.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {test.collection.name}
                  </Link>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>مدرس: {test.collection.created_by_name}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    تاریخ ایجاد: {new Date(test.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <PlayCircle className="h-4 w-4" />
                  <span>
                    زمان شروع: {new Date(test.start_time).toLocaleDateString('fa-IR')} - {new Date(test.start_time).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>
                    زمان پایان: {new Date(test.end_time).toLocaleDateString('fa-IR')} - {new Date(test.end_time).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rules and Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                قوانین و دستورالعمل آزمون
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Timer className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">مدت زمان آزمون</h4>
                  <p className="text-sm text-muted-foreground">
                    شما {test.time_limit} دقیقه وقت دارید. زمان از لحظه شروع آزمون محاسبه می‌شود.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">توجه مهم</h4>
                  <p className="text-sm text-muted-foreground">
                    پس از شروع آزمون، امکان بازگشت وجود ندارد. لطفاً مطمئن شوید که آماده هستید.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">امنیت آزمون</h4>
                  <p className="text-sm text-muted-foreground">
                    سوالات آزمون فقط پس از شروع رسمی آزمون قابل دسترسی خواهند بود. هرگونه تلاش برای دسترسی غیرمجاز به سوالات منجر به لغو آزمون می‌شود.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">نحوه پاسخ‌دهی</h4>
                  <p className="text-sm text-muted-foreground">
                    پس از شروع آزمون، سوالات به صورت PDF نمایش داده می‌شود و شما پاسخ‌ها را در سیستم ثبت می‌کنید.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">ذخیره خودکار</h4>
                  <p className="text-sm text-muted-foreground">
                    پاسخ‌های شما به صورت خودکار ذخیره می‌شود.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>شروع آزمون</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {test.status === "completed" ? (
                <>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      شما این آزمون را قبلاً تکمیل کرده‌اید
                    </p>
                  </div>
                  <Button className="w-full" onClick={() => navigate(`/tests/${test.id}/result`)}>
                    <CheckCircle className="h-4 w-4 ml-2" />
                    مشاهده نتیجه
                  </Button>
                </>
              ) : !test.is_active ? (
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    این آزمون در حال حاضر غیرفعال است
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <PlayCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">آماده شروع آزمون هستید؟</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      با کلیک روی دکمه زیر، زمان آزمون شروع خواهد شد
                    </p>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg" 
                    disabled={starting}
                    onClick={() => setConfirmDialogOpen(true)}
                  >
                    {starting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                        در حال شروع...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 ml-2" />
                        شروع آزمون
                      </>
                    )}
                  </Button>
                  
                  {/* Confirmation Dialog */}
                  <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>تأیید شروع آزمون</DialogTitle>
                        <DialogDescription className="space-y-2">
                          <p>
                            آیا مطمئن هستید که می‌خواهید آزمون "<strong>{test.name}</strong>" را شروع کنید؟
                          </p>
                          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="font-medium">توجه:</span>
                            </div>
                            <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                              <li>• زمان آزمون از همین الان شروع می‌شود</li>
                              <li>• امکان بازگشت وجود ندارد</li>
                              <li>• مدت زمان: {test.time_limit} دقیقه</li>
                              <li>• تعداد سوالات: {test.questions_count} سوال</li>
                            </ul>
                          </div>
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                          انصراف
                        </Button>
                        <Button onClick={handleStartTest} disabled={starting}>
                          {starting ? "در حال شروع..." : "تأیید و شروع"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
