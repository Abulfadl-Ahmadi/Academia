import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
// @ts-ignore
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

const TestResult = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/tests/report/${id}/`);
        setReport(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'خطا در دریافت نتیجه آزمون');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const formatDate = (dateString: string) => {
    return moment(dateString).format('jYYYY/jMM/jDD HH:mm');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">در حال بارگذاری نتیجه آزمون...</span>
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

  if (!report || report.sessions.length === 0) {
    return (
      <Card className="mx-auto max-w-4xl mt-8">
        <CardHeader>
          <CardTitle>نتیجه آزمون</CardTitle>
        </CardHeader>
        <CardContent>
          <p>شما در این آزمون شرکت نکرده‌اید یا هنوز نتیجه‌ای ثبت نشده است.</p>
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

  // Since this is a student view, we only care about their own session
  // which should be the first (and only) session in the array
  const session = report.sessions[0];
  const { test } = report;

  return (
    <div className="container mx-auto">
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
          <CardTitle className="text-2xl">نتیجه آزمون: {test.name}</CardTitle>
          <CardDescription>{test.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg">
              <h3 className="font-bold mb-2">اطلاعات آزمون</h3>
              <p>درس: {test.course || 'نامشخص'}</p>
              <p>مدت زمان: {test.duration} دقیقه</p>
              <p>شروع: {formatDate(test.start_time)}</p>
              <p>پایان: {formatDate(test.end_time)}</p>
            </div>
            <div className="p-4 rounded-lg">
              <h3 className="font-bold mb-2">نتیجه شما</h3>
              <div className="mb-4">
                <Progress value={session.score.percentage} className="h-2" />
              </div>
              <p className="text-center font-bold text-xl">
                {session.score.percentage.toFixed(2)}%
              </p>
              <p className="text-center">
                {session.score.correct} از {session.score.total} پاسخ صحیح
              </p>
              <p className="text-center mt-2">
                زمان شروع: {formatDate(session.start_time)}
              </p>
              <p className="text-center">
                زمان پایان:{' '}
                {session.end_time
                  ? formatDate(session.end_time)
                  : 'هنوز پایان نیافته'}
              </p>
            </div>
          </div>
        </CardContent>
        </Card>
        <Card>
        <CardContent>
            <h3 className="font-bold text-lg">پاسخ‌های شما</h3>
          <div className="mt-8" dir='ltr'>
            <div className='grid xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
              {Array.from(
                { length: Math.ceil(session.answers.length / 10) },
                (_, groupIndex) => {
                  const group = session.answers
                    .sort((a, b) => a.question_number - b.question_number)
                    .slice(groupIndex * 10, (groupIndex + 1) * 10);

                  return (
                    <div
                      key={groupIndex}
                      className="mb-3"
                    >
                      <div className="text-center text-xs ">
                        <div className='space-y-1'>
                          {group.map((answer) => (
                            <div key={answer.question_number} className="flex flex-row space-x-1">
                              <div className="self-center font-bold w-10" dir='rtl'>{answer.question_number}</div>
                              {[1, 2, 3, 4].map((opt) => {
                                let color = "bg-gray-500/5 border-2 border-gray-500/50"; // پیش‌فرض خاکستری
                                if (answer.student_answer === opt && answer.is_correct) {
                                  color = "bg-green-500/30 border-2 border-green-500/50"; // جواب درست
                                } else if (
                                  answer.student_answer === opt &&
                                  !answer.is_correct
                                ) {
                                  color = "bg-red-500/20 border-2 border-red-500/50"; // جواب غلط
                                } else if (
                                  answer.student_answer !== opt &&
                                  answer.correct_answer === opt &&
                                  !answer.is_correct
                                ) {
                                  color = "bg-gray-500/40 border-2 border-gray-500/50"; // گزینه صحیح ولی انتخاب نشده
                                }

                                return (
                                  <div
                                    key={opt}
                                    className={`pt-[2px] px-4 ${color} rounded-md`}
                                  >
                                    {opt}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>


        </CardContent>
      </Card>
    </div>
  );
};

export default TestResult;