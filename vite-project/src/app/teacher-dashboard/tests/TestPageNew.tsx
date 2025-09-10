import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { 
  Viewer,
  SpecialZoomLevel,
} from "@react-pdf-viewer/core";
import { scrollModePlugin } from '@react-pdf-viewer/scroll-mode';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Menu, 
  X, 
  LogOut, 
  Check, 
  Maximize, 
  Minimize,
  ZoomIn,
  ZoomOut,
  Clock,
  FileText,
  Send,
  Pause
} from "lucide-react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFullscreen } from "../../../hooks/useFullscreen";

interface Test {
  id: number;
  name: string;
  pdf_file_url: string;
  duration: number;
  total_questions?: number;
  test_collection?: number;
  collection?: {
    id: number;
    name: string;
  };
}

interface TestSession {
  id: number;
  test: number;
  user: number;
  start_time: string;
  end_time?: string;
}

const TestPageRedesigned: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const session: TestSession = location.state?.session;

  // State management
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [maxQuestions, setMaxQuestions] = useState(10); // پیش‌فرض کمتر، از test data تنظیم می‌شود
  const [gotoPage, setGotoPage] = useState("");
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionId, setSessionId] = useState<number | null>(null);

  // Fullscreen
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  // Helper function برای navigation به مجموعه آزمون یا لیست آزمون‌ها
  const navigateToTestSource = useCallback(() => {
    if (test?.test_collection) {
      navigate(`/panel/test-collections/${test.test_collection}`);
    } else {
      navigate("/panel/tests/");
    }
  }, [test, navigate]);

  // PDF plugins
  const scrollModePluginInstance = scrollModePlugin();
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const zoomPluginInstance = zoomPlugin();
  const { ZoomPopover } = zoomPluginInstance;

  const options = [
    { value: "1", label: "۱" },
    { value: "2", label: "۲" },
    { value: "3", label: "۳" },
    { value: "4", label: "۴" },
  ];

  // Session management functions
  const checkExistingSession = async () => {
    try {
      console.log("Checking for existing session...");
      const response = await axiosInstance.get("/get-answer/", {
        params: { test_id: parseInt(id!) }
      });
      
      if (response.data.session) {
        setSessionId(response.data.session.id);
        
        // محاسبه زمان باقی‌مانده
        const sessionStartTime = new Date(response.data.session.entry_time);
        const sessionEndTime = new Date(response.data.session.end_time);
        const now = new Date();
        const remainingTime = Math.max(0, Math.floor((sessionEndTime.getTime() - now.getTime()) / 1000));
        
        console.log("Time calculation from existing session:", {
          sessionStartTime,
          sessionEndTime,
          now,
          remainingTime
        });
        
        setTimeLeft(remainingTime);
        return true;
      }
      
      return false;
    } catch (error) {
      console.log("No existing session found:", error);
      return false;
    }
  };

  const createOrGetSession = async () => {
    try {
      console.log("Creating/Getting session for test:", id);
      const response = await axiosInstance.post("/enter-test/", {
        test_id: parseInt(id!),
        device_id: `device_${Date.now()}`
      });
      
      console.log("Session response:", response.data);
      setSessionId(response.data.session_id);
      
      // محاسبه زمان باقی‌مانده بر اساس session
      const sessionStartTime = new Date(response.data.entry_time);
      const sessionEndTime = new Date(response.data.end_time);
      const now = new Date();
      const remainingTime = Math.max(0, Math.floor((sessionEndTime.getTime() - now.getTime()) / 1000));
      
      console.log("Time calculation:", {
        sessionStartTime,
        sessionEndTime,
        now,
        remainingTime
      });
      
      setTimeLeft(remainingTime);
      
      return true;
    } catch (error) {
      console.error("Failed to create/get session:", error);
      toast.error("خطا در ایجاد جلسه آزمون");
      return false;
    }
  };

  // Load test data
  const loadTestData = async () => {
    try {
      const response = await axiosInstance.get(`/tests/${id}/`);
      const testData = response.data;
      console.log("Test data loaded:", testData);
      
      setTest(testData);
      console.log("Test collection ID:", testData.test_collection);
      
      // تنظیم تعداد سوالات
      console.log("Test total_questions:", testData.total_questions);
      if (testData.total_questions && testData.total_questions > 0) {
        setMaxQuestions(testData.total_questions);
        console.log("Set maxQuestions to:", testData.total_questions);
      } else {
        // اگر total_questions در response نبود یا صفر بود، سعی کن از keys استفاده کنی
        if (testData.keys && Array.isArray(testData.keys) && testData.keys.length > 0) {
          const maxFromKeys = Math.max(...testData.keys.map(k => k.question_number));
          setMaxQuestions(maxFromKeys);
          console.log("Set maxQuestions from keys to:", maxFromKeys);
        } else {
          // در نهایت پیش‌فرض 60 استفاده کن
          setMaxQuestions(60);
          console.log("Set maxQuestions to default: 60");
        }
      }
      
    } catch (error) {
      console.error("Error fetching test:", error);
      setError("خطا در دریافت اطلاعات آزمون");
    }
  };

  // Initialize session and load test data
  useEffect(() => {
    if (!id) return;

    const initialize = async () => {
      console.log("Initializing test page with session:", session);
      
      // چک کردن session موجود در location.state
      if (session?.id) {
        console.log("Using session from location.state:", session.id);
        setSessionId(session.id);
        setTimeLeft(session.remainingTime || 3600);
        await loadTestData();
        setIsLoading(false);
        return;
      }
      
      // اگر session وجود نداشت، check کن آیا session قبلی موجود است
      const existingSession = await checkExistingSession();
      if (existingSession) {
        await loadTestData();
        setIsLoading(false);
        return;
      }
      
      // اگر هیچ session وجود نداشت، یکی ایجاد کن
      if (!sessionId) {
        console.log("No session found, creating new one...");
        const sessionCreated = await createOrGetSession();
        if (!sessionCreated) {
          navigateToTestSource();
          return;
        }
      }
      
      await loadTestData();
      setIsLoading(false);
    };

    initialize();

    // Prevent page refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [id]);

  const handleAutoFinish = useCallback(async () => {
    if (!sessionId) return;
    
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/finish-test/", { session_id: sessionId });
      toast.info("زمان آزمون به پایان رسید و پاسخ‌های شما ثبت شد");
      navigateToTestSource();
    } catch (error) {
      console.error("Error auto-finishing test:", error);
      toast.error("خطا در ثبت خودکار پاسخ‌ها");
    }
  }, [sessionId, navigateToTestSource]);

  // Timer countdown
  useEffect(() => {
    if (!test || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [test, timeLeft, handleAutoFinish]);

  const handleFinishTest = useCallback(async () => {
    if (!sessionId) return;
    
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/finish-test/", { session_id: sessionId });
      setConfirmFinish(false);
      toast.success("آزمون با موفقیت به پایان رسید");
      navigateToTestSource();
    } catch (error) {
      console.error("Error finishing test:", error);
      toast.error("خطا در ثبت پاسخ‌ها. لطفا مجددا تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, navigateToTestSource]);

  const handleAnswer = useCallback(
    async (questionNumber: number, value: string) => {
      if (!sessionId) return;
      
      const previousAnswer = answers[questionNumber];
      
      // If clicking on the same answer, deselect it
      const newValue = previousAnswer === value ? "" : value;
      const newAnswers = { ...answers, [questionNumber]: newValue };
      setAnswers(newAnswers);

      try {
        await axiosInstance.post("/submit-answer/", {
          session_id: sessionId,
          question_number: questionNumber,
          answer: newValue,
        });
      } catch (error) {
        console.error("Error submitting answer:", error);
        setAnswers((prev) => ({ ...prev, [questionNumber]: previousAnswer }));
        toast.error(`خطا در ثبت پاسخ سوال ${questionNumber}`);
      }
    },
    [answers, sessionId]
  );

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours > 0 ? `${hours}:` : ""}${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getTimeColor = () => {
    if (timeLeft < 300) return "text-red-500";
    if (timeLeft < 600) return "text-orange-500";
    return "text-green-500";
  };

  const handleGoToPage = () => {
    const pageNum = parseInt(gotoPage);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum - 1);
      setGotoPage("");
    } else {
      toast.error(`شماره صفحه باید بین 1 و ${totalPages} باشد`);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / maxQuestions) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">در حال بارگیری آزمون...</p>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">خطا در بارگیری آزمون</h3>
          <p className="mb-6 text-gray-600 dark:text-gray-300">{error}</p>
          <Button onClick={() => navigateToTestSource()}>
            بازگشت به لیست آزمون‌ها
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Confirmation Dialogs */}
      <Dialog open={confirmFinish} onOpenChange={setConfirmFinish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              اتمام آزمون
            </DialogTitle>
            <DialogDescription>
              آیا از اتمام آزمون و ثبت پاسخ‌های خود اطمینان دارید؟
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>پاسخ داده شده:</span>
                  <span className="font-mono">{answeredCount} از {maxQuestions}</span>
                </div>
                <Progress value={progressPercentage} className="mt-2 h-2" />
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmFinish(false)}
              disabled={isSubmitting}
            >
              ادامه آزمون
            </Button>
            <Button onClick={handleFinishTest} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  در حال ثبت...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  بله، آزمون را به پایان برسان
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmExit} onOpenChange={setConfirmExit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pause className="h-5 w-5" />
              خروج موقت از آزمون
            </DialogTitle>
            <DialogDescription>
              آیا می‌خواهید موقتاً از آزمون خارج شوید؟ پاسخ‌های شما ذخیره شده و می‌توانید
              بعداً ادامه دهید.
              <div className="mt-2 text-xs text-muted-foreground">
                ⚠️ توجه: زمان آزمون همچنان ادامه پیدا می‌کند
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmExit(false)}>
              ماندن در آزمون
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmExit(false);
                navigateToTestSource();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              خروج موقت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left side - Test info and timer */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{test.name}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className={`font-mono font-bold ${getTimeColor()}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Center - PDF Controls */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const viewer = document.querySelector('.rpv-core__viewer');
                        if (viewer) {
                          const prevButton = viewer.querySelector('[data-testid="page-navigation__previous-button"]') as HTMLButtonElement;
                          if (prevButton && !prevButton.disabled) {
                            prevButton.click();
                          }
                        }
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>صفحه قبل</TooltipContent>
                </Tooltip>

                <div className="flex items-center gap-2 px-2">
                  <Input
                    type="number"
                    value={gotoPage}
                    onChange={(e) => setGotoPage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleGoToPage()}
                    placeholder={`${currentPage + 1}`}
                    className="w-16 h-8 text-center text-xs"
                    min="1"
                    max={totalPages}
                  />
                  <span className="text-xs text-muted-foreground">از {totalPages}</span>
                  {gotoPage && (
                    <Button size="sm" variant="ghost" onClick={handleGoToPage}>
                      برو
                    </Button>
                  )}
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const viewer = document.querySelector('.rpv-core__viewer');
                        if (viewer) {
                          const nextButton = viewer.querySelector('[data-testid="page-navigation__next-button"]') as HTMLButtonElement;
                          if (nextButton && !nextButton.disabled) {
                            nextButton.click();
                          }
                        }
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>صفحه بعد</TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const viewer = document.querySelector('.rpv-core__viewer');
                        if (viewer) {
                          const zoomOutButton = viewer.querySelector('[data-testid="zoom__out-button"]') as HTMLButtonElement;
                          if (zoomOutButton) {
                            zoomOutButton.click();
                          }
                        }
                      }}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>کوچک‌نمایی</TooltipContent>
                </Tooltip>

                <ZoomPopover />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const viewer = document.querySelector('.rpv-core__viewer');
                        if (viewer) {
                          const zoomInButton = viewer.querySelector('[data-testid="zoom__in-button"]') as HTMLButtonElement;
                          if (zoomInButton) {
                            zoomInButton.click();
                          }
                        }
                      }}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>بزرگ‌نمایی</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFullscreen ? "خروج از تمام صفحه" : "تمام صفحه"}
              </TooltipContent>
            </Tooltip>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmExit(true)}
            >
              <Pause className="h-4 w-4 mr-1" />
              خروج موقت
            </Button>

            <Button
              size="sm"
              onClick={() => setConfirmFinish(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-1" />
              اتمام آزمون
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Answer Sheet Sidebar */}
        <div
          className={`bg-white dark:bg-gray-800 border-r shadow-lg transition-all duration-300 flex flex-col ${
            sidebarOpen ? "w-80" : "w-0"
          } overflow-hidden`}
        >
          {sidebarOpen && (
            <>
              {/* Progress Header */}
              <div className="p-4 border-b bg-blue-50 dark:bg-blue-950/20">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-lg">پاسخ‌برگ</h3>
                  <Badge variant="secondary" className="font-mono">
                    {answeredCount}/{maxQuestions}
                  </Badge>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>پیشرفت شما</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded border">
                  💡 برای لغو انتخاب، دوباره روی همان گزینه کلیک کنید
                </div>
              </div>

              {/* Answer Grid */}
              <div className="flex-1 overflow-auto p-4">
                <div className="space-y-4">
                  {Array.from({ length: Math.ceil(maxQuestions / 10) }).map((_, columnIndex) => (
                    <div key={columnIndex} className="">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 pb-1 border-b">
                        سوالات {columnIndex * 10 + 1} - {Math.min((columnIndex + 1) * 10, maxQuestions)}
                      </h4>
                      <div className="space-y-2">
                        {Array.from({ length: 10 }).map((_, rowIndex) => {
                          const questionNumber = columnIndex * 10 + rowIndex + 1;
                          if (questionNumber > maxQuestions) return null;
                          
                          const isAnswered = !!answers[questionNumber] && answers[questionNumber] !== "";
                          const currentAnswer = answers[questionNumber];
                          
                          return (
                            <div
                              key={questionNumber}
                              className={`p-2 rounded-lg border transition-all ${
                                isAnswered
                                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                                  : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                  سوال {questionNumber}
                                </span>
                                {isAnswered && currentAnswer && (
                                  <Badge variant="outline" className="text-xs">
                                    {currentAnswer}
                                  </Badge>
                                )}
                              </div>
                              
                              <RadioGroup.Root
                                value={answers[questionNumber] || ""}
                                className="grid grid-cols-4 gap-1"
                              >
                                {options.map((option) => (
                                  <RadioGroup.Item
                                    key={option.value}
                                    value={option.value}
                                    onMouseDown={() =>
                                      handleAnswer(questionNumber, option.value)
                                    }
                                    className="h-8 flex items-center justify-center text-xs border rounded transition-all hover:bg-gray-100 dark:hover:bg-gray-700 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:border-blue-600 cursor-pointer"
                                  >
                                    {option.label}
                                  </RadioGroup.Item>
                                ))}
                              </RadioGroup.Root>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-700">
          {test.pdf_file_url && (
            <Viewer
              fileUrl={test.pdf_file_url}
              plugins={[
                scrollModePluginInstance,
                pageNavigationPluginInstance,
                zoomPluginInstance,
              ]}
              defaultScale={SpecialZoomLevel.PageFit}
              onDocumentLoad={(e) => {
                setTotalPages(e.doc.numPages);
              }}
              onPageChange={(e) => {
                setCurrentPage(e.currentPage);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPageRedesigned;
