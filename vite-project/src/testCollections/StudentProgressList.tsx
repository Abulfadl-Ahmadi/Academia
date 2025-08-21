import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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

export default function StudentProgressList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [id]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/test-collections/${id}/student_progress/`);
      setProgress(Array.isArray(response.data) ? response.data : [response.data]);
    } catch (error) {
      console.error("Error fetching student progress:", error);
      toast.error("خطا در دریافت پیشرفت دانش‌آموزان");
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
          <TrendingUp className="h-6 w-6" />
          <h1 className="text-3xl font-bold">پیشرفت دانش‌آموزان</h1>
        </div>
      </div>

      {progress.length > 0 ? (
        <div className="grid gap-4">
          {progress.map((student) => (
            <Card key={student.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{student.student_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        آخرین فعالیت: {new Date(student.last_activity).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={student.is_completed ? "default" : "secondary"}>
                    {student.is_completed ? "تکمیل شده" : "در حال انجام"}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">پیشرفت کلی</span>
                      <span className="text-sm text-muted-foreground">
                        {student.progress_percentage}%
                      </span>
                    </div>
                    <Progress value={student.progress_percentage} className="h-2" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">{student.completed_tests}</p>
                        <p className="text-xs text-muted-foreground">آزمون تکمیل‌شده</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{student.total_score ? student.total_score.toFixed(1) : '0.0'}</p>
                        <p className="text-xs text-muted-foreground">مجموع امتیاز</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">{student.average_score ? student.average_score.toFixed(1) : '0.0'}</p>
                        <p className="text-xs text-muted-foreground">میانگین نمره</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">هیچ پیشرفتی یافت نشد</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              هنوز هیچ دانش‌آموزی در این مجموعه آزمون شرکت نکرده است.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
