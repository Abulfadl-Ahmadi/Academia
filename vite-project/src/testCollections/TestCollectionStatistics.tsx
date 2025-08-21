import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { 
  BarChart3, 
  Users, 
  BookOpen,
  TrendingUp,
  ArrowLeft,
  CheckCircle,
  XCircle
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
  collection_info: {
    id: number;
    title: string;
    total_tests: number;
    total_students: number;
    created_date: string;
  };
  overall_stats: {
    average_progress: number;
    completed_students: number;
    completion_rate: number;
  };
  test_statistics: TestStatistic[];
}

export default function TestCollectionStatistics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, [id]);

  const fetchStatistics = async () => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">آمار یافت نشد</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          امکان دریافت آمار این مجموعه آزمون وجود ندارد.
        </p>
        <Button onClick={() => navigate("/panel/test-collections")} className="mt-4">
          <ArrowLeft className="ml-2 h-4 w-4" />
          بازگشت به لیست
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
          <ArrowLeft className="h-4 w-4 ml-1" />
          بازگشت
        </Button>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-3xl font-bold">آمار {stats.collection_info.title}</h1>
        </div>
      </div>

      {/* آمار کلی */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">کل آزمون‌ها</p>
                <p className="text-2xl font-bold">{stats.collection_info.total_tests}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">کل دانش‌آموزان</p>
                <p className="text-2xl font-bold">{stats.collection_info.total_students}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">میانگین پیشرفت</p>
                <p className="text-2xl font-bold">{stats.overall_stats.average_progress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">درصد تکمیل</p>
                <p className="text-2xl font-bold">{stats.overall_stats.completion_rate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* آمار تفصیلی آزمون‌ها */}
      <Card>
        <CardHeader>
          <CardTitle>آمار تفصیلی آزمون‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.test_statistics.map((test) => (
              <div key={test.test_id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{test.test_title}</h3>
                  <Badge variant="outline">
                    {test.completion_rate.toFixed(1)}% تکمیل
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>{test.participated_students} شرکت‌کننده</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{test.completed_students} تکمیل‌کننده</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <span>میانگین: {test.average_score.toFixed(1)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {test.completion_rate >= 50 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>{test.completion_rate.toFixed(1)}% تکمیل</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {stats.test_statistics.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">هیچ آزمونی یافت نشد</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                هنوز آزمونی برای این مجموعه ایجاد نشده است.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
