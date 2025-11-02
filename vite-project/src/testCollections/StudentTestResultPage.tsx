import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
// @ts-expect-error moment-jalaali lacks proper TypeScript definitions
import moment from "moment-jalaali";

interface StudentResult {
  id: number;
  student_name: string;
  test_name: string;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  wrong_answers: number;
  percent: number;
  entry_time: string;
  exit_time: string;
  status: string;
  answers: Array<{
    question_number: number;
    answer: number | null;
    correct_answer: number | null;
    is_correct: boolean;
  }>;
}

export default function StudentTestResultPage() {
  const { testId, studentId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(
          `/tests/${testId}/student/${studentId}/result/`
        );
        setResult(res.data);
        setError(null);
      } catch (e) {
        console.error(e);
        const errorMsg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || "خطا در دریافت نتایج دانش‌آموز";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [testId, studentId]);

  const formatDate = (dateString: string) => {
    return moment(dateString).format("jYYYY/jMM/jDD HH:mm");
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
            onClick={() => navigate(-1)}
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            بازگشت
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
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
            onClick={() => navigate(-1)}
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            بازگشت
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto">
      <Button variant="outline" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowRight className="ml-2 h-4 w-4" />
        بازگشت
      </Button>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">
            نتیجه آزمون: {result.test_name}
          </CardTitle>
          <CardDescription>{result.student_name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-bold mb-3">اطلاعات آزمون</h3>
              <p className="text-sm mb-1">دانش‌آموز: {result.student_name}</p>
              <p className="text-sm mb-1 persian-number">کل سوالات: {result.total_questions}</p>
              {/* <p className="text-sm mb-1 persian-number">مدت زمان: زمان آزمون</p> */}
              <p className="text-sm persian-number">شروع: {formatDate(result.entry_time)}</p>
              <p className="text-sm persian-number">
                پایان:{" "}
                {result.exit_time
                  ? formatDate(result.exit_time)
                  : "هنوز پایان نیافته"}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-bold mb-3">نتیجه</h3>
              <div className="mb-4">
                <Progress value={Math.max(0, result.percent)} className="h-3" />
              </div>
              <p className="text-center font-bold text-3xl mb-2 persian-number">
                {Math.max(0, result.percent).toFixed(2)}%
              </p>
              <p className="text-center text-sm mb-4 persian-number">
                {result.answered_questions} از {result.total_questions} سوال
                پاسخ داده شده
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-green-500/10 rounded text-center">
                  <p className="text-green-600 font-bold persian-number">
                    {result.correct_answers}
                  </p>
                  <p className="text-xs">پاسخ صحیح</p>
                </div>
                <div className="p-2 bg-red-500/10 rounded text-center">
                  <p className="text-red-600 font-bold persian-number">
                    {result.wrong_answers}
                  </p>
                  <p className="text-xs">پاسخ غلط</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-bold text-lg mb-6">پاسخ‌های دانش‌آموز</h3>
          <div className="mt-8 dir-ltr" dir="ltr">
            <div className="space-y-6" dir="ltr">
              {Array.from(
                { length: Math.ceil(result.answers.length / 10) },
                (_, groupIndex) => {
                  const group = result.answers
                    .sort((a, b) => a.question_number - b.question_number)
                    .slice(groupIndex * 10, (groupIndex + 1) * 10);

                  return (
                    <div key={groupIndex} className="space-y-2" dir="ltr">
                      {group.map((answer) => (
                        <div
                          key={answer.question_number}
                          className="persian-number flex flex-row items-center gap-2"
                          dir="rtl"
                        >
                          <div className="font-bold w-8 text-right">
                            {answer.question_number}
                          </div>
                          <div className="flex flex-row gap-1">
                            {[1, 2, 3, 4].map((opt) => {
                              let color = "bg-gray-500/5 border-2 border-gray-500/50";
                              
                              if (answer.answer === null) {
                                // دانش‌آموز پاسخ نداده
                                // جواب صحیح خاکستری
                                if (opt === answer.correct_answer) {
                                  color = "bg-gray-400/40 border-2 border-gray-400/60";
                                }
                              } else {
                                // دانش‌آموز پاسخ داده
                                if (answer.is_correct) {
                                  // جواب صحیح است
                                  if (opt === answer.answer) {
                                    color = "bg-green-500/30 border-2 border-green-500/50";
                                  }
                                } else {
                                  // جواب غلط است
                                  if (opt === answer.answer) {
                                    // جواب غلط دانش‌آموز قرمز
                                    color = "bg-red-500/30 border-2 border-red-500/50";
                                  } else if (opt === answer.correct_answer) {
                                    // جواب صحیح سبز
                                    color = "bg-green-500/30 border-2 border-green-500/50";
                                  }
                                }
                              }

                              return (
                                <div
                                  key={opt}
                                  className={`pt-[2px] px-4 py-1 pb-0 persian-number ${color} rounded-md text-sm font-medium`}
                                >
                                  {opt}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
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
}
