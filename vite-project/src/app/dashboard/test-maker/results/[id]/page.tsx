import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { MathPreview } from "@/components/MathPreview";
import {
  ArrowRight,
  Award,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  Target,
} from "lucide-react";

interface QuestionResult {
  question_id: number;
  public_id: string;
  question_text: string;
  difficulty_level: string;
  correct_option_id: number | null;
  correct_option_text: string | null;
  selected_option_id: number | null;
  selected_option_text: string | null;
  is_correct: boolean;
  detailed_solution: string;
  options: Array<{
    id: number;
    option_text: string;
    order: number;
  }>;
}

interface TestResults {
  test_name: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  questions: QuestionResult[];
  started_at: string;
  completed_at: string;
}

export default function CustomTestResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSolutions, setShowSolutions] = useState(false);

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/custom-tests/${id}/results/`);
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching results:", error);
      toast.error("خطا در دریافت نتایج");
      navigate("/panel/test-maker");
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

  if (!results) {
    return null;
  }

  const successRate = (results.correct_answers / results.total_questions) * 100;

  return (
    <div className="container p-0 mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/panel/test-maker")}>
          <ArrowRight className="h-4 w-4 ml-1" />
          بازگشت
        </Button>
        <Button variant="outline" onClick={() => setShowSolutions(!showSolutions)}>
          {showSolutions ? "مخفی کردن پاسخ‌ها" : "نمایش پاسخ‌ها"}
        </Button>
      </div>

      {/* Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{results.test_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary/10">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">
                  {(results.score || 0).toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">از 100</div>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>درصد موفقیت</span>
              <span className="font-semibold">{(successRate || 0).toFixed(1)}%</span>
            </div>
            <Progress value={successRate || 0} />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-500/5 rounded-lg">
              <CheckCircle className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2" />
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {results.correct_answers}
              </div>
              <div className="text-sm text-muted-foreground">پاسخ صحیح</div>
            </div>

            <div className="text-center p-4 bg-red-500/5 rounded-lg">
              <XCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
              <div className="text-2xl font-bold text-destructive">
                {results.total_questions - results.correct_answers}
              </div>
              <div className="text-sm text-muted-foreground">پاسخ غلط</div>
            </div>

            <div className="text-center p-4 bg-blue-500/5 rounded-lg">
              <FileText className="mx-auto h-8 w-8 text-primary mb-2" />
              <div className="text-2xl font-bold text-primary">
                {results.total_questions}
              </div>
              <div className="text-sm text-muted-foreground">کل سوالات</div>
            </div>

            <div className="text-center p-4 bg-purple-500/5 rounded-lg">
              <Award className="mx-auto h-8 w-8 text-secondary-foreground mb-2" />
              <div className="text-2xl font-bold text-secondary-foreground">
                {results.score >= 80 ? "عالی" : results.score >= 60 ? "خوب" : "قابل قبول"}
              </div>
              <div className="text-sm text-muted-foreground">ارزیابی</div>
            </div>
          </div>

          {/* Time Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                شروع: {new Date(results.started_at).toLocaleString("fa-IR")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                پایان: {new Date(results.completed_at).toLocaleString("fa-IR")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Review */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">بررسی سوالات</h2>
        {results.questions.map((question, index) => (
          <Card
            key={question.question_id}
            className={`border-2 ${
              question.is_correct ? "border-green-500/40" : "border-red-500/40"
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  سوال {index + 1}
                  <Badge className="mr-2" variant="outline">
                    {question.public_id}
                  </Badge>
                </CardTitle>
                {question.is_correct ? (
                  <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question Text */}
              <div className="prose max-w-none">
                <MathPreview text={question.question_text} />
              </div>

              {/* Difficulty */}
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  سطح دشواری:{" "}
                  {question.difficulty_level === "easy"
                    ? "آسان"
                    : question.difficulty_level === "medium"
                    ? "متوسط"
                    : "سخت"}
                </span>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <p className="text-sm font-semibold">گزینه‌ها:</p>
                <div className="space-y-2 pl-4">
                  {question.options.map((option) => {
                    const isSelected = option.id === question.selected_option_id;
                    const isCorrect = option.id === question.correct_option_id;
                    
                    return (
                      <div
                        key={option.id}
                        className={`p-3 rounded-lg border-2 ${
                          isCorrect
                            ? "border-emerald-500/75 bg-emerald-500/7"
                            : isSelected
                            ? "border-destructive/75 bg-red-500/7"
                            : "border-gray-200/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <MathPreview text={option.option_text} />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {isCorrect && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ پاسخ صحیح</span>}
                            {isSelected && !isCorrect && <span className="text-destructive font-semibold">✗ پاسخ شما</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Answer Status */}
              <div className="space-y-2">
                {question.selected_option_id ? (
                  <>    
                    <div className="flex items-center gap-2">
                      {question.is_correct ? (
                        <Badge className="bg-emerald-500/7 text-emerald-600/75">
                          پاسخ شما صحیح بود
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/7 text-red-600/75">
                          پاسخ شما نادرست بود
                        </Badge>
                      )}
                    </div>
                  </>
                ) : (
                  <Badge>
                    پاسخ داده نشده
                  </Badge>
                )}
              </div>

              {/* Detailed Solution */}
              {showSolutions && question.detailed_solution && (
                <div className="mt-4 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">پاسخ تشریحی:</h4>
                  <MathPreview text={question.detailed_solution} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Button onClick={() => navigate("/panel/test-maker")} className="flex-1">
              بازگشت به لیست
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/panel/test-maker/create")}
              className="flex-1"
            >
              آزمون جدید
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
