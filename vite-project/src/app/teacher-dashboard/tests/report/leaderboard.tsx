import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, Medal, Award, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

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

const TopPerformersLeaderboard = () => {
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
      } catch (err) {
        console.error('Error fetching test report:', err);
        const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'خطا در دریافت گزارش آزمون';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">در حال بارگذاری...</span>
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
            onClick={() => navigate(`/panel/question-tests/${id}/results`)}
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            بازگشت به نتایج آزمون
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!report?.sessions) {
    return <div>کسی در آزمون شرکت نکرده‌است.</div>;
  }

  const { test, sessions } = report;

  // Filter only completed sessions and sort by percentage descending
  const completedSessions = sessions
    .filter(session => session.status === 'completed')
    .sort((a, b) => b.score.percentage - a.score.percentage)
    .slice(0, 10); // Top 10 performers

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-2xl font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 3:
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate(`/panel/question-tests/${id}/results`)}
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          بازگشت به نتایج آزمون
        </Button>

        <Card className="mb-8 shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🏆 نفرات برتر آزمون
            </CardTitle>
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">{test.name}</p>
            <p className="text-gray-600 dark:text-gray-400">{test.description}</p>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {completedSessions.map((session, index) => {
            const rank = index + 1;
            return (
              <Card
                key={session.session_id}
                className={`p-0 shadow-lg border-0 transition-all duration-300 hover:shadow-xl ${
                  rank <= 3 ? 'bg-gradient-to-r from-white to-yellow-50 dark:from-gray-800 dark:to-yellow-900/20' : 'bg-white dark:bg-gray-800'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700">
                        {getRankIcon(rank)}
                      </div>
                      <div className='mr-4'>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {session.user.first_name} {session.user.last_name}
                        </h3>
                        {/* <p className="text-gray-600 dark:text-gray-400">@{session.user.username}</p> */}
                      </div>
                    </div>

                    <div className="text-left">
                      <div className="flex items-center space-x-2 space-x-reverse mb-2">
                        <Badge className={`${getRankBadgeColor(rank)} persian-number font-bold text-lg px-3 py-1`}>
                          رتبه {rank}
                        </Badge>
                      </div>
                      <div className=" persian-number text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {session.score.percentage.toFixed(1)}%
                      </div>
                      {/* <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="persian-number">{session.score.correct}</span> از <span className="persian-number">{session.score.total}</span> سوال
                      </div> */}
                    </div>
                  </div>

                  {/* <div className="mt-4">
                    <Progress
                      value={session.score.percentage}
                      className={`h-3 ${rank <= 3 ? 'bg-yellow-200' : ''}`}
                    />
                  </div> */}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {completedSessions.length === 0 && (
          <Card className="text-center p-8">
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                هنوز کسی آزمون را کامل نکرده است.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8 shadow-lg border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="text-center p-6">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              برای اشتراک‌گذاری این لیست، اسکرین‌شات بگیرید و در شبکه‌های اجتماعی پست کنید!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              طراحی شده برای اشتراک‌گذاری در اینستاگرام و استوری
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TopPerformersLeaderboard;