import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { getFileAccessUrl } from "@/lib/config";
import { 
  Viewer,
  SpecialZoomLevel,
} from "@react-pdf-viewer/core";
import { scrollModePlugin } from '@react-pdf-viewer/scroll-mode';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { 
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
  Pause,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { MathPreview } from "@/components/MathPreview";

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
  content_type?: string;
  questions?: Array<{
    id: number;
    public_id: string;
    question_text: string;
    difficulty_level: 'easy' | 'medium' | 'hard';
    folders: number[];
    folders_names: string[];
    options: Array<{
      id: number;
      option_text: string;
      order: number;
    }>;
    correct_option?: number;
    detailed_solution?: string;
    images?: Array<{
      id: number;
      image: string;
      alt_text?: string;
      order: number;
    }>;
    detailed_solution_images?: Array<{
      id: number;
      image: string;
      alt_text?: string;
      order: number;
    }>;
    created_at: string;
  }>;
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [fileAccessToken, setFileAccessToken] = useState<string | null>(null);

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
        
        // Extract file access token from existing session
        if (response.data.session.file_access_token) {
          setFileAccessToken(response.data.session.file_access_token);
          console.log("File access token restored from existing session");
        }
        
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
      
      // Capture the file access token
      if (response.data.file_access_token) {
        setFileAccessToken(response.data.file_access_token);
        console.log("File access token set:", response.data.file_access_token);
      }
      
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
      console.log("Test content_type:", testData.content_type);
      
      if (testData.content_type === 'typed_question' && testData.questions) {
        // برای آزمون‌های سوال‌محور، تعداد سوالات را از آرایه سوالات بگیر
        setMaxQuestions(testData.questions.length);
        console.log("Set maxQuestions for question test to:", testData.questions.length);
      } else if (testData.total_questions && testData.total_questions > 0) {
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
      // Remove the answer if deselected, otherwise set
      const newAnswers = { ...answers };
      if (newValue === "") {
        delete newAnswers[questionNumber];
      } else {
        newAnswers[questionNumber] = newValue;
      }
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
    if (timeLeft < 300) return "text-destructive";
    if (timeLeft < 600) return "text-orange-500";
    return "text-green-600";
  };

  // Navigation functions
  const goToNextQuestion = () => {
    if (test?.questions && currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    if (test?.questions && index >= 0 && index < test.questions.length) {
      setCurrentQuestionIndex(index);
    }
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">در حال بارگیری آزمون...</p>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">خطا در بارگیری آزمون</h3>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <Button onClick={() => navigateToTestSource()}>
            بازگشت به لیست آزمون‌ها
          </Button>
        </div>
      </div>
    );
  }

  // Question-based test interface
  if (test?.content_type === 'typed_question') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmExit(true)}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <ArrowRight className="w-4 h-4" />
                  خروج
                </Button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-bold truncate">{test.name}</h1>
                  {test.description && (
                    <p className="text-sm text-muted-foreground truncate">{test.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className={`flex items-center gap-2 text-lg font-mono ${getTimeColor()}`}>
                  <Clock className="w-5 h-5" />
                  {formatTime(timeLeft)}
                </div>
                <Button
                  onClick={() => setConfirmFinish(true)}
                  className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                  size="sm"
                >
                  پایان آزمون
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="max-w-4xl mx-auto px-4 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-muted-foreground mb-2 gap-1">
              <span>سوال {currentQuestionIndex + 1} از {test.questions?.length || 0}</span>
              <span>{Math.round(((currentQuestionIndex + 1) / (test.questions?.length || 1)) * 100)}% تکمیل شده</span>
            </div>
            <Progress value={((currentQuestionIndex + 1) / (test.questions?.length || 1)) * 100} className="h-2" />
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex flex-1 flex-col md:flex-row">
          {/* Sidebar - Question Navigator */}
          <div className={`${sidebarOpen ? 'h-64 md:h-auto md:w-80' : 'h-0 md:w-0'} transition-all duration-300 bg-muted border-b md:border-b-0 md:border-r overflow-hidden`}>
            <div className="p-4 h-full md:h-auto">
              <h3 className="font-semibold mb-4">سوالات آزمون</h3>
              <div className="grid grid-cols-5 gap-2 md:grid-cols-5">
                {test.questions?.map((question, index) => {
                  const selectedAnswer = answers[index + 1];
                  const selectedOptionIndex = selectedAnswer ? 
                    question.options.findIndex(opt => opt.id.toString() === selectedAnswer) : -1;
                  
                  return (
                    <div key={question.id} className="relative">
                      <button
                        onClick={() => goToQuestion(index)}
                        className={`p-2 text-sm font-medium rounded border transition-colors w-full ${
                          index === currentQuestionIndex
                            ? 'bg-primary text-primary-foreground border-primary'
                            : answers[index + 1]
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600'
                            : 'bg-card text-card-foreground border-border hover:bg-muted'
                        }`}
                      >
                        {index + 1}
                      </button>
                      {selectedAnswer && selectedOptionIndex >= 0 && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {selectedOptionIndex + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="flex-1 p-4 md:p-6">
            {test.questions && test.questions[currentQuestionIndex] && (
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded text-sm font-mono">
                      سوال {currentQuestionIndex + 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Menu className="w-4 h-4" />
                      {sidebarOpen ? 'بستن' : 'باز کردن'} ناوبری
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Question Text */}
                  <div className="text-base md:text-lg">
                    <MathPreview text={test.questions[currentQuestionIndex].question_text} />
                  </div>

                  {/* Question Images */}
                  {test.questions[currentQuestionIndex].images && test.questions[currentQuestionIndex].images.length > 0 && (
                    <div className="flex flex-col gap-4">
                      {test.questions[currentQuestionIndex].images.map((image, idx) => (
                        <div key={image.id} className="flex justify-center">
                          <img 
                            src={image.image} 
                            alt={image.alt_text || `سوال ${currentQuestionIndex + 1} - تصویر ${idx + 1}`}
                            className="max-w-full h-auto rounded-lg border border-border shadow-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Question Options */}
                  <RadioGroup.Root
                    value={answers[currentQuestionIndex + 1] || ""}
                    onValueChange={(value) => handleAnswer(currentQuestionIndex + 1, value)}
                    className="space-y-4"
                  >
                    {test.questions[currentQuestionIndex].options.map((option, optionIndex) => {
                      const isSelected = answers[currentQuestionIndex + 1] === option.id.toString();
                      return (
                        <div key={option.id} className="flex items-start space-x-3 space-x-reverse">
                          <RadioGroup.Item
                            value={option.id.toString()}
                            id={`q${test.questions[currentQuestionIndex].id}-o${option.id}`}
                            className="w-5 h-5 mt-0.5 flex-shrink-0"
                          />
                          <Label
                            htmlFor={`q${test.questions[currentQuestionIndex].id}-o${option.id}`}
                            className={`flex-1 cursor-pointer text-base leading-relaxed p-3 rounded-lg border transition-all ${
                              isSelected
                                ? 'bg-primary/5 border-primary/20 shadow-sm'
                                : 'border-transparent hover:bg-muted'
                            }`}
                            onClick={e => {
                              if (isSelected) {
                                e.preventDefault();
                                handleAnswer(currentQuestionIndex + 1, option.id.toString());
                              }
                            }}
                          >
                            <span className="font-medium text-muted-foreground mr-2">
                              {['۱)', '۲)', '۳)', '۴)'][optionIndex] || `${optionIndex + 1})`}
                            </span>
                            <MathPreview text={option.option_text} />
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup.Root>

                  {/* Navigation Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={goToPreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center gap-2 justify-center"
                    >
                      <ChevronRight className="w-4 h-4" />
                      سوال قبلی
                    </Button>

                    <div className="text-sm text-muted-foreground text-center sm:text-left">
                      {currentQuestionIndex + 1} از {test.questions.length}
                    </div>

                    <Button
                      variant="outline"
                      onClick={goToNextQuestion}
                      disabled={currentQuestionIndex === (test.questions.length - 1)}
                      className="flex items-center gap-2 justify-center"
                    >
                      سوال بعدی
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Detailed Solution Section */}
                  {(test.questions[currentQuestionIndex].detailed_solution || 
                    (test.questions[currentQuestionIndex].detailed_solution_images && 
                     test.questions[currentQuestionIndex].detailed_solution_images.length > 0)) && (
                    <div className="pt-6 border-t space-y-4">
                      <details className="cursor-pointer group">
                        <summary className="font-semibold text-base hover:text-primary transition-colors">
                          📝 راه‌حل تفصیلی
                        </summary>
                        <div className="mt-4 space-y-4 pt-4 border-t">
                          {test.questions[currentQuestionIndex].detailed_solution && (
                            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                              <MathPreview text={test.questions[currentQuestionIndex].detailed_solution} />
                            </div>
                          )}
                          {test.questions[currentQuestionIndex].detailed_solution_images && 
                           test.questions[currentQuestionIndex].detailed_solution_images.length > 0 && (
                            <div className="flex flex-col gap-4">
                              {test.questions[currentQuestionIndex].detailed_solution_images.map((image, idx) => (
                                <div key={image.id} className="flex justify-center">
                                  <img 
                                    src={image.image} 
                                    alt={image.alt_text || `راه‌حل ${idx + 1}`}
                                    className="max-w-full h-auto rounded-lg border border-border shadow-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Exit Confirmation Dialog */}
        <Dialog open={confirmExit} onOpenChange={setConfirmExit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>خروج از آزمون</DialogTitle>
              <DialogDescription>
                آیا مطمئن هستید که می‌خواهید از آزمون خارج شوید؟ پاسخ‌های شما ذخیره شده است.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmExit(false)}>
                ماندن در آزمون
              </Button>
              <Button variant="destructive" onClick={() => navigate('/panel/tests')}>
                خروج
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Finish Confirmation Dialog */}
        <Dialog open={confirmFinish} onOpenChange={setConfirmFinish}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>اتمام آزمون</DialogTitle>
              <DialogDescription>
                آیا از اتمام آزمون و ثبت پاسخ‌های خود اطمینان دارید؟
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmFinish(false)}>
                بازگشت
              </Button>
              <Button onClick={handleFinishTest}>
                تأیید و پایان آزمون
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
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
              <div className="mt-2 p-3 bg-primary/5 rounded-lg">
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
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
      <div className="bg-card border-b shadow-sm px-4 py-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          {/* Left side - Test info and timer */}
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex-shrink-0"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium text-sm truncate">{test.name}</span>
            </div>
            
            <div className={`flex items-center gap-2 bg-muted px-3 py-1 rounded-lg flex-shrink-0 ${getTimeColor()}`}>
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono font-bold text-sm">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Center - PDF Controls - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <TooltipProvider>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
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
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>صفحه بعد</TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
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
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="hidden sm:flex"
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
              className="flex-1 sm:flex-none"
            >
              <Pause className="h-4 w-4 mr-1" />
              خروج موقت
            </Button>

            <Button
              size="sm"
              onClick={() => setConfirmFinish(true)}
              className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
            >
              <Send className="h-4 w-4 mr-1" />
              اتمام آزمون
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Answer Sheet Sidebar */}
        <div
          className={`bg-card border-r shadow-lg transition-all duration-300 flex flex-col z-50 ${
            sidebarOpen ? "w-80" : "w-0"
          } overflow-hidden absolute md:relative h-screen md:h-auto top-0 right-0`}
        >
          {sidebarOpen && (
            <>
              {/* Progress Header */}
              <div className="p-4 border-b bg-primary/5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                  <h3 className="font-semibold text-lg">پاسخ‌برگ</h3>
                  <Badge variant="secondary" className="font-mono self-start sm:self-auto">
                    {answeredCount}/{maxQuestions}
                  </Badge>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>پیشرفت شما</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground bg-card p-2 rounded border">
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
                                  : "border-border bg-card"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                <span className="text-sm font-medium">
                                  سوال {questionNumber}
                                </span>
                                {isAnswered && currentAnswer && (
                                  <Badge variant="outline" className="text-xs self-start sm:self-auto">
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
                                    className="h-8 flex items-center justify-center text-xs border rounded transition-all hover:bg-muted data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary cursor-pointer"
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
        <div className="flex-1 bg-muted min-h-0">
          {test && test.id && fileAccessToken ? (
            <Viewer
              fileUrl={getFileAccessUrl(test.id, fileAccessToken)}
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
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">در حال بارگذاری PDF...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPageRedesigned;
