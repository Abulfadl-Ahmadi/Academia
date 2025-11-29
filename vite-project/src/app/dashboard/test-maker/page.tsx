import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import {
  Plus,
  Sparkles,
  Clock,
  Target,
  TrendingUp,
  Award,
  CheckCircle,
  PlayCircle,
  FileText,
  Trash2,
} from "lucide-react";

interface CustomTest {
  id: number;
  name: string;
  status: string;
  difficulty_level: string;
  questions_count: number;
  actual_questions_count: number;
  duration_minutes: number;
  score: number | null;
  folders_names: string[];
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  completion_percentage: number;
  is_expired: boolean;
}

interface Stats {
  total_tests: number;
  completed_tests: number;
  in_progress_tests: number;
  average_score: number;
  best_score: number;
  worst_score: number;
  total_questions_answered: number;
}

export default function TestMakerDashboard() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<CustomTest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testsResponse, statsResponse] = await Promise.all([
        axiosInstance.get("/custom-tests/"),
        axiosInstance.get("/custom-tests/stats/"),
      ]);

      setTests(testsResponse.data.results || testsResponse.data || []);
      setStats(statsResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      not_started: { label: "شروع نشده", variant: "secondary" },
      in_progress: { label: "در حال انجام", variant: "default" },
      completed: { label: "تکمیل شده", variant: "outline" },
      expired: { label: "منقضی شده", variant: "destructive" },
    };
    
    const config = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDifficultyBadge = (difficulty: string) => {
    if (!difficulty) return null;
    
    const difficultyMap: Record<string, { label: string; color: string }> = {
      easy: { label: "آسان", color: "text-emerald-600 dark:text-emerald-400" },
      medium: { label: "متوسط", color: "text-amber-600 dark:text-amber-400" },
      hard: { label: "سخت", color: "text-destructive" },
    };
    
    const config = difficultyMap[difficulty] || { label: difficulty, color: "" };
    return <span className={`text-sm ${config.color}`}>{config.label}</span>;
  };

  const handleStartTest = (testId: number) => {
    navigate(`/panel/test-maker/test/${testId}`);
  };

  const handleViewResults = (testId: number) => {
    navigate(`/panel/test-maker/results/${testId}`);
  };

  const handleDeleteTest = async (testId: number) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این آزمون را حذف کنید?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/custom-tests/${testId}/`);
      toast.success("آزمون حذف شد");
      fetchData();
    } catch (error) {
      console.error("Error deleting test:", error);
      toast.error("خطا در حذف آزمون");
    }
  };

  const filteredTests = tests.filter((test) => {
    if (activeTab === "all") return true;
    if (activeTab === "not_started") return test.status === "not_started";
    if (activeTab === "in_progress") return test.status === "in_progress";
    if (activeTab === "completed") return test.status === "completed";
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">آزمون‌ساز</h1>
            <p className="text-muted-foreground">
              آزمون‌های شخصی خود را بسازید و مهارت‌های خود را تقویت کنید
            </p>
          </div>
        </div>
        <Button onClick={() => navigate("/panel/test-maker/create")}>
          <Plus className="h-4 w-4 ml-1" />
          آزمون جدید
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل آزمون‌ها</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_tests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تکمیل شده</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed_tests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">میانگین نمره</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.average_score || 0).toFixed(1)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">بهترین نمره</CardTitle>
              <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.best_score || 0).toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tests List */}
      <Card>
        <CardHeader>
          <CardTitle>آزمون‌های من</CardTitle>
          <CardDescription>مدیریت و مشاهده آزمون‌های شخصی</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">همه ({tests.length})</TabsTrigger>
              <TabsTrigger value="not_started">
                شروع نشده ({tests.filter((t) => t.status === "not_started").length})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                در حال انجام ({tests.filter((t) => t.status === "in_progress").length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                تکمیل شده ({tests.filter((t) => t.status === "completed").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-4">
              {filteredTests.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">آزمونی یافت نشد</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    برای شروع، یک آزمون جدید ایجاد کنید
                  </p>
                  <Button onClick={() => navigate("/panel/test-maker/create")} className="mt-4">
                    <Plus className="h-4 w-4 ml-1" />
                    ایجاد آزمون
                  </Button>
                </div>
              ) : (
                filteredTests.map((test) => (
                  <Card key={test.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{test.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(test.status)}
                            {test.difficulty_level && getDifficultyBadge(test.difficulty_level)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {test.status === "not_started" && (
                            <Button onClick={() => handleStartTest(test.id)}>
                              <PlayCircle className="h-4 w-4 ml-1" />
                              شروع
                            </Button>
                          )}
                          {test.status === "in_progress" && (
                            <Button onClick={() => handleStartTest(test.id)}>
                              <PlayCircle className="h-4 w-4 ml-1" />
                              ادامه
                            </Button>
                          )}
                          {test.status === "completed" && (
                            <Button variant="outline" onClick={() => handleViewResults(test.id)}>
                              <Target className="h-4 w-4 ml-1" />
                              مشاهده نتایج
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTest(test.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{test.actual_questions_count} سوال</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{test.duration_minutes} دقیقه</span>
                        </div>
                        {test.score !== null && (
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <span>نمره: {parseFloat(test.score as any).toFixed(1)}</span>
                          </div>
                        )}
                        {test.folders_names.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span>{test.folders_names.length} پوشه</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        ایجاد شده: {new Date(test.created_at).toLocaleDateString("fa-IR")}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
