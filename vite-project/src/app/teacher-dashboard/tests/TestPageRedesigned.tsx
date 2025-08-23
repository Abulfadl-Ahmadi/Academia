import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "@/lib/axios";
// import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { 
  Viewer,
  SpecialZoomLevel,
  ScrollMode,
} from "@react-pdf-viewer/core";
// import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { scrollModePlugin } from '@react-pdf-viewer/scroll-mode';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
// Import CSS files in the main index file instead
// import "@react-pdf-viewer/core/lib/styles/index.css";
// import "@react-pdf-viewer/scroll-mode/lib/styles/index.css";
// import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
// import "@react-pdf-viewer/zoom/lib/styles/index.css";
import { ArrowLeft, ArrowRight, Menu, X, LogOut, Check, Maximize, Minimize } from "lucide-react";
import AnswerSheet from "./AnswerSheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// No need to import SwitchScrollMode separately as we get it from the plugin instance

import { useFullscreen } from "../../../hooks/useFullscreen";

interface Answer {
  question_number: number;
  answer: string;
}

interface Test {
  id: number;
  name: string;
  file: string;
  duration: number;
}

interface SwitchScrollModeProps {
  isSelected: boolean;
  onClick: () => void;
}

interface SwitchScrollModeProps {
  isSelected: boolean;
  onClick: () => void;
}

const TestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const session = location.state?.session;

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [confirmFinish, setConfirmFinish] = useState<boolean>(false);
  const [confirmExit, setConfirmExit] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [maxQuestions] = useState<number>(60); // Could be fetched from API
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toggle, isFullscreen: fullscreenStatus } = useFullscreen();
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Plugin instances
  const scrollModePluginInstance = scrollModePlugin();
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const zoomPluginInstance = zoomPlugin();
  
  // Extract components from plugins
  const { SwitchScrollMode } = scrollModePluginInstance;
  const { CurrentPageLabel } = pageNavigationPluginInstance;
  const {
    ZoomIn,
    ZoomOut
  } = zoomPluginInstance;

  useEffect(() => {
    if (!session) {
      navigate(`/tests/${id}/`);
      return;
    }
    
    // Fetch the test
    setIsLoading(true);
    axiosInstance
      .get(`/tests/${id}/`)
      .then((res) => {
        setTest(res.data);
        
        // Set initial duration in seconds
        setTimeLeft(res.data.duration * 60);
      })
      .catch((err) => {
        console.error("Error fetching test:", err);
        setError("خطا در دریافت اطلاعات آزمون");
      })
      .finally(() => {
        setIsLoading(false);
      });
      
    // Set up the beforeunload event
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Chrome requires returnValue to be set
      return ''; // This text is usually ignored by modern browsers
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Handle cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [id, navigate, session]);
  
  const handleFinishTest = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await axiosInstance.post(`/sessions/${session.id}/finish/`);
      setConfirmFinish(false);
      toast.success("آزمون با موفقیت به پایان رسید");
      navigate(`/panel/tests/`);
    } catch (error) {
      console.error("Error finishing test:", error);
      toast.error("خطا در ثبت پاسخ‌ها. لطفا مجددا تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  }, [session, navigate, setConfirmFinish]);
  
  useEffect(() => {
    if (!test || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time runs out
          handleFinishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [test, timeLeft, handleFinishTest]);

  const handleAnswer = useCallback((questionNumber: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: value,
    }));
    
    // Save to server
    const payload: Answer = {
      question_number: questionNumber,
      answer: value,
    };
    
    axiosInstance
      .post(`/sessions/${session.id}/answers/`, payload)
      .catch((error) => {
        console.error("Error saving answer:", error);
        toast.error("خطا در ذخیره پاسخ. لطفا اتصال اینترنت خود را بررسی کنید.");
      });
  }, [session]);
  
  const handlePageChange = useCallback((e: { currentPage: number }) => {
    setCurrentPage(e.currentPage);
  }, []);
  
  if (isLoading || !test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">خطا در بارگیری آزمون</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">{error}</p>
          <Button onClick={() => navigate('/panel/tests')}>
            بازگشت به لیست آزمون‌ها
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${fullscreenStatus ? 'bg-white dark:bg-gray-900' : ''}`}>
      {/* Confirmation dialogs */}
      <Dialog open={confirmFinish} onOpenChange={setConfirmFinish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>اتمام آزمون</DialogTitle>
            <DialogDescription>
              آیا از اتمام آزمون و ثبت پاسخ‌های خود اطمینان دارید؟
              {Object.keys(answers).length} سوال از {maxQuestions} سوال پاسخ داده شده است.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmFinish(false)} disabled={isSubmitting}>
              ادامه آزمون
            </Button>
            <Button 
              onClick={handleFinishTest}
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 rounded-full"></span>
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
            <DialogTitle>خروج از آزمون</DialogTitle>
            <DialogDescription>
              آیا می‌خواهید از صفحه آزمون خارج شوید؟ پاسخ‌های ذخیره شده از دست نمی‌روند، اما پیشنهاد می‌شود ابتدا آزمون را به پایان برسانید.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmExit(false)}>
              ادامه آزمون
            </Button>
            <Button 
              onClick={() => navigate('/panel/tests')}
              variant="default"
              className="bg-primary text-primary-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              خروج از آزمون
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />
      
      <div
        className={`fixed top-0 right-0 h-full w-3/4 max-w-sm bg-white dark:bg-gray-900 shadow-xl z-50 transition-transform transform md:hidden ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">پاسخ‌برگ</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
            
        <AnswerSheet
          answers={answers}
          maxQuestions={maxQuestions}
          onAnswer={handleAnswer}
          onFinish={() => setConfirmFinish(true)}
          currentPage={currentPage}
          timeLeft={timeLeft}
        />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-primary p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <h1 className="font-bold text-lg text-primary-foreground hidden md:block">
              آزمون: {session?.test_id}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse">
              <Button 
                variant="ghost"
                size="sm"
                className="text-primary-foreground border border-primary-foreground/30 hover:bg-primary-foreground/20 hover:text-primary-foreground"
                onClick={() => setConfirmExit(true)}
              >
                <LogOut className="h-4 w-4 ml-2" />
                خروج موقت
              </Button>
              
              <Button 
                variant="ghost"
                size="sm"
                className="text-primary-foreground border border-primary-foreground/30 hover:bg-primary-foreground/20 hover:text-primary-foreground"
                onClick={() => setConfirmFinish(true)}
              >
                <Check className="h-4 w-4 ml-2" />
                پایان آزمون
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={toggle}
            >
              {fullscreenStatus ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        
        {/* PDF Viewer */}
        <div className="flex-1 flex h-full overflow-hidden">
          {/* Sidebar for desktop */}
          <div className="hidden md:block w-80 border-r dark:border-gray-700 h-full overflow-hidden">
            <AnswerSheet
              answers={answers}
              maxQuestions={maxQuestions}
              onAnswer={handleAnswer}
              onFinish={() => setConfirmFinish(true)}
              currentPage={currentPage}
              timeLeft={timeLeft}
            />
          </div>
          
          {/* PDF viewer */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="bg-white dark:bg-gray-900 shadow-sm p-2 border-b dark:border-gray-700 flex items-center justify-between">
              {/* Left Side Controls */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 border rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    if (currentPage > 0) setCurrentPage(currentPage - 1);
                  }}
                  disabled={currentPage === 0}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  <span className="text-sm">صفحه:</span>
                  <CurrentPageLabel>
                    {(props) => (
                      <span className="text-sm font-medium">{props.currentPage + 1}</span>
                    )}
                  </CurrentPageLabel>
                  <span className="text-sm">از</span>
                  <span className="text-sm font-medium">100</span>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 border rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    setCurrentPage(currentPage + 1);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Right Side Controls */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                {/* Scroll Mode Options */}
                <div className="border rounded flex overflow-hidden">
                  <SwitchScrollMode mode={ScrollMode.SinglePage}>
                    {(props: SwitchScrollModeProps) => (
                      <Button
                        variant={props.isSelected ? "default" : "secondary"}
                        size="sm"
                        className={props.isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "shadow-sm hover:shadow-md transition-all"}
                        onClick={props.onClick}
                        title="نمایش صفحه به صفحه"
                      >
                        صفحه‌ای
                      </Button>
                    )}
                  </SwitchScrollMode>
                  
                  <SwitchScrollMode mode={ScrollMode.Continuous}>
                    {(props: SwitchScrollModeProps) => (
                      <Button
                        variant={props.isSelected ? "default" : "secondary"}
                        size="sm"
                        className={props.isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "shadow-sm hover:shadow-md transition-all"}
                        onClick={props.onClick}
                        title="نمایش پیوسته"
                      >
                        پیوسته
                      </Button>
                    )}
                  </SwitchScrollMode>
                </div>
                
                {/* Zoom Controls */}
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  <ZoomOut>
                    {(props: ZoomButtonProps) => (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={props.onClick}
                        title="کوچکنمایی"
                      >
                        <span className="text-lg">-</span>
                      </Button>
                    )}
                  </ZoomOut>
                  
                  <ZoomIn>
                    {(props: ZoomButtonProps) => (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={props.onClick}
                        title="بزرگنمایی"
                      >
                        <span className="text-lg">+</span>
                      </Button>
                    )}
                  </ZoomIn>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              <div className="h-full flex-1 bg-gray-100 dark:bg-gray-800">
                {test && test.file && (
                  <Viewer
                    fileUrl={`http://localhost:8000${test.file}`}
                    plugins={[
                      scrollModePluginInstance,
                      pageNavigationPluginInstance,
                      zoomPluginInstance,
                    ]}
                    defaultScale={SpecialZoomLevel.PageFit}
                    onPageChange={handlePageChange}
                    theme={fullscreenStatus ? 'dark' : 'light'}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDetailPage;
