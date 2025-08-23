import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
// @ts-expect-error moment-jalaali lacks proper TypeScript definitions
import moment from 'moment-jalaali';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Calendar, BookOpen } from "lucide-react";
import FingerprintJS from "@fingerprintjs/fingerprintjs"
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { AxiosError } from "axios";

async function getDeviceId() {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
}

function convertToJalali(isoDate: string): string {
  return moment(isoDate).format('jYYYY/jMM/jDD HH:mm');
}

type Test = {
  id: number;
  name: string;
  description: string;
  duration: string;
  start_time: string;
  end_time: string;
  course_detail: {
    id: number;
    title: string;
  };
  status?: string;
  score?: number;
  max_score?: number;
};

const StudentTestsList: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch tests that the student has access to
    axiosInstance
      .get("/tests/")
      .then((res) => {
        setTests(res.data);
      })
      .catch((err) => {
        console.error("Error fetching tests:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // const handleStartTest = (testId: number) => {
  //   navigate(`/panel/tests/${testId}/detail/`);
  // };


const handleStartTest = async (testId: number) => {
  try {
    const res = await axiosInstance.post(`/enter-test/`, {
      test_id: testId,
      device_id: await getDeviceId(),
    });

    setSession(res.data);
    console.log("Session started:", res.data);

    // بعد از ساخت سشن، ریدایرکت به صفحه آزمون
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

  // Filter tests based on search term
  const filteredTests = tests.filter((test) => {
    return test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (test.description && test.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (test.course_detail.title && test.course_detail.title.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const isTestActive = (test: Test) => {
    const now = new Date();
    const startTime = new Date(test.start_time);
    const endTime = new Date(test.end_time);
    return now >= startTime && now <= endTime;
  };

  const isTestUpcoming = (test: Test) => {
    const now = new Date();
    const startTime = new Date(test.start_time);
    return now < startTime;
  };

  const isTestExpired = (test: Test) => {
    const now = new Date();
    const endTime = new Date(test.end_time);
    return now > endTime;
  };

  const getTestStatusBadge = (test: Test) => {
    if (test.status === "completed") {
      return <Badge className="bg-green-500/80">تکمیل شده</Badge>;
    } else if (test.status === "in_progress") {
      return <Badge className="bg-yellow-500/80">در حال انجام</Badge>;
    } else if (isTestActive(test)) {
      return <Badge className="bg-blue-500/80">آماده شروع</Badge>;
    } else if (isTestUpcoming(test)) {
      return <Badge className="bg-purple-500/80">آینده</Badge>;
    } else if (isTestExpired(test)) {
      return <Badge className="bg-gray-500/80">منقضی شده</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">آزمون‌های من</h1>
        <div className="w-full md:w-1/3">
          <Input
            placeholder="جستجو در آزمون‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-muted-foreground">هیچ آزمونی یافت نشد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <Card key={test.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                  {getTestStatusBadge(test)}
                </div>
                <CardDescription className="line-clamp-2">
                  {test.description || "بدون توضیحات"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <BookOpen className="h-4 w-4 mr-2 opacity-70" />
                    <span>دوره: {test.course_detail ? test.course_detail.title : "بدون دوره"}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 opacity-70" />
                    <span>شروع: {convertToJalali(test.start_time)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 opacity-70" />
                    <span>پایان: {convertToJalali(test.end_time)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 opacity-70" />
                    <span>مدت: {test.duration}</span>
                  </div>
                  
                  {test.status === "completed" && test.score !== undefined && test.max_score !== undefined && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>نمره</span>
                        <span>{test.score} از {test.max_score}</span>
                      </div>
                      <Progress value={(test.score / test.max_score) * 100} />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                {test.status === "completed" ? (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleViewResult(test.id)}
                  >
                    مشاهده نتیجه
                  </Button>
                ) : isTestActive(test) ? (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleStartTest(test.id)}
                  >
                    شروع آزمون
                  </Button>
                ) : isTestUpcoming(test) ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    disabled
                  >
                    هنوز شروع نشده
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    disabled
                  >
                    منقضی شده
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentTestsList;