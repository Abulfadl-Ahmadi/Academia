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
  let session: TestSession | null = location.state?.session || null;

  // State management
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [maxQuestions] = useState(60);
  const [gotoPage, setGotoPage] = useState("");
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionId, setSessionId] = useState<number | null>(session?.id || null);

  // Fullscreen
  const { isFullscreen, toggleFullscreen } = useFullscreen();

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

  // Check for existing session first
  const checkExistingSession = async () => {
    try {
      console.log("Checking for existing session...");
      const response = await axiosInstance.get("/get-answer/", {
        params: { test_id: parseInt(id!) }
      });
      
      // اگر session موجود است، اطلاعاتش را دریافت می‌کنیم
      console.log("Existing session found:", response.data);
      
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

  // Create session if not exists or get existing one
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
      
    } catch (error) {
      console.error("Error fetching test:", error);
      setError("خطا در دریافت اطلاعات آزمون");
    }
  };

  // Initialize
  useEffect(() => {
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
          navigate("/panel/tests/");
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
      await axiosInstance.post(`/sessions/${sessionId}/finish/`);
      toast.info("زمان آزمون به پایان رسید و پاسخ‌های شما ثبت شد");
      navigate("/panel/tests/");
    } catch (error) {
      console.error("Error auto-finishing test:", error);
      toast.error("خطا در ثبت خودکار پاسخ‌ها");
    }
  }, [sessionId, navigate]);

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
      await axiosInstance.post(`/sessions/${sessionId}/finish/`);
      setConfirmFinish(false);
      toast.success("آزمون با موفقیت به پایان رسید");
      navigate("/panel/tests/");
    } catch (error) {
      console.error("Error finishing test:", error);
      toast.error("خطا در ثبت پاسخ‌ها. لطفا مجددا تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, navigate]);

  const handleAnswer = useCallback(
    async (questionNumber: number, value: string) => {
      if (!sessionId) return;
      
      const previousAnswer = answers[questionNumber];
      const newAnswers = { ...answers, [questionNumber]: value };
      setAnswers(newAnswers);

      try {
        await axiosInstance.post("/submit-answer/", {
          session_id: sessionId,
          question_number: questionNumber,
          answer: value,
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
          <Button onClick={() => navigate("/panel/tests")}>
            بازگشت به لیست آزمون‌ها
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <h1 className="text-2xl font-bold p-4">آزمون: {test.name}</h1>
      <div className="flex items-center gap-4 p-4">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className={`font-mono font-bold ${getTimeColor()}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          Session ID: {sessionId || 'None'}
        </div>
      </div>
      
      {/* PDF Viewer */}
      <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-4">
        {test.pdf_file_url ? (
          <div className="h-full">
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
                console.log("PDF loaded with", e.doc.numPages, "pages");
              }}
              onPageChange={(e) => {
                setCurrentPage(e.currentPage);
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
              <p className="mt-4 text-lg text-muted-foreground">PDF در حال بارگیری...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPageRedesigned;
