import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, FileText, Calendar } from "lucide-react";
import axiosInstance from "@/lib/axios";

interface Test {
  id: number;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  duration: string; // duration as string from backend (HH:MM:SS)
  time_limit?: number; // time in minutes
  questions_count?: number;
  content_type: string;
  is_active: boolean;
  created_at: string;
  collection?: {
    id: number;
    name: string;
    created_by_name: string;
  };
}

export default function ActiveTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActiveTests = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/question-tests/");
        const activeTests = response.data.filter((test: Test) => test.is_active);
        setTests(activeTests);
        setError(null);
      } catch (err) {
        console.error("Error fetching tests:", err);
        setError("خطا در دریافت آزمون‌ها");
      } finally {
        setLoading(false);
      }
    };

    fetchActiveTests();
  }, []);

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

  const handleStartTest = (testId: number) => {
    navigate(`/question-tests/${testId}/info`);
  };

  const getTestStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) {
      return { label: "آغاز نشده", variant: "secondary" as const };
    } else if (now > end) {
      return { label: "پایان یافته", variant: "destructive" as const };
    } else {
      return { label: "فعال", variant: "default" as const };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-6">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="flex justify-end">
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">خطا</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} variant="outline">
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">آزمون‌های فعال</h1>
        <p className="text-muted-foreground">
          لیست آزمون‌های در دسترس شما را مشاهده کنید و در آن‌ها شرکت نمایید.
        </p>
      </div>
      
      {tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">آزمون فعالی وجود ندارد</h3>
            <p className="text-muted-foreground mb-4">
              در حال حاضر هیچ آزمون فعالی برای شما تعریف نشده است.
            </p>
            <Button variant="outline" onClick={() => navigate("/panel")}>
              بازگشت به داشبورد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => {
            const status = getTestStatus(test.start_time, test.end_time);
            const timeRemaining = formatTimeRemaining(test.end_time);
            const isActive = status.label === "فعال";
            
            return (
              <Card key={test.id} className={`transition-all hover:shadow-md ${!isActive ? 'opacity-75' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                      {test.collection && (
                        <CardDescription className="text-xs">
                          مجموعه: {test.collection.name} - {test.collection.created_by_name}
                        </CardDescription>
                      )}
                      {test.description && (
                        <CardDescription className="text-sm">
                          {test.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4" />
                      <span>
                        {test.questions_count || 0} سوال
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{test.time_limit || 0} دقیقه</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>باقیمانده: {timeRemaining}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      نوع آزمون: {test.content_type === 'pdf' ? 'فایل PDF' : 'سوال تایپ شده'}
                    </div>
                    
                    <Button 
                      onClick={() => handleStartTest(test.id)}
                      disabled={!isActive}
                      className="min-w-[120px]"
                    >
                      {isActive ? 'شروع آزمون' : 'غیرفعال'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
