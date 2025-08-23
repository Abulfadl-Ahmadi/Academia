import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { useNavigate } from "react-router-dom";
import { Clock, Calendar, AlertCircle, FileText, Timer, ArrowRight } from "lucide-react";
// @ts-expect-error moment-jalaali lacks proper TypeScript definitions
import moment from 'moment-jalaali';

function convertToJalali(isoDate: string): string {
  return moment(isoDate).format('jYYYY/jMM/jDD HH:mm');
}


async function getDeviceId() {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
}

type Test = {
  id: number;
  name: string;
  description: string;
  duration: string;
  start_time: string;
  end_time: string;
  status: string;
  total_questions?: number;
  passing_grade?: number;
};

// Calculate if a test is active based on current time
function getTestStatus(test: Test): { status: 'upcoming' | 'active' | 'expired', timeRemaining?: string } {
  const now = new Date().getTime();
  const startTime = new Date(test.start_time).getTime();
  const endTime = new Date(test.end_time).getTime();
  
  if (now < startTime) {
    // Calculate time until test starts
    const timeUntilStart = startTime - now;
    const hours = Math.floor(timeUntilStart / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));
    return { 
      status: 'upcoming', 
      timeRemaining: `${hours}:${minutes.toString().padStart(2, '0')}` 
    };
  } else if (now > endTime) {
    return { status: 'expired' };
  } else {
    // Calculate time until test ends
    const timeUntilEnd = endTime - now;
    const hours = Math.floor(timeUntilEnd / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilEnd % (1000 * 60 * 60)) / (1000 * 60));
    return { 
      status: 'active', 
      timeRemaining: `${hours}:${minutes.toString().padStart(2, '0')}` 
    };
  }
}

const TestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setSession] = useState(null);
  const [startLoading, setStartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    axiosInstance
      .get(`/tests/${id}/`)
      .then((res) => {
        setTest(res.data);
      })
      .catch((err) => {
        console.error("Error fetching test:", err);
        setError("خطا در دریافت اطلاعات آزمون. لطفا مجددا تلاش کنید.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleStart = async () => {
    setStartLoading(true);
    setError(null);
    
    try {
      const res = await axiosInstance.post(`/enter-test/`, {
        test_id: id,
        device_id: await getDeviceId(),
      });

      setSession(res.data);
      navigate(`/tests/${id}/detail`, { state: { session: res.data } });
    } catch (err: any) {
      console.error("Error starting session:", err);
      if (err.response?.status === 403) {
        setError("شما قبلا این آزمون را شروع کرده‌اید. امکان شرکت مجدد وجود ندارد.");
      } else {
        setError("خطا در شروع آزمون. لطفا مجددا تلاش کنید.");
      }
      setStartLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-100 dark:border-gray-700">
          <div className="space-y-5">
            <div className="h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg opacity-20 animate-pulse"></div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
            <div className="flex justify-center mt-8 border-t border-gray-100 dark:border-gray-700 pt-6">
              <Skeleton className="h-12 w-48 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-10 border border-gray-100 dark:border-gray-700">
          <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">آزمونی پیدا نشد</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            آزمون مورد نظر در سیستم وجود ندارد یا دسترسی شما به آن محدود شده است.
          </p>
          <Button 
            onClick={() => navigate("/panel/tests")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-8 rounded-md font-semibold transition-all duration-300"
          >
            بازگشت به لیست آزمون‌ها
          </Button>
        </div>
      </div>
    );
  }

  // Determine test status
  const { status, timeRemaining } = getTestStatus(test);
  
  // Status badge color
  const statusColor = {
    upcoming: "bg-white/20 text-white border border-white/30",
    active: "bg-green-500 text-white",
    expired: "bg-white/10 text-white/70",
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Card className="overflow-hidden border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold mb-2">{test.name}</CardTitle>
              <CardDescription className="text-white/80">
                کد آزمون: {test.id}
              </CardDescription>
            </div>
            <Badge 
              className={`px-3 py-1.5 text-xs font-medium uppercase ${statusColor[status]}`}
            >
              {status === 'upcoming' ? 'آینده' : status === 'active' ? 'در حال اجرا' : 'پایان یافته'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 dark:bg-red-900/20 dark:border-red-800 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-800 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}
          
          {test.description && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold mb-3 flex items-center text-lg">
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                توضیحات آزمون
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{test.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg p-4 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 flex items-center shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 mr-3">
                <Timer className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">مدت زمان آزمون</div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">{test.duration}</div>
              </div>
            </div>
            
            {status === 'active' && timeRemaining && (
              <div className="rounded-lg p-4 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 flex items-center shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 mr-3">
                  <Clock className="w-5 h-5 text-green-500 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">زمان باقی‌مانده</div>
                  <div className="font-semibold text-green-600 dark:text-green-400">{timeRemaining}</div>
                </div>
              </div>
            )}
            
            <div className="rounded-lg p-4 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 flex items-center shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 mr-3">
                <Calendar className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">تاریخ شروع</div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">{convertToJalali(test.start_time)}</div>
              </div>
            </div>
            
            <div className="rounded-lg p-4 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 flex items-center shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 mr-3">
                <Calendar className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">تاریخ پایان</div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">{convertToJalali(test.end_time)}</div>
              </div>
            </div>
            
            {test.total_questions && (
              <div className="rounded-lg p-4 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 flex items-center shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 mr-3">
                  <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">تعداد سوالات</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{test.total_questions} سوال</div>
                </div>
              </div>
            )}
            
            {test.passing_grade && (
              <div className="rounded-lg p-4 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 flex items-center shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 mr-3">
                  <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">نمره قبولی</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{test.passing_grade}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50 dark:bg-gray-800/50 p-6 border-t dark:border-gray-700">
          {status === 'active' ? (
            <Button 
              onClick={handleStart} 
              disabled={startLoading || status !== 'active'} 
              className="w-full py-6 text-lg shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold"
            >
              {startLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2 h-5 w-5 border-t-2 border-white border-opacity-50 rounded-full"></span>
                  در حال شروع آزمون...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  شروع آزمون
                  <ArrowRight className="mr-2 w-5 h-5" />
                </span>
              )}
            </Button>
          ) : status === 'upcoming' ? (
            <div className="w-full text-center">
              <Button 
                disabled
                variant="secondary"
                className="w-full py-6 text-lg bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                آزمون هنوز شروع نشده است
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                لطفاً در زمان مقرر مراجعه کنید
              </p>
            </div>
          ) : (
            <div className="w-full text-center">
              <Button 
                disabled
                variant="secondary"
                className="w-full py-6 text-lg bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                زمان آزمون به پایان رسیده است
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                امکان شرکت در این آزمون وجود ندارد
              </p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default TestPage;
