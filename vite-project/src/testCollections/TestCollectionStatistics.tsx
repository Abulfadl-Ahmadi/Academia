import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle,
  Target,
  ArrowLeft,
  FileText,
  Award
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

interface TestStatistic {
  test_id: number;
  test_title: string;
  participated_students: number;
  completed_students: number;
  completion_rate: number;
  average_score: number;
}

interface Statistics {
  overall_stats: {
    total_students: number;
    average_progress: number;
    completion_rate: number;
    total_tests: number;
  };
  test_statistics: TestStatistic[];
}

export default function TestCollectionStatistics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/test-collections/${id}/statistics/`);
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching statistics:", error);
        toast.error("خطا در دریافت آمار");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStats();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="ml-2 h-4 w-4" />
            بازگشت
          </Button>
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-20 animate-pulse mb-2"></div>
                <div className="h-8 bg-muted rounded w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">آمار یافت نشد</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          آمار این مجموعه آزمون در دسترس نیست.
        </p>
        <Button onClick={() => navigate(`/panel/test-collections/${id}`)} className="mt-4">
          <ArrowLeft className="ml-2 h-4 w-4" />
          بازگشت به مجموعه آزمون
        </Button>
      </div>
    );
  }

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
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-3xl font-bold">آمار مجموعه آزمون</h1>
        </div>
      </div>

      {/* آمار کلی */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل دانش‌آموزان</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overall_stats.total_students}</div>
            <p className="text-xs text-muted-foreground">
              دانش‌آموز ثبت‌نام کرده
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">میانگین پیشرفت</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overall_stats.average_progress}%</div>
            <Progress value={stats.overall_stats.average_progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">درصد تکمیل</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overall_stats.completion_rate}%</div>
            <Progress value={stats.overall_stats.completion_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل آزمون‌ها</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overall_stats.total_tests}</div>
            <p className="text-xs text-muted-foreground">
              آزمون در مجموعه
            </p>
          </CardContent>
        </Card>
      </div>

      {/* جدول آمار آزمون‌ها */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            آمار آزمون‌ها
          </CardTitle>
          <CardDescription>
            جزئیات مشارکت و عملکرد در هر آزمون
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>عنوان آزمون</TableHead>
                <TableHead className="text-center">شرکت‌کننده</TableHead>
                <TableHead className="text-center">تکمیل‌کننده</TableHead>
                <TableHead className="text-center">درصد تکمیل</TableHead>
                <TableHead className="text-center">میانگین نمره</TableHead>
                <TableHead className="text-center">وضعیت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.test_statistics.map((test) => (
                <TableRow key={test.test_id}>
                  <TableCell className="font-medium">{test.test_title}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-blue-500" />
                      {test.participated_students}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {test.completed_students}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-medium">{test.completion_rate}%</span>
                      <Progress value={test.completion_rate} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Award className="h-4 w-4 text-yellow-500" />
                      {test.average_score}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        test.completion_rate >= 80 ? "default" :
                        test.completion_rate >= 50 ? "secondary" : "outline"
                      }
                    >
                      {test.completion_rate >= 80 ? "عالی" :
                       test.completion_rate >= 50 ? "متوسط" : "نیاز به بهبود"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
