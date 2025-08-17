import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ArrowLeft, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import moment from 'moment-jalaali';

interface Answer {
  question_number: number;
  student_answer: number;
  correct_answer: number;
  is_correct: boolean;
}

interface Score {
  correct: number;
  total: number;
  percentage: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface Session {
  user: User;
  session_id: number;
  start_time: string;
  end_time: string;
  status: string;
  score: Score;
  answers: Answer[];
}

interface Test {
  id: number;
  name: string;
  description: string;
  course: string;
  start_time: string;
  end_time: string;
  duration: number;
  created_by: string;
}

interface Report {
  test: Test;
  sessions: Session[];
}

const TestReport = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/tests/report/${id}/`);
        setReport(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'خطا در دریافت گزارش آزمون');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const filteredSessions = report?.sessions?.filter((session) => {
    const fullName = `${session.user.first_name} ${session.user.last_name}`;
    return (
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const formatDate = (dateString: string) => {
    return moment(dateString).format('jYYYY/jMM/jDD HH:mm');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">تکمیل شده</Badge>;
      case 'active':
        return <Badge className="bg-blue-500">در حال انجام</Badge>;
      case 'inactive':
        return <Badge className="bg-yellow-500">خروج موقت</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const exportToExcel = () => {
    // Implementation for exporting to Excel would go here
    alert('این قابلیت در نسخه بعدی اضافه خواهد شد');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">در حال بارگذاری گزارش...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-4xl mt-8">
        <CardHeader>
          <CardTitle className="text-red-500">خطا</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/panel/tests')}
          >
            <ArrowLeft className="ml-2 h-4 w-4" />
            بازگشت به لیست آزمون‌ها
          </Button>
        </CardContent>
      </Card>
    );
  }

  console.log(report.sessions)

  if (!report.sessions) {
    return <div>کسی در آزمون شرکت نکرده‌است.</div>;
  }

  const { test, sessions } = report;

  // Calculate average score
  const averageScore =
    sessions?.length > 0
      ? sessions.reduce((sum, session) => sum + session.score.percentage, 0) /
        sessions.length
      : 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="outline"
        className="mb-4"
        onClick={() => navigate('/panel/tests')}
      >
        <ArrowLeft className="ml-2 h-4 w-4" />
        بازگشت به لیست آزمون‌ها
      </Button>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">گزارش آزمون: {test.name}</CardTitle>
          <CardDescription>{test.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className=" p-4 rounded-lg">
              <h3 className="font-bold mb-2">اطلاعات آزمون</h3>
              <p>درس: {test.course || 'نامشخص'}</p>
              <p>مدت زمان: {test.duration} دقیقه</p>
              <p>شروع: {formatDate(test.start_time)}</p>
              <p>پایان: {formatDate(test.end_time)}</p>
            </div>
            <div className=" p-4 rounded-lg">
              <h3 className="font-bold mb-2">آمار شرکت‌کنندگان</h3>
              <p>تعداد کل: {sessions.length} نفر</p>
              <p>
                تکمیل شده:{' '}
                {sessions.filter((s) => s.status === 'completed').length} نفر
              </p>
              <p>
                در حال انجام:{' '}
                {sessions.filter((s) => s.status === 'active').length} نفر
              </p>
              <p>
                خروج موقت:{' '}
                {sessions.filter((s) => s.status === 'inactive').length} نفر
              </p>
            </div>
            <div className=" p-4 rounded-lg">
              <h3 className="font-bold mb-2">میانگین نمرات</h3>
              <div className="mb-2">
                <Progress value={averageScore} className="h-2" />
              </div>
              <p className="text-center font-bold">
                {averageScore.toFixed(2)}%
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            variant="outline"
            onClick={exportToExcel}
            className="flex items-center"
          >
            <Download className="ml-2 h-4 w-4" />
            خروجی اکسل
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>لیست شرکت‌کنندگان</CardTitle>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="جستجو بر اساس نام یا نام کاربری..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام و نام خانوادگی</TableHead>
                <TableHead>نام کاربری</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>زمان شروع</TableHead>
                <TableHead>زمان پایان</TableHead>
                <TableHead>نمره</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions && filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <TableRow key={session.session_id}>
                    <TableCell>
                      {session.user.first_name} {session.user.last_name}
                    </TableCell>
                    <TableCell>{session.user.username}</TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                    <TableCell>{formatDate(session.start_time)}</TableCell>
                    <TableCell>
                      {session.end_time
                        ? formatDate(session.end_time)
                        : 'هنوز پایان نیافته'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Progress
                          value={session.score.percentage}
                          className="h-2 w-16 mr-2"
                        />
                        <span>
                          {session.score.correct} از {session.score.total} (
                          {session.score.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Implementation for viewing detailed results
                          alert(
                            'مشاهده جزئیات پاسخ‌های دانش‌آموز در نسخه بعدی اضافه خواهد شد'
                          );
                        }}
                      >
                        مشاهده جزئیات
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    {searchTerm
                      ? 'هیچ دانش‌آموزی با این مشخصات یافت نشد'
                      : 'هیچ دانش‌آموزی در این آزمون شرکت نکرده است'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestReport;