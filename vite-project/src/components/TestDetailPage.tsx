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
  CheckCircle,
  Users,
  BookOpen,
  Shield,
  Timer,
  ArrowRight
} from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "@/context/UserContext";
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
  duration: string;
  pdf_file_url: string;
  answers_file_url?: string;
  status?: string;
  collection: {
    id: number;
    name: string;
    created_by_name: string;
  };
  folders?: Array<{
    id: number;
    name: string;
  }>;
}

export default function TestDetailPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const fetchTest = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/question-tests/${testId}/detail/`);
      setTest(response.data);
      console.log("Fetched test data:", response.data);
    } catch (err) {
      console.error("Error fetching test:", err);
      const error = err as AxiosError;

      // Handle 401 Unauthorized specifically
      if (error.response?.status === 401) {
        toast.error("🔐 شما وارد حساب کاربری خود نشده‌اید. در حال انتقال به صفحه ورود...", {
          duration: 3000
        });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      // Handle 403 Forbidden
      if (error.response?.status === 403) {
        toast.error("⏰ هنوز آزمون شروع نشده است! لطفاً تا زمان شروع آزمون صبر کنید.", {
          duration: 5000
        });
        navigate(-1);
        return;
      }

      // Handle 404 Not Found
      if (error.response?.status === 404) {
        toast.error("🔍 آزمون مورد نظر یافت نشد. ممکن است حذف شده یا لینک اشتباه باشد. لطفاً لینک را بررسی کنید.", {
          duration: 5000
        });
        navigate(-1);
        return;
      }

      // Handle network/connection errors
      if (!error.response) {
        toast.error("🌐 مشکلی در اتصال به سرور وجود دارد. لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.", {
          duration: 5000
        });
        return;
      }

      // Generic error fallback
      toast.error("😔 متأسفیم! نتوانستیم اطلاعات آزمون را دریافت کنیم. لطفاً اتصال اینترنت خود را بررسی کرده و صفحه را تازه‌سازی کنید.", {
        duration: 5000
      });
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

    if (!user) {
      setConfirmDialogOpen(false);
      toast.error("🔐 شما وارد حساب کاربری خود نشده‌اید. در حال انتقال به صفحه ورود...", {
        duration: 3000,
      });
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      return;
    }

    try {
      setStarting(true);
      const res = await axiosInstance.post(`/enter-test/`, {
        test_id: test.id,
        device_id: await getDeviceId(),
      });

      console.log("Session started:", res.data);
      toast.success("🚀 فوق‌العاده! آزمون با موفقیت شروع شد. اکنون شما را به صفحه آزمون منتقل می‌کنیم. موفق باشید!", {
        duration: 3000
      });
      setConfirmDialogOpen(false);

      // ریدایرکت به صفحه آزمون با session data
      navigate(`/tests/${test.id}/detail`, { state: { session: res.data } });
    } catch (err) {
      console.error("Error starting session:", err);
      const error = err as AxiosError<{ error?: string, detail?: string, message?: string, redirect_to?: string }>;

      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        toast.error("🔐 جلسه شما منقضی شده است. لطفاً دوباره وارد سیستم شوید تا بتوانید آزمون را شروع کنید.", {
          duration: 6000
        });
        return;
      }

      // Handle 403 Forbidden
      if (error.response?.status === 403) {
        toast.error("🚫 متأسفانه شما مجوز شرکت در این آزمون را ندارید. لطفاً با مدرس خود تماس بگیرید.", {
          duration: 5000
        });
        return;
      }

      // Handle completed test case specifically
      if (error.response?.data?.error === "completed" && error.response?.data?.redirect_to) {
        toast.success("🎉 عالی! شما این آزمون را قبلاً با موفقیت تکمیل کرده‌اید. اکنون شما را به صفحه نتایج هدایت می‌کنیم تا بتوانید نمره و جزئیات عملکردتان را مشاهده کنید.", {
          duration: 4000
        });
        navigate(error.response.data.redirect_to);
        return;
      }

      // Handle specific error cases with user-friendly messages
      const errorData = error.response?.data;

      if (errorData?.error === "test_not_started") {
        toast.error("⏰ آزمون هنوز شروع نشده است! لطفاً تا زمان شروع آزمون صبر کنید.", {
          duration: 4000
        });
      } else if (errorData?.error === "test_ended") {
        toast.error("⏱️ متأسفانه زمان آزمون به پایان رسیده است و امکان شرکت در آن وجود ندارد.", {
          duration: 4000
        });
      } else if (errorData?.error === "already_participating") {
        toast.error("📝 شما در حال حاضر در این آزمون شرکت دارید. لطفاً به صفحه آزمون بروید و آن را تکمیل کنید.", {
          duration: 4000
        });
      } else if (errorData?.error === "device_mismatch") {
        toast.error("🔒 به نظر می‌رسد شما از دستگاه متفاوتی تلاش می‌کنید. لطفاً از همان دستگاهی که آزمون را شروع کرده‌اید استفاده کنید.", {
          duration: 5000
        });
      } else if (errorData?.error === "network_error") {
        toast.error("🌐 مشکلی در اتصال به سرور وجود دارد. لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.", {
          duration: 4000
        });
      } else if (errorData?.error) {
        toast.error(`😕 ${errorData.error} - اگر این مشکل ادامه دارد، لطفاً با پشتیبانی تماس بگیرید.`, {
          duration: 4000
        });
      } else if (errorData?.detail) {
        toast.error(`💭 ${errorData.detail}`, {
          duration: 4000
        });
      } else if (errorData?.message) {
        toast.error(`📢 ${errorData.message}`, {
          duration: 4000
        });
      } else if (!error.response) {
        // Network error - no response from server
        toast.error("🌐 نتوانستیم به سرور متصل شویم. لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.", {
          duration: 5000
        });
      } else {
        toast.error("😓 متأسفیم! نتوانستیم آزمون را شروع کنیم. این مشکل ممکن است موقتی باشد. لطفاً چند دقیقه صبر کرده و دوباره تلاش کنید یا با پشتیبانی در تماس باشید.", {
          duration: 6000
        });
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
          <p className="mt-4 text-muted-foreground">📚 در حال بارگیری اطلاعات آزمون...</p>
          <p className="mt-2 text-sm text-muted-foreground">لطفاً کمی صبر کنید، تقریباً آماده است!</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">😕 آزمون مورد نظر یافت نشد</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          متأسفانه آزمونی با این شناسه وجود ندارد یا ممکن است دسترسی به آن محدود باشد.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          لطفاً لینک را بررسی کرده و دوباره تلاش کنید یا با مدرس خود تماس بگیرید.
        </p>
        <Button className="mt-4" onClick={() => navigate(-1)}>
          <ArrowRight className="h-4 w-4 ml-1" />
          بازگشت به صفحه قبل
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6 mt-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowRight className="h-4 w-4 ml-1" />
          بازگشت
        </Button>
        {/* <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-3xl font-bold">{test.name}</h1>
          <Badge variant={test.is_active ? "default" : "secondary"}>
            {test.is_active ? "فعال" : "غیرفعال"}
          </Badge>
        </div> */}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Test Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <p className="text-lg">{test.name}</p>
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
                    <p className="persian-number text-sm font-medium">{test.questions_count}</p>
                    <p className="text-xs text-muted-foreground">سوال</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="persian-number text-sm font-medium">{test.time_limit}</p>
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

              {test.folders && test.folders.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">مباحث آزمون</h3>
                    <div className="flex flex-wrap gap-2">
                      {test.folders.map((folder) => (
                        <Badge key={folder.id} variant="outline" className="text-xs">
                          {folder.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

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
              <div className="flex flex-row items-start gap-3">
                <Timer className="flex-none w-5 text-orange-500 mt-0.5" />
                <div className="grow ">
                  <h4 className="font-medium">مدت زمان آزمون</h4>
                  <p className="text-sm text-muted-foreground">
                    شما {test.time_limit} دقیقه وقت دارید. زمان از لحظه شروع آزمون محاسبه می‌شود.
                  </p>
                </div>
              </div>

              <div className="flex flex-row items-start gap-3">
                <AlertTriangle className="flex-none h-5 w-5 text-red-500 mt-0.5" />
                <div className="grow ">
                  <h4 className="font-medium">توجه مهم</h4>
                  <p className="text-sm text-muted-foreground">
                    پس از شروع آزمون، امکان بازگشت وجود ندارد. لطفاً مطمئن شوید که آماده هستید.
                  </p>
                </div>
              </div>

              <div className="flex flex-row items-start gap-3">
                <Shield className="flex-none h-5 w-5 text-red-500 mt-0.5" />
                <div className="grow">
                  <h4 className="font-medium">امنیت آزمون</h4>
                  <p className="text-sm text-muted-foreground">
                    سوالات آزمون فقط پس از شروع رسمی آزمون قابل دسترسی خواهند بود. هرگونه تلاش برای دسترسی غیرمجاز به سوالات منجر به لغو آزمون می‌شود.
                  </p>
                </div>
              </div>

              <div className="flex flex-row items-start gap-3">
                <FileText className="flex-none h-5 w-5 text-blue-500 mt-0.5" />
                <div className="grow">
                  <h4 className="font-medium">نحوه پاسخ‌دهی</h4>
                  <p className="text-sm text-muted-foreground">
                    پس از شروع آزمون، سوالات به صورت PDF نمایش داده می‌شود و شما پاسخ‌ها را در سیستم ثبت می‌کنید.
                  </p>
                </div>
              </div>

              <div className="flex flex-row items-start gap-3">
                <CheckCircle className="flex-none h-5 w-5 text-green-500 mt-0.5" />
                <div className="grow">
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
                  <Button className="w-full" onClick={() => {
                    toast.success("📈 عالی! در حال انتقال به صفحه نتایج... شما می‌توانید نمره، تحلیل عملکرد و پاسخ‌های خود را مشاهده کنید.", {
                      duration: 3000
                    });
                    navigate(`/tests/${test.id}/result`);
                  }}>
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
                    onClick={() => {
                      if (!user) {
                        toast.error("🔐 شما وارد حساب کاربری خود نشده‌اید. در حال انتقال به صفحه ورود...", {
                          duration: 3000,
                        });
                        setTimeout(() => {
                          navigate("/login");
                        }, 2000);
                        return;
                      }
                      setConfirmDialogOpen(true);
                      toast.info("💡 لطفاً قبل از شروع آزمون، قوانین و دستورالعمل‌ها را با دقت مطالعه کنید و مطمئن شوید که شرایط مناسبی برای آزمون دارید.", {
                        duration: 4000
                      });
                    }}
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
                        <Button variant="outline" onClick={() => {
                          setConfirmDialogOpen(false);
                          toast.info("👍 بدون مشکل! شما می‌توانید هر زمان که احساس آمادگی کردید، دوباره آزمون را شروع کنید. موفق باشید!", {
                            duration: 3000
                          });
                        }}>
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