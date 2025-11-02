import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { useParams, useNavigate } from "react-router-dom";
import { Download, Loader2, Eye } from "lucide-react";

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

export default function TestStatisticsPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TestStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<'percent' | 'join_time'>('percent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [excelLoading, setExcelLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/tests/${testId}/statistics/`);
        setStats(res.data);
      } catch (e) {
        toast.error('خطا در دریافت آمار آزمون');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [testId]);

  const sortedStudents = stats?.students
    ? [...stats.students].sort((a, b) => {
        if (sortKey === 'percent') {
          return sortOrder === 'asc' ? a.percent - b.percent : b.percent - a.percent;
        } else {
          return sortOrder === 'asc'
            ? new Date(a.join_time).getTime() - new Date(b.join_time).getTime()
            : new Date(b.join_time).getTime() - new Date(a.join_time).getTime();
        }
      })
    : [];

  const handleExportExcel = async () => {
    setExcelLoading(true);
    try {
      const res = await axiosInstance.get(`/tests/${testId}/statistics/excel/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `test_${testId}_students.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      toast.error('خطا در خروجی اکسل');
    } finally {
      setExcelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-12">آمار آزمون یافت نشد</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>آمار آزمون: {stats.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-muted-foreground">{stats.description}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-2 bg-primary/10 rounded">
              <div className="text-lg font-bold">{stats.questions_count}</div>
              <div className="text-xs">تعداد سوالات</div>
            </div>
            <div className="p-2 bg-primary/10 rounded">
              <div className="text-lg font-bold">{stats.student_count}</div>
              <div className="text-xs">تعداد دانش‌آموزان</div>
            </div>
            <div className="p-2 bg-primary/10 rounded">
              <div className="text-lg font-bold">{stats.average_percent}%</div>
              <div className="text-xs">میانگین درصد</div>
            </div>
            <div className="flex items-center justify-center">
              <Button onClick={handleExportExcel} disabled={excelLoading}>
                {excelLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Download className="w-4 h-4 ml-2" />}
                خروجی اکسل
              </Button>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr>
                  <th className="p-2 border-b">#</th>
                  <th className="p-2 border-b text-right">نام دانش‌آموز</th>
                  <th className="p-2 border-b text-center cursor-pointer" onClick={() => {
                    setSortKey('percent');
                    setSortOrder(sortKey === 'percent' && sortOrder === 'desc' ? 'asc' : 'desc');
                  }}>
                    درصد {sortKey === 'percent' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-2 border-b cursor-pointer" onClick={() => {
                    setSortKey('join_time');
                    setSortOrder(sortKey === 'join_time' && sortOrder === 'desc' ? 'asc' : 'desc');
                  }}>
                    زمان ورود {sortKey === 'join_time' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-2 border-b text-center">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((s, i) => (
                  <tr key={s.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 text-center">{i + 1}</td>
                    <td className="p-2">{s.name}</td>
                    <td className="p-2 text-center font-semibold">{s.percent}%</td>
                    <td className="p-2 text-center">{new Date(s.join_time).toLocaleString('fa-IR')}</td>
                    <td className="p-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/panel/tests/${testId}/student/${s.id}/result`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
