import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Trophy, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentStat {
  id: number;
  name: string;
  percent: number;
  join_time: string;
}

interface TestStatistics {
  id: number;
  name: string;
  description: string;
  questions_count: number;
  student_count: number;
  average_percent: number;
  students: StudentStat[];
}

const getMedalInfo = (position: number) => {
  switch (position) {
    case 1:
      return {
        medal: "🥇",
        bgClass: "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20",
        borderClass: "border-yellow-300 dark:border-yellow-700",
        textClass: "text-yellow-700 dark:text-yellow-300",
        badgeClass: "bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100",
      };
    case 2:
      return {
        medal: "🥈",
        bgClass: "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/20",
        borderClass: "border-slate-300 dark:border-slate-700",
        textClass: "text-slate-700 dark:text-slate-300",
        badgeClass: "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100",
      };
    case 3:
      return {
        medal: "🥉",
        bgClass: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20",
        borderClass: "border-orange-300 dark:border-orange-700",
        textClass: "text-orange-700 dark:text-orange-300",
        badgeClass: "bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-100",
      };
    default:
      return {
        medal: `#${position}`,
        bgClass: "bg-card hover:bg-accent",
        borderClass: "border-border",
        textClass: "text-muted-foreground",
        badgeClass: "bg-muted text-muted-foreground",
      };
  }
};

export default function TestLeaderboardPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TestStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/tests/${testId}/statistics/`);
        setStats(res.data);
      } catch {
        toast.error("خطا در دریافت آمار آزمون");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [testId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">اطلاعاتی یافت نشد</p>
      </div>
    );
  }

  const topStudents = [...stats.students]
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 10);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-background persian-number">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            بازگشت
          </Button>
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
              <h1 className="text-3xl sm:text-4xl font-bold">نتایج برتر</h1>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
              {stats.name}
            </h2>
            {stats.description && (
              <p className="text-sm sm:text-base text-muted-foreground">
                {stats.description}
              </p>
            )}
          </div>
        </div>

        {/* Top 3 - Visual Display */}
        {topStudents.length >= 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {/* 2nd Place */}
            {topStudents[1] && (
              <div className="order-2 sm:order-1 flex flex-col">
                <div
                  className={`flex-1 p-4 sm:p-6 rounded-lg border-2 ${getMedalInfo(2).bgClass} ${getMedalInfo(2).borderClass} flex flex-col items-center justify-end text-center`}
                >
                  <div className="text-4xl mb-2">{getMedalInfo(2).medal}</div>
                  <p className="font-semibold text-sm sm:text-base truncate max-w-full">
                    {topStudents[1].name}
                  </p>
                  <div className="mt-3 text-2xl sm:text-3xl font-bold">
                    {topStudents[1].percent}%
                  </div>
                </div>
                <div className="text-center mt-2 text-xs sm:text-sm font-semibold text-muted-foreground">
                  نفر دوم
                </div>
              </div>
            )}

            {/* 1st Place - Center & Larger */}
            {topStudents[0] && (
              <div className="order-1 sm:order-2 flex flex-col sm:scale-110 sm:origin-bottom">
                <div
                  className={`p-6 sm:p-8 rounded-lg border-2 ${getMedalInfo(1).bgClass} ${getMedalInfo(1).borderClass} flex flex-col items-center justify-end text-center shadow-lg`}
                >
                  <div className="text-5xl sm:text-6xl mb-3">{getMedalInfo(1).medal}</div>
                  <p className="font-bold text-base sm:text-lg truncate max-w-full">
                    {topStudents[0].name}
                  </p>
                  <div className="mt-4 text-3xl sm:text-4xl font-bold">
                    {topStudents[0].percent}%
                  </div>
                </div>
                <div className="text-center mt-2 text-xs sm:text-sm font-bold text-foreground">
                  نفر اول
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {topStudents[2] && (
              <div className="order-3 flex flex-col">
                <div
                  className={`flex-1 p-4 sm:p-6 rounded-lg border-2 ${getMedalInfo(3).bgClass} ${getMedalInfo(3).borderClass} flex flex-col items-center justify-end text-center`}
                >
                  <div className="text-4xl mb-2">{getMedalInfo(3).medal}</div>
                  <p className="font-semibold text-sm sm:text-base truncate max-w-full">
                    {topStudents[2].name}
                  </p>
                  <div className="mt-3 text-2xl sm:text-3xl font-bold">
                    {topStudents[2].percent}%
                  </div>
                </div>
                <div className="text-center mt-2 text-xs sm:text-sm font-semibold text-muted-foreground">
                  نفر سوم
                </div>
              </div>
            )}
          </div>
        )}

        {/* List View - All Top 10 */}
        {topStudents.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center">
                <Medal className="h-5 w-5 mr-2" />
                ده نفر برتر
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {topStudents.map((student, index) => {
                  const position = index + 1;
                  const medalInfo = getMedalInfo(position);

                  return (
                    <div
                      key={student.id}
                      className={`p-4 sm:p-6 transition-colors ${
                        position <= 3
                          ? medalInfo.bgClass
                          : "hover:bg-accent"
                      } border-l-4 ${medalInfo.borderClass}`}
                    >
                      <div className="flex items-center gap-4 sm:gap-6">
                        {/* Position Medal */}
                        <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                          <div className="text-2xl sm:text-3xl">{medalInfo.medal}</div>
                        </div>

                        {/* Student Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base truncate">
                            {student.name}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {new Date(student.join_time).toLocaleDateString(
                              "fa-IR"
                            )}
                          </p>
                        </div>

                        {/* Score */}
                        <div className="flex-shrink-0 text-right">
                          <div
                            className={`text-lg sm:text-2xl font-bold ${
                              position <= 3 ? medalInfo.textClass : ""
                            }`}
                          >
                            {student.percent}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            رتبه {position}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {topStudents.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-muted-foreground">
              هنوز هیچ دانش‌آموزی این آزمون را انجام نداده است
            </p>
          </Card>
        )}

        {/* Footer Stats */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold">
              {stats.student_count}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              تعداد شرکت‌کنندگان
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold">
              {stats.average_percent.toFixed(1)}%
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              میانگین نمرات
            </p>
          </Card>
          <Card className="p-4 text-center col-span-2 sm:col-span-1">
            <p className="text-2xl sm:text-3xl font-bold">
              {stats.questions_count}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              تعداد سوالات
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
