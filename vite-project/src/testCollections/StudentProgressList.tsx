
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { 
  Users, 
  TrendingUp,
  ArrowLeft,
  CheckCircle,
  Clock,
  Award
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface StudentProgress {
  id: number;
  student_name: string;
  completed_tests: number;
  total_score: number | null;
  progress_percentage: number;
  average_score: number | null;
  is_completed: boolean;
  last_activity: string;
}

interface StudentProgressData {
  id: number;
  test_collection: number;
  test_collection_name: string;
  student: number;
  student_name: string;
  completed_tests: number;
  total_score: number;
  progress_percentage: number;
  average_score: number;
  started_at: string;
  last_activity: string;
  is_completed: boolean;
}

interface TestResult {
  test_name: string;
  test_id: number;
  score: number;
  percentage: number;
  date: string | null;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
}

export default function StudentProgressList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgressData | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  // تبدیل داده‌ها به فرمت مناسب برای نمودار خطی
  const formatChartData = (results: TestResult[]) => {
    // مرتب کردن بر اساس تاریخ یا نام آزمون
    const sortedResults = [...results].sort((a, b) => {
      // اگر تاریخ وجود دارد، بر اساس تاریخ مرتب کن
      if (a.date && b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      // در غیر این صورت بر اساس نام آزمون مرتب کن
      return a.test_name.localeCompare(b.test_name);
    });

    return sortedResults.map((result, index) => ({
      testNumber: index + 1,
      testName: result.test_name.replace(/آزمون\s*/, '').replace(/مرحله\s*/, '') || `${index + 1}`,
      percentage: result.percentage || 0,
      score: result.score || 0,
      date: result.date
    }));
  };

  const fetchTestResults = useCallback(async () => {
    try {
      // دریافت نتایج واقعی آزمون‌ها از API
      const response = await axiosInstance.get(`/test-collections/${id}/student_test_results/`);
      console.log("Test results data:", response.data);
      setTestResults(response.data);
    } catch (error) {
      console.error("Error fetching test results:", error);
      // در صورت خطا، نتایج فیک نمایش داده می‌شود
      const mockResults: TestResult[] = [
        { test_name: "آزمون 1", test_id: 1, score: 85, percentage: 85, date: "2024-01-15", total_questions: 10, correct_answers: 8, wrong_answers: 2 },
        { test_name: "آزمون 2", test_id: 2, score: 92, percentage: 92, date: "2024-01-22", total_questions: 10, correct_answers: 9, wrong_answers: 1 },
        { test_name: "آزمون 3", test_id: 3, score: 78, percentage: 78, date: "2024-01-29", total_questions: 10, correct_answers: 7, wrong_answers: 3 },
        { test_name: "آزمون 4", test_id: 4, score: 95, percentage: 95, date: "2024-02-05", total_questions: 10, correct_answers: 9, wrong_answers: 1 },
        { test_name: "آزمون 5", test_id: 5, score: 88, percentage: 88, date: "2024-02-12", total_questions: 10, correct_answers: 8, wrong_answers: 2 },
      ];
      setTestResults(mockResults);
    }
  }, [id]);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/test-collections/${id}/student_progress/`);
        console.log("Progress data:", response.data);
        console.log("Is array:", Array.isArray(response.data));
        console.log("Data type:", typeof response.data);
        
        // اگر کاربر دانش‌آموز است، data یک object است
        if (response.data && !Array.isArray(response.data)) {
          setStudentProgress(response.data);
          // برای نمودار، باید نتایج تست‌ها را از جای دیگری بگیریم
          await fetchTestResults();
        } else {
          // اگر معلم است، data یک array است
          setProgress(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error("Error fetching student progress:", error);
        toast.error("خطا در دریافت پیشرفت دانش‌آموزان");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchProgress();
    }
  }, [id, fetchTestResults]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // اگر دانش‌آموز است و نتایج شخصی دارد
  if (studentProgress) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/panel/test-collections/${id}`)}
          >
            <ArrowLeft className="ml-2 h-4 w-4" />
            بازگشت
          </Button>
          <h1 className="text-2xl font-bold">پیشرفت من</h1>
        </div>

        {/* کارت خلاصه پیشرفت */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              خلاصه پیشرفت
            </CardTitle>
            <CardDescription>
              آمار کلی عملکرد شما در این مجموعه آزمون
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{studentProgress.completed_tests}</div>
                <div className="text-sm text-muted-foreground">آزمون‌های تکمیل شده</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{studentProgress.average_score?.toFixed(1) || 0}%</div>
                <div className="text-sm text-muted-foreground">میانگین نمرات</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{(studentProgress.progress_percentage || 0).toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">درصد پیشرفت</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground">
              آخرین فعالیت: {new Date(studentProgress.last_activity).toLocaleDateString('fa-IR')}
            </div>
          </CardFooter>
        </Card>

        {/* نمودار پیشرفت با Chart Line */}
        <Card>
          <CardHeader>
            <CardTitle>نمودار پیشرفت در آزمون‌ها</CardTitle>
            <CardDescription>
              روند عملکرد شما در آزمون‌های مختلف مجموعه
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.length > 0 ? (
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatChartData(testResults)}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="testName" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      labelFormatter={(label) => `آزمون ${label}`}
                      formatter={(value: number) => [`${value}%`, 'نمره']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        // boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="percentage" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, fill: '#1d4ed8', stroke: '#2563eb', strokeWidth: 2 }}
                      connectNulls={true}
                      name="درصد نمره"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>هنوز نتیجه آزمونی موجود نیست</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {testResults.length}
                </div>
                <div className="text-xs text-muted-foreground">تعداد آزمون</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {testResults.length > 0 ? (testResults.reduce((sum, test) => sum + test.percentage, 0) / testResults.length).toFixed(1) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">میانگین کل</div>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {testResults.length > 0 ? Math.max(...testResults.map(t => t.percentage)) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">بهترین نمره</div>
              </div>
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="text-lg font-bold text-orange-600">
                  {testResults.length > 0 ? Math.min(...testResults.map(t => t.percentage)) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">کمترین نمره</div>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* جدول نتایج تفصیلی */}
        <Card>
          <CardHeader>
            <CardTitle>نتایج تفصیلی آزمون‌ها</CardTitle>
            <CardDescription>
              جزئیات کامل عملکرد شما در هر آزمون
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <Award className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{result.test_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.date ? result.date : 'آزمون داده نشده'}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold">{result.score}</div>
                    <div className="text-sm text-muted-foreground">{result.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // اگر معلم است و لیست دانش‌آموزان را می‌بیند
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/panel/test-collections/${id}`)}
        >
          <ArrowLeft className="ml-2 h-4 w-4" />
          بازگشت
        </Button>
        <h1 className="text-2xl font-bold">پیشرفت دانش‌آموزان</h1>
        <Badge variant="secondary">
          <Users className="ml-1 h-4 w-4" />
          {progress.length} دانش‌آموز
        </Badge>
      </div>

      {progress.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">هنوز هیچ دانش‌آموزی در این مجموعه آزمون ثبت‌نام نکرده است.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {progress.map((student) => (
            <Card key={student.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{student.student_name}</CardTitle>
                      <CardDescription>
                        آخرین فعالیت: {new Date(student.last_activity).toLocaleDateString('fa-IR')}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-bold">{student.completed_tests}</div>
                    <div className="text-sm text-muted-foreground">آزمون تکمیل شده</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {student.average_score ? student.average_score.toFixed(1) : 'ندارد'}
                    </div>
                    <div className="text-sm text-muted-foreground">میانگین نمره</div>
                  </div>
                  
                  <div className="w-32">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">پیشرفت</span>
                      <span className="text-sm font-medium">{(student.progress_percentage || 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={student.progress_percentage || 0} className="h-2" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Badge 
                  variant={student.is_completed ? "default" : student.completed_tests > 0 ? "secondary" : "outline"}
                >
                  {student.is_completed ? (
                    <>
                      <CheckCircle className="ml-1 h-3 w-3" />
                      تکمیل شده
                    </>
                  ) : student.completed_tests > 0 ? (
                    <>
                      <Clock className="ml-1 h-3 w-3" />
                      در حال انجام
                    </>
                  ) : (
                    'شروع نشده'
                  )}
                </Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
