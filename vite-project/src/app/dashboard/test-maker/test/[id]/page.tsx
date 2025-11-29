import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { MathPreview } from "@/components/MathPreview";
import { ArrowRight, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface Question {
  id: number;
  public_id: string;
  question_text: string;
  difficulty_level: string;
  options: Array<{
    id: number;
    option_text: string;
    order: number;
  }>;
  question_image_urls: string[];
}

interface CustomTest {
  id: number;
  name: string;
  status: string;
  difficulty_level: string;
  questions_count: number;
  duration_minutes: number;
  score: number | null;
  folders_names: string[];
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  questions_list: Question[];
  time_remaining: number | null;
  is_expired: boolean;
}

interface Answer {
  question_id: number;
  selected_option_id: number;
}

export default function CustomTestTake() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<CustomTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetchTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // Timer
    if (test?.status === "in_progress" && timeRemaining !== null && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            handleFinishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test?.status, timeRemaining]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/custom-tests/${id}/`);
      setTest(response.data);
      setTimeRemaining(response.data.time_remaining);

      // Load existing answers
      if (response.data.status !== "not_started") {
        const answersResponse = await axiosInstance.get(`/custom-tests/${id}/answers/`);
        const answersMap = new Map();
        answersResponse.data.forEach((answer: Answer) => {
          answersMap.set(answer.question_id, answer.selected_option_id);
        });
        setAnswers(answersMap);
      }
    } catch (error) {
      console.error("Error fetching test:", error);
      toast.error("خطا در دریافت اطلاعات آزمون");
      navigate("/panel/test-maker");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    try {
      const response = await axiosInstance.post(`/custom-tests/${id}/start/`);
      setTest(response.data);
      setTimeRemaining(response.data.time_remaining);
      toast.success("آزمون شروع شد");
    } catch (error) {
      console.error("Error starting test:", error);
      toast.error("خطا در شروع آزمون");
    }
  };

  const handleAnswerSelect = async (questionId: number, optionId: number) => {
    if (test?.status !== "in_progress") return;

    setAnswers(new Map(answers.set(questionId, optionId)));

    try {
      await axiosInstance.post(`/custom-tests/${id}/submit_answer/`, {
        question_id: questionId,
        option_id: optionId,
      });
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error("خطا در ثبت پاسخ");
    }
  };

  const handleFinishTest = async () => {
    if (submitting) return;

    const unanswered = test?.questions_list.filter((q) => !answers.has(q.id)).length || 0;
    if (unanswered > 0 && !confirm(`${unanswered} سوال بدون پاسخ دارید. آیا مطمئن هستید؟`)) {
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post(`/custom-tests/${id}/finish/`);
      toast.success("آزمون با موفقیت پایان یافت");
      navigate(`/panel/test-maker/results/${id}`);
    } catch (error) {
      console.error("Error finishing test:", error);
      toast.error("خطا در پایان دادن به آزمون");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-lg font-semibold">آزمون یافت نشد</h3>
      </div>
    );
  }

  const currentQuestion = test.questions_list[currentQuestionIndex];
  const answeredCount = answers.size;
  const progress = (answeredCount / test.questions_list.length) * 100;

  // Not started view
  if (test.status === "not_started") {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <Button variant="outline" onClick={() => navigate("/panel/test-maker")}>
          <ArrowRight className="h-4 w-4 ml-1" />
          بازگشت
        </Button>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-2xl">{test.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">تعداد سوالات</p>
                <p className="text-lg font-semibold">{test.questions_list.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مدت زمان</p>
                <p className="text-lg font-semibold">{test.duration_minutes} دقیقه</p>
              </div>
            </div>

            <Button onClick={handleStartTest} className="w-full">
              شروع آزمون
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{test.name}</h1>
        {timeRemaining !== null && (
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className={`text-lg font-semibold ${timeRemaining < 60 ? "text-destructive" : ""}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        )}
      </div>

      {/* Progress */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>پیشرفت</span>
              <span>
                {answeredCount} از {test.questions_list.length} سوال
              </span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                سوال {currentQuestionIndex + 1} از {test.questions_list.length}
              </CardTitle>
              <Badge>{currentQuestion.public_id}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question Text */}
            <div className="prose max-w-none">
              <MathPreview text={currentQuestion.question_text} />
            </div>

            {/* Question Images */}
            {currentQuestion.question_image_urls.length > 0 && (
              <div className="space-y-2">
                {currentQuestion.question_image_urls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`تصویر سوال ${index + 1}`}
                    className="max-w-full h-auto rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options
                .sort((a, b) => a.order - b.order)
                .map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                    className={`w-full p-4 text-right border-2 rounded-lg transition-colors ${
                      answers.get(currentQuestion.id) === option.id
                        ? "border-primary bg-primary/10"
                        : "border-gray-200 hover:border-primary/50"
                    }`}
                    title={`گزینه ${option.order}`}
                  >
                    <MathPreview text={option.option_text} />
                  </button>
                ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                سوال قبلی
              </Button>

              {currentQuestionIndex === test.questions_list.length - 1 ? (
                <Button onClick={handleFinishTest} disabled={submitting}>
                  <CheckCircle className="h-4 w-4 ml-1" />
                  {submitting ? "در حال پایان..." : "پایان آزمون"}
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    setCurrentQuestionIndex((prev) =>
                      Math.min(test.questions_list.length - 1, prev + 1)
                    )
                  }
                >
                  سوال بعدی
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Navigator */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">نمای کلی سوالات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {test.questions_list.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`aspect-square rounded text-sm font-semibold ${
                  currentQuestionIndex === index
                    ? "bg-primary text-white"
                    : answers.has(q.id)
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
