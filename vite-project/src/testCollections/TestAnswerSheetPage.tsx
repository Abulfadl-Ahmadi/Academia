import { useState, useEffect, useRef } from "react";
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
import { Loader2, ArrowRight, FileText, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { MathPreview } from "@/components/MathPreview";
// @ts-expect-error moment-jalaali lacks proper TypeScript definitions
import moment from "moment-jalaali";

// Component for rendering images (handles both regular images and SVG)
const ImageRenderer: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isSvg, setIsSvg] = useState(false);

  useEffect(() => {
    const urlWithoutParams = src.split('?')[0].toLowerCase();
    const isSvgFile = urlWithoutParams.endsWith('.svg');

    if (isSvgFile) {
      setIsSvg(true);
      fetch(src)
        .then(response => response.text())
        .then(content => {
          if (content.includes('<svg')) {
            const modifiedContent = content
              .replace('<svg', '<svg class="theme-aware-svg"')
              .replace(/stroke="black"/g, 'stroke="currentColor"')
              .replace(/stroke="#000"/g, 'stroke="currentColor"')
              .replace(/stroke="#000000"/g, 'stroke="currentColor"')
              .replace(/fill="black"/g, 'fill="currentColor"')
              .replace(/fill="#000"/g, 'fill="currentColor"')
              .replace(/fill="#000000"/g, 'fill="currentColor"')
              .replace(/stroke:black/g, 'stroke:currentColor')
              .replace(/fill:black/g, 'fill:currentColor')
              .replace(/stroke:#000/g, 'stroke:currentColor')
              .replace(/stroke:#000000/g, 'stroke:currentColor')
              .replace(/fill:#000/g, 'fill:currentColor')
              .replace(/fill:#000000/g, 'fill:currentColor');

            setSvgContent(modifiedContent);
          } else {
            setIsSvg(false);
          }
        })
        .catch(() => {
          setIsSvg(false);
        });
    } else {
      setIsSvg(false);
    }
  }, [src]);

  if (isSvg && svgContent) {
    return (
      <div
        className={`${className} flex items-center justify-center text-foreground`}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
    />
  );
};

interface Image {
  id: number;
  image: string;
  alt_text: string;
  order: number;
}

interface Option {
  id: number;
  order: number;
  option_text: string;
}

interface Answer {
  question_number: number;
  question_text: string;
  question_images: Image[];
  options: Option[];
  detailed_solution: string | null;
  solution_images: Image[];
  student_answer: number | null;
  correct_answer: number | null;
  is_correct: boolean;
}

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
  answers: Answer[];
  test_content_type?: string;
  test_pdf_file?: string;
  answer_sheet_pdf?: string;
}

export default function TestAnswerSheetPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNavigatorButton, setShowNavigatorButton] = useState(false);
  const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const navigatorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        // Get student result
        const res = await axiosInstance.get(
          `/tests/report/${testId}/`
        );
        
        if (res.data.sessions && res.data.sessions.length > 0) {
          const session = res.data.sessions[0];
          const score = session.score;
          
          setResult({
            id: session.session_id,
            student_name: session.user.first_name + " " + session.user.last_name,
            test_name: res.data.test.name,
            total_questions: score.total,
            answered_questions: score.correct + score.wrong,
            correct_answers: score.correct,
            wrong_answers: score.wrong,
            percent: score.percentage,
            entry_time: session.start_time,
            exit_time: session.end_time,
            status: session.status,
            answers: session.answers,
            test_content_type: session.test_content_type,
            test_pdf_file: session.test_pdf_file,
            answer_sheet_pdf: session.answer_sheet_pdf,
          });
        }
        setError(null);
      } catch (e) {
        console.error(e);
        const errorMsg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || "خطا در دریافت پاسخ‌نامه";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [testId]);

  // Scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      if (navigatorRef.current) {
        const rect = navigatorRef.current.getBoundingClientRect();
        // اگر navigator از صفحه پایین رفت، دکمه ظاهر شود
        setShowNavigatorButton(rect.top > window.innerHeight);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const formatDate = (dateString: string) => {
    return moment(dateString).format("jYYYY/jMM/jDD HH:mm");
  };

  const scrollToQuestion = (questionNumber: number) => {
    const element = questionRefs.current[questionNumber];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">در حال بارگذاری پاسخ‌نامه...</span>
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
          <CardTitle>پاسخ‌نامه آزمون</CardTitle>
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
    <div className="w-full min-h-screen bg-background persian-number">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <Button variant="outline" className="mb-3 sm:mb-4" onClick={() => navigate(-1)}>
          <ArrowRight className="ml-2 h-4 w-4" />
          بازگشت
        </Button>

        <Card className="mb-6 sm:mb-8">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-xl sm:text-2xl">
              پاسخ‌نامه آزمون: {result.test_name}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">{result.student_name}</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 sm:pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
                <h3 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base">اطلاعات آزمون</h3>
                <p className="text-xs sm:text-sm mb-0.5">دانش‌آموز: {result.student_name}</p>
                <p className="text-xs sm:text-sm mb-0.5">کل سوالات: {result.total_questions}</p>
                <p className="text-xs sm:text-sm">شروع: {formatDate(result.entry_time)}</p>
                <p className="text-xs sm:text-sm">
                  پایان:{" "}
                  {result.exit_time
                    ? formatDate(result.exit_time)
                    : "هنوز پایان نیافته"}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
                <h3 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base">نتیجه</h3>
                <div className="mb-3 sm:mb-4">
                  <Progress value={Math.max(0, result.percent)} className="h-2 sm:h-3" />
                </div>
                <p className="text-center font-bold text-2xl sm:text-3xl mb-1 sm:mb-2">
                  {result.percent.toFixed(2)}%
                </p>
                <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm">
                  <div className="p-1.5 sm:p-2 bg-green-500/10 rounded text-center">
                    <p className="text-green-600 font-bold">
                      {result.correct_answers}
                    </p>
                    <p className="text-xs">پاسخ صحیح</p>
                  </div>
                  <div className="p-1.5 sm:p-2 bg-red-500/10 rounded text-center">
                    <p className="text-red-600 font-bold">
                      {result.wrong_answers}
                    </p>
                    <p className="text-xs">پاسخ غلط</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Show file downloads for PDF tests */}
      {result.test_content_type === 'pdf' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Question PDF */}
            {result.test_pdf_file && (
              <a
                href={result.test_pdf_file}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-6 border-2 border-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">فایل سوالات</p>
                    <p className="text-xs text-muted-foreground">دانلود فایل PDF سوالات</p>
                  </div>
                </div>
              </a>
            )}

            {/* Answer Sheet PDF */}
            {result.answer_sheet_pdf && (
              <a
                href={result.answer_sheet_pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-6 border-2 border-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">پاسخ‌نامه</p>
                    <p className="text-xs text-muted-foreground">دانلود فایل PDF پاسخ‌نامه</p>
                  </div>
                </div>
              </a>
            )}
          </div>
        </div>
      ) : (
        /* Show detailed answers for typed tests */
        <div>
          <div>
            <div className="text-lg font-bold flex items-center mb-4">
              <FileText className="h-5 w-5" />
              پاسخ‌نامه آزمون
            </div>
          </div>

          {/* Questions Navigation */}
          {result.answers && result.answers.length > 0 && (
          <div ref={navigatorRef} className="sticky top-0 z-40 mb-4 p-3 bg-background border rounded-lg shadow-sm">
            <div className="flex flex-col gap-2">
              <p className="text-xs sm:text-sm font-semibold text-muted-foreground">پرش به سوال:</p>
              <div className="flex flex-wrap gap-1.5">
                {result.answers.map((answer) => (
                  <Button
                    key={answer.question_number}
                    variant="outline"
                    size="sm"
                    onClick={() => scrollToQuestion(answer.question_number)}
                    className={`h-8 w-8 p-0 text-xs ${
                      answer.is_correct
                        ? "border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20"
                        : "border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                    }`}
                  >
                    {answer.question_number}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-3 sm:space-y-6">
          {result.answers && result.answers.length > 0 ? (
            result.answers.map((answer, index) => (
              <Card
                key={index}
                ref={(el) => {
                  if (el) questionRefs.current[answer.question_number] = el;
                }}
                id={`question-${answer.question_number}`}
                className={`${
                  answer.is_correct
                    ? "border-l-green-500 bg-green-50/30 dark:bg-green-950/10 gap-0"
                    : "border-l-red-500 bg-red-50/30 dark:bg-red-950/10 gap-0"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm sm:text-base">
                        سوال {answer.question_number}
                      </CardTitle>
                    </div>
                    <div
                      className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap ${
                        answer.is_correct
                          ? "bg-green-500/20 text-green-700 dark:text-green-300"
                          : "bg-red-500/20 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {answer.is_correct ? "✓ صحیح" : "✗ غلط"}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 pt-2 sm:pt-0">
                  {/* Question Text */}
                  <div>
                    {/* <h4 className="font-semibold mb-1.5 sm:mb-2 text-xs sm:text-sm text-muted-foreground">
                      متن سوال:
                    </h4> */}
                    <div className="p-2 sm:p-3 bg-muted/50 rounded-lg text-xs sm:text-sm space-y-2">
                      <MathPreview text={answer.question_text} />
                      
                      {/* Question Images */}
                      {answer.question_images && answer.question_images.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          {answer.question_images
                            .sort((a, b) => a.order - b.order)
                            .map((img) => (
                              <div key={img.id} className="p-2">
                                <ImageRenderer
                                  src={img.image}
                                  alt={img.alt_text || `تصویر سوال ${img.order}`}
                                  className="w-full h-auto max-h-64 object-contain rounded"
                                />
                                {img.alt_text && (
                                  <p className="text-xs text-muted-foreground mt-1 text-center">
                                    {img.alt_text}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  {answer.options && answer.options.length > 0 && (
                    <div>
                      {/* <h4 className="font-semibold mb-1.5 sm:mb-2 text-xs sm:text-sm text-muted-foreground">
                        گزینه‌ها:
                      </h4> */}
                      <div className="space-y-1.5 sm:space-y-2">
                        {answer.options.map((option) => {
                          const isSelected = option.order === answer.student_answer;
                          const isCorrect = option.order === answer.correct_answer;
                          
                          let bgColor = "bg-background";
                          let borderColor = "border-muted-foreground/20";
                          
                          if (isCorrect && answer.is_correct) {
                            bgColor = "bg-green-50/50 dark:bg-green-950/20";
                            borderColor = "border-green-500";
                          } else if (isCorrect && !answer.is_correct) {
                            bgColor = "bg-green-50/50 dark:bg-green-950/20";
                            borderColor = "border-green-500";
                          } else if (isSelected && !isCorrect) {
                            bgColor = "bg-red-50/50 dark:bg-red-950/20";
                            borderColor = "border-red-500";
                          }
                          
                          return (
                            <div
                              key={option.id}
                              className={`p-1.5 sm:p-2 rounded border ${bgColor} ${borderColor} text-xs sm:text-sm`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="font-bold flex-shrink-0">
                                  {option.order})
                                </span>
                                <span><MathPreview text={option.option_text} /></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Student Answer */}
                  <div>
                    <h4 className="font-semibold mb-1.5 sm:mb-2 text-xs sm:text-sm text-muted-foreground">
                      پاسخ شما:
                    </h4>
                    <div className="p-2 sm:p-3 bg-background rounded-lg border text-xs sm:text-sm">
                      {answer.student_answer ? (
                        <span className="font-bold text-base sm:text-lg">
                          گزینه {answer.student_answer}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          پاسخی داده نشده
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Correct Answer */}
                  {answer.correct_answer && (
                    <div>
                      <h4 className="font-semibold mb-1.5 sm:mb-2 text-xs sm:text-sm text-muted-foreground">
                        پاسخ صحیح:
                      </h4>
                      <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg border border-green-500/20 text-xs sm:text-sm">
                        <span className="font-bold text-base sm:text-lg text-green-600 dark:text-green-400">
                          گزینه {answer.correct_answer}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Detailed Solution */}
                  {answer.detailed_solution && (
                    <div>
                      <details className="group cursor-pointer">
                        <summary className="font-semibold mb-1.5 sm:mb-2 text-xs sm:text-sm text-muted-foreground list-none flex items-center gap-2 hover:text-foreground transition-colors">
                          <span className="inline-block transition-transform group-open:rotate-180 text-lg">▶</span>
                          تشریح پاسخ
                        </summary>
                        <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 text-xs sm:text-sm leading-relaxed space-y-2">
                          <MathPreview text={answer.detailed_solution} />
                          
                          {/* Solution Images */}
                          {answer.solution_images && answer.solution_images.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                              {answer.solution_images
                                .sort((a, b) => a.order - b.order)
                                .map((img) => (
                                  <div key={img.id} className="p-2">
                                    <ImageRenderer
                                      src={img.image}
                                      alt={img.alt_text || `تصویر تشریح ${img.order}`}
                                      className="w-full h-auto max-h-64 object-contain rounded"
                                    />
                                    {img.alt_text && (
                                      <p className="text-xs text-muted-foreground mt-1 text-center">
                                        {img.alt_text}
                                      </p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              هیچ پاسخی ثبت نشده است.
            </p>
          )}
        </div>

        {/* Floating button to jump to navigator */}
        {showNavigatorButton && (
          <button
            onClick={() => navigatorRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="fixed bottom-4 left-4 sm:left-8 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
            aria-label="برو به فهرست سوالات"
            title="برو به فهرست سوالات"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
        )}
      </div>
      )}
      </div>
    </div>
  );
}

