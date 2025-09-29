import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ChevronLeft, ChevronRight, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axios';
import { MathPreview } from '@/components/MathPreview';

interface Question {
  id: number;
  public_id: string;
  question_text: string;
  options: Array<{
    id: number;
    option_text: string;
    order: number;
  }>;
  images?: Array<{
    id: number;
    image: string;
    alt_text?: string;
    order: number;
  }>;
}

interface Test {
  id: number;
  name: string;
  description?: string;
  content_type: 'pdf' | 'typed_question';
  duration: string;
  pdf_file_url?: string;
  questions?: Question[];
  questions_count?: number;
}

interface StudentAnswer {
  question_number: number;
  answer?: number;
}

export default function StudentTestTakingPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [testStarted, setTestStarted] = useState(false);

  // Load test data
  const loadTest = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/tests/${testId}/`);
      setTest(response.data);

      // Parse duration and set timer
      if (response.data.duration) {
        const durationMatch = response.data.duration.match(/PT(\d+H)?(\d+M)?/);
        if (durationMatch) {
          const hours = durationMatch[1] ? parseInt(durationMatch[1].replace('H', '')) : 0;
          const minutes = durationMatch[2] ? parseInt(durationMatch[2].replace('M', '')) : 0;
          const totalMinutes = hours * 60 + minutes;
          setTimeRemaining(totalMinutes * 60); // Convert to seconds
        }
      }

      setTestStarted(true);
    } catch (error) {
      console.error('Error loading test:', error);
      toast.error('خطا در بارگذاری آزمون');
      navigate('/tests');
    } finally {
      setLoading(false);
    }
  }, [testId, navigate]);

  useEffect(() => {
    if (testId) {
      loadTest();
    }
  }, [testId, loadTest]);

  // Submit test
  const handleSubmitTest = useCallback(async () => {
    try {
      await axiosInstance.post('/finish-test/', {
        test_id: testId,
        answers: answers
      });
      toast.success('آزمون با موفقیت ارسال شد');
      navigate(`/tests/result/${testId}`);
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('خطا در ارسال آزمون');
    }
  }, [testId, answers, navigate]);

  // Timer effect
  useEffect(() => {
    if (!testStarted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-submit when time is up
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, timeRemaining, handleSubmitTest]);

  // Get current question
  const currentQuestion = test?.questions?.[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.question_number === currentQuestionIndex + 1);

  // Calculate progress
  const progress = test?.questions
    ? ((currentQuestionIndex + 1) / test.questions.length) * 100
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">آزمون یافت نشد</h2>
          <Button onClick={() => navigate('/tests')}>
            بازگشت به لیست آزمون‌ها
          </Button>
        </div>
      </div>
    );
  }

  // PDF Test View
  if (test.content_type === 'pdf') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/tests')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  خروج
                </Button>
                <div>
                  <h1 className="text-xl font-bold">{test.name}</h1>
                  {test.description && (
                    <p className="text-sm text-muted-foreground">{test.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-lg font-mono">
                  <Clock className="w-5 h-5" />
                  {formatTime(timeRemaining)}
                </div>
                <Button
                  onClick={handleSubmitTest}
                  className="bg-green-600 hover:bg-green-700"
                >
                  پایان آزمون
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Card className="h-[calc(100vh-200px)]">
            <CardContent className="p-0 h-full">
              {test.pdf_file_url ? (
                <iframe
                  src={test.pdf_file_url}
                  className="w-full h-full border-0"
                  title="Test PDF"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">فایل PDF آزمون در دسترس نیست</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Question-based Test View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/tests')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                خروج
              </Button>
              <div>
                <h1 className="text-lg font-bold">{test.name}</h1>
                <p className="text-sm text-muted-foreground">
                  سوال {currentQuestionIndex + 1} از {test.questions?.length || 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-lg font-mono">
                <Clock className="w-5 h-5" />
                {formatTime(timeRemaining)}
              </div>
              <Button
                onClick={handleSubmitTest}
                variant="outline"
                size="sm"
              >
                پایان آزمون
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {currentQuestion ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">
                  سوال {currentQuestionIndex + 1}
                </Badge>
                <Badge variant="secondary">
                  {currentQuestion.public_id}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Question Text */}
              <div>
                <MathPreview text={currentQuestion.question_text} />
              </div>

              {/* Question Images */}
              {currentQuestion.images && currentQuestion.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.images
                    .sort((a, b) => a.order - b.order)
                    .map((image) => (
                      <div key={image.id} className="border rounded-lg p-2">
                        <img
                          src={image.image}
                          alt={image.alt_text || `تصویر سوال ${image.order}`}
                          className="w-full h-auto rounded"
                        />
                      </div>
                    ))}
                </div>
              )}

              {/* Options */}
              {currentQuestion.options && currentQuestion.options.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">گزینه‌های پاسخ:</h4>
                  <RadioGroup
                    value={currentAnswer?.answer?.toString() || ""}
                    onValueChange={(value) =>
                      handleAnswerSelect(currentQuestionIndex, parseInt(value))
                    }
                  >
                    {currentQuestion.options
                      .sort((a, b) => a.order - b.order)
                      .map((option, index) => (
                        <div key={option.id} className="flex items-center space-x-2 space-x-reverse">
                          <RadioGroupItem
                            value={option.order.toString()}
                            id={`option-${option.id}`}
                          />
                          <Label
                            htmlFor={`option-${option.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                              <span className="font-medium min-w-8">
                                {["۱)", "۲)", "۳)", "۴)"][index] || `${index + 1})`}
                              </span>
                              <div className="flex-1">
                                <MathPreview text={option.option_text} />
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                  </RadioGroup>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">سوالی یافت نشد</h3>
              <p className="text-muted-foreground text-center">
                این آزمون سوالی ندارد.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChevronRight className="w-4 h-4" />
            سوال قبل
          </Button>

          <div className="flex items-center gap-2">
            {answers.length > 0 && (
              <Badge variant="secondary">
                <CheckCircle className="w-3 h-3 ml-1" />
                {answers.length} پاسخ داده شده
              </Badge>
            )}
          </div>

          <Button
            onClick={goToNextQuestion}
            disabled={!test.questions || currentQuestionIndex >= test.questions.length - 1}
            className="flex items-center gap-2"
          >
            سوال بعد
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}