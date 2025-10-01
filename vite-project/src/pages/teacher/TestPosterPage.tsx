import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { TextShimmer } from "../../../components/motion-primitives/text-shimmer";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  BookOpen,
  ArrowLeft,
  Copy,
  Link,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogoSvg } from "@/components/LogoSvg";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { SlidingNumber } from "../../../components/motion-primitives/sliding-number";
// import html2canvas from 'html2canvas';

interface QuestionTest {
  id: number;
  name: string;
  description?: string;
  duration: string;
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  created_at: string;
  questions_count?: number;
  folders_count?: number;
  collection?: {
    id: number;
    name: string;
    created_by_name: string;
  };
}

export default function TestPosterPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const posterRef = useRef<HTMLDivElement>(null);
  const [test, setTest] = useState<QuestionTest | null>(null);
  const [loading, setLoading] = useState(true);

  // Countdown states
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  // Calculate target date based on test start_time
  const targetDate = useMemo(() => {
    if (test?.start_time) {
      return new Date(test.start_time);
    }
    return null;
  }, [test?.start_time]);

  const loadTest = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/question-tests/${id}/`);
      setTest(response.data);
    } catch (error) {
      console.error("Error loading test:", error);
      toast.error("خطا در بارگذاری آزمون");
      navigate("/panel/question-tests");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      loadTest();
    }
  }, [id, loadTest]);

  // Update countdown every second
  useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      const now = new Date();
      const startTime = targetDate.getTime();
      const endTime = test?.end_time ? new Date(test.end_time).getTime() : null;
      const currentTime = now.getTime();

      if (endTime && currentTime > endTime) {
        // Test has ended
        setDays(0);
        setHours(0);
        setMinutes(0);
        setSeconds(0);
      } else if (currentTime > startTime) {
        // Test has started but not ended
        setDays(0);
        setHours(0);
        setMinutes(0);
        setSeconds(0);
      } else {
        // Test hasn't started yet - show countdown
        const difference = startTime - currentTime;
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setDays(days);
        setHours(hours);
        setMinutes(minutes);
        setSeconds(seconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, test?.end_time]);

  const formatDuration = (duration: string) => {
    // Check if duration is in hh:mm:ss format
    const timeMatch = duration.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      // const seconds = parseInt(timeMatch[3]); // معمولاً ثانیه‌ها را نمایش نمی‌دهیم

      if (hours > 0) {
        return `${hours} ساعت و ${minutes} دقیقه`;
      }
      return `${minutes} دقیقه`;
    }

    // Fallback for PT format (if still needed)
    const ptMatch = duration.match(/PT(\d+H)?(\d+M)?/);
    if (ptMatch) {
      const hours = ptMatch[1] ? parseInt(ptMatch[1].replace("H", "")) : 0;
      const minutes = ptMatch[2] ? parseInt(ptMatch[2].replace("M", "")) : 0;

      if (hours > 0) {
        return `${hours} ساعت و ${minutes} دقیقه`;
      }
      return `${minutes} دقیقه`;
    }

    return duration;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    const weekday = date.toLocaleDateString("fa-IR", { weekday: "long" });
    const day = date.toLocaleDateString("fa-IR", { day: "numeric" });
    const month = date.toLocaleDateString("fa-IR", { month: "long" });
    const year = date.toLocaleDateString("fa-IR", { year: "numeric" });

    return `${weekday}، ${day} ${month} ${year}`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTestLink = () => {
    return `${window.location.origin}/test-poster/${test?.id}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getTestLink());
      toast.success("لینک آزمون کپی شد");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = getTestLink();
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success("لینک آزمون کپی شد");
      } catch (err) {
        console.error("Error copying to clipboard:", err);
        toast.error("خطا در کپی کردن لینک");
      }
      document.body.removeChild(textArea);
    }
  };

  // Helper function to get test status
  const getTestStatus = () => {
    if (!test?.start_time) return null;

    const now = new Date();
    const startTime = new Date(test.start_time);
    const endTime = test.end_time ? new Date(test.end_time) : null;

    if (endTime && now > endTime) {
      return "ended";
    } else if (now > startTime) {
      return "started";
    } else {
      return "upcoming";
    }
  };

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
          <h2 className="text-lg font-semibold mb-2">آزمون یافت نشد</h2>
          <Button onClick={() => navigate("/panel/question-tests")}>
            بازگشت به لیست آزمون‌ها
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background relative">
      {/* Question Mark Pattern - Hidden Background */}
      <div className="fixed inset-0 opacity-5 pointer-events-none overflow-hidden">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 600 600"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Random scattered question marks */}
            <g id="questionMark1">
              <path
                d="M0 0c-4.4 0-8 3.6-8 8 0 1.1.9 2 2 2s2-.9 2-2c0-2.2 1.8-4 4-4s4 1.8 4 4c0 1.5-.8 2.8-2.1 3.6L-1 14c-.6.4-1 1.1-1 1.8V17c0 1.1.9 2 2 2s2-.9 2-2v-.4l2.4-1.6C6.2 16.2 8 13.8 8 11c0-4.4-3.6-8-8-8zm0 24c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
                fill="currentColor"
                fillOpacity="0.08"
              />
            </g>
            <g id="questionMark2">
              <path
                d="M0 0c-3 0-5.5 2.5-5.5 5.5 0 0.8.6 1.4 1.4 1.4s1.4-.6 1.4-1.4c0-1.5 1.2-2.7 2.7-2.7s2.7 1.2 2.7 2.7c0 1-.5 1.9-1.4 2.4L0 9.5c-.4.3-.7.8-.7 1.3V12c0 .8.6 1.4 1.4 1.4s1.4-.6 1.4-1.4v-.3l1.6-1.1c1.3-.9 2.1-2.4 2.1-4 0-3-2.5-5.5-5.5-5.5zm0 16.5c-.8 0-1.4.6-1.4 1.4s.6 1.4 1.4 1.4 1.4-.6 1.4-1.4-.6-1.4-1.4-1.4z"
                fill="currentColor"
                fillOpacity="0.06"
              />
            </g>
          </defs>
          
          {/* Scattered question marks with random positions, rotations, and sizes */}
          <use href="#questionMark1" transform="translate(45,67) rotate(12) scale(0.8)" />
          <use href="#questionMark2" transform="translate(156,23) rotate(-15) scale(1.2)" />
          <use href="#questionMark1" transform="translate(278,134) rotate(35) scale(0.6)" />
          <use href="#questionMark2" transform="translate(89,189) rotate(-8) scale(1.1)" />
          <use href="#questionMark1" transform="translate(234,245) rotate(22) scale(0.9)" />
          <use href="#questionMark2" transform="translate(367,76) rotate(-25) scale(0.7)" />
          <use href="#questionMark1" transform="translate(423,198) rotate(18) scale(1.3)" />
          <use href="#questionMark2" transform="translate(145,312) rotate(-12) scale(0.8)" />
          <use href="#questionMark1" transform="translate(312,289) rotate(8) scale(1.0)" />
          <use href="#questionMark2" transform="translate(478,167) rotate(-30) scale(0.9)" />
          <use href="#questionMark1" transform="translate(67,356) rotate(25) scale(0.7)" />
          <use href="#questionMark2" transform="translate(189,98) rotate(-5) scale(1.1)" />
          <use href="#questionMark1" transform="translate(345,45) rotate(40) scale(0.85)" />
          <use href="#questionMark2" transform="translate(512,234) rotate(-18) scale(0.75)" />
          <use href="#questionMark1" transform="translate(123,278) rotate(15) scale(1.05)" />
          <use href="#questionMark2" transform="translate(267,156) rotate(-22) scale(0.95)" />
          <use href="#questionMark1" transform="translate(398,89) rotate(6) scale(0.65)" />
          <use href="#questionMark2" transform="translate(456,345) rotate(-35) scale(1.15)" />
          <use href="#questionMark1" transform="translate(78,123) rotate(28) scale(0.9)" />
          <use href="#questionMark2" transform="translate(534,278) rotate(-10) scale(0.8)" />
        </svg>
      </div>

      {/* Action Buttons */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Button
          variant="outline"
          onClick={() => navigate("/panel/question-tests")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          بازگشت
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            کپی لینک
          </Button>
        </div>
      </div>

      {/* Poster Card */}
      <div className="max-w-4xl mx-auto">
        <Card
          ref={posterRef}
          className="p-0 overflow-hidden border-2 shadow-2xl bg-gradient-to-br from-card via-card to-muted/20 relative"
        >
          {/* Question Mark Pattern inside Poster */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
            <svg
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 400 400"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <g id="posterQuestion1">
                  <path
                    d="M0 0c-5 0-9 4-9 9 0 1 1 2 2 2s2-1 2-2c0-2.5 2-4.5 5-4.5s5 2 5 4.5c0 1.8-1 3.2-2.5 4L1 15c-.7.5-1.2 1.3-1.2 2.2V18c0 1 1 2 2 2s2-1 2-2v-.5l2.8-1.8C8.5 17.8 11 15.1 11 12c0-5-4-9-9-9zm0 27c-1.2 0-2.2 1-2.2 2.2s1 2.2 2.2 2.2 2.2-1 2.2-2.2-1-2.2-2.2-2.2z"
                    fill="currentColor"
                  />
                </g>
                <g id="posterQuestion2">
                  <path
                    d="M0 0c-3.5 0-6.5 3-6.5 6.5 0 0.9.7 1.6 1.6 1.6s1.6-.7 1.6-1.6c0-1.8 1.4-3.2 3.2-3.2s3.2 1.4 3.2 3.2c0 1.2-.6 2.3-1.6 2.9L0 10.8c-.5.4-.9 1-.9 1.6V13c0 .9.7 1.6 1.6 1.6s1.6-.7 1.6-1.6v-.4l2-1.3c1.5-1 2.4-2.7 2.4-4.5 0-3.5-3-6.5-6.5-6.5zm0 19.5c-.9 0-1.6.7-1.6 1.6s.7 1.6 1.6 1.6 1.6-.7 1.6-1.6-.7-1.6-1.6-1.6z"
                    fill="currentColor"
                  />
                </g>
              </defs>
              
              {/* Fewer, more scattered question marks for poster */}
              <use href="#posterQuestion1" transform="translate(67,45) rotate(8) scale(0.7)" />
              <use href="#posterQuestion2" transform="translate(189,123) rotate(-12) scale(0.9)" />
              <use href="#posterQuestion1" transform="translate(298,78) rotate(25) scale(0.6)" />
              <use href="#posterQuestion2" transform="translate(134,234) rotate(-8) scale(0.8)" />
              <use href="#posterQuestion1" transform="translate(345,198) rotate(18) scale(0.75)" />
              <use href="#posterQuestion2" transform="translate(89,156) rotate(-22) scale(0.65)" />
              <use href="#posterQuestion1" transform="translate(267,289) rotate(15) scale(0.85)" />
              <use href="#posterQuestion2" transform="translate(145,67) rotate(-5) scale(0.7)" />
            </svg>
          </div>

          <CardContent className="p-0 relative z-10">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-primary/45 via-primary/85 to-primary/70 text-primary-foreground p-3 text-center relative overflow-hidden">
              {/* Question Mark Header Pattern */}
              <div className="absolute inset-0 opacity-[0.08]">
                <svg
                  className="w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 200 100"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <defs>
                    <g id="headerQuestion">
                      <path
                        d="M0 0c-2.5 0-4.5 2-4.5 4.5 0 0.6.4 1 1 1s1-.4 1-1c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5c0 0.9-.5 1.7-1.3 2.1L0 8.2c-.3.2-.5.6-.5 1V10c0 .6.4 1 1 1s1-.4 1-1v-.2l1.2-.8c.8-.5 1.3-1.4 1.3-2.4 0-2.5-2-4.5-4.5-4.5zm0 12.5c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1z"
                        fill="currentColor"
                      />
                    </g>
                  </defs>
                  
                  {/* Scattered small question marks in header */}
                  <use href="#headerQuestion" transform="translate(23,15) rotate(12) scale(0.8)" />
                  <use href="#headerQuestion" transform="translate(67,28) rotate(-8) scale(0.6)" />
                  <use href="#headerQuestion" transform="translate(134,18) rotate(18) scale(0.7)" />
                  <use href="#headerQuestion" transform="translate(178,35) rotate(-15) scale(0.9)" />
                  <use href="#headerQuestion" transform="translate(45,55) rotate(22) scale(0.65)" />
                  <use href="#headerQuestion" transform="translate(98,48) rotate(-5) scale(0.75)" />
                  <use href="#headerQuestion" transform="translate(156,62) rotate(10) scale(0.85)" />
                </svg>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-primary-foreground/10 rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary-foreground/10 rounded-full translate-x-12 translate-y-12"></div>
              <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-primary-foreground/20 rounded-full"></div>
              <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-primary-foreground/20 rounded-full"></div>

              <div className="relative z-10">
                {/* <div className="flex items-center justify-center mb-4">
                  <BookOpen className="w-12 h-12 mr-4" />
                  <div className="text-right">
                    <h1 className="text-3xl font-bold mb-1">آزمون آنلاین</h1>
                    <p className="text-primary-foreground/90 text-lg">سیستم آموزشی آکادمیا</p>
                  </div>
                </div> */}

                {/* <Separator className="bg-primary-foreground/20 my-6" /> */}
                <div className="flex flex-row items-center justify-center gap-3">
                  <LogoSvg className="w-18 h-18" />
                  <div className="font-semibold text-2xl">
                    {test?.collection?.name}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-3xl font-bold">{test.name}</h2>
              {test.description && (
                <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
                  {test.description}
                </p>
              )}
            </div>
            {/* Content Section */}
            <div className="p-4 space-y-4">
              {/* Countdown Section */}
              {test.start_time && (
                <Card className="border-2 border-primary/20 bg-primary/5">
                  <CardContent className="px-6 text-center">
                    {(() => {
                      const status = getTestStatus();
                      if (status === "ended") {
                        return (
                          <>
                            <h3 className="text-xl font-semibold mb-6 text-foreground">
                              وضعیت آزمون
                            </h3>
                            <div className="text-2xl font-bold text-destructive">
                              آزمون تمام شد
                            </div>
                          </>
                        );
                      } else if (status === "started") {
                        return (
                          <>
                            <h3 className="text-xl font-semibold mb-6 text-foreground">
                              وضعیت آزمون
                            </h3>
                            <div className="text-2xl font-bold text-primary">
                              آزمون در حال برگزاری است
                            </div>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <h3 className="text-xl font-semibold mb-6 text-foreground">
                              زمان باقی‌مانده تا شروع آزمون
                            </h3>
                            <div
                              className="flex items-center justify-center gap-4 sm:gap-6 font-mono"
                              dir="ltr"
                            >
                              <div className="flex flex-col items-center">
                                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">
                                  <SlidingNumber value={days} padStart={true} />
                                </div>
                                <span className="font-sans text-xs sm:text-sm mt-2 text-muted-foreground">
                                  روز
                                </span>
                              </div>
                              <span className="text-muted-foreground text-3xl sm:text-4xl lg:text-5xl mb-4">
                                :
                              </span>
                              <div className="flex flex-col items-center">
                                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">
                                  <SlidingNumber
                                    value={hours}
                                    padStart={true}
                                  />
                                </div>
                                <span className="font-sans text-xs sm:text-sm mt-2 text-muted-foreground">
                                  ساعت
                                </span>
                              </div>
                              <span className="text-muted-foreground text-3xl sm:text-4xl lg:text-5xl mb-4">
                                :
                              </span>
                              <div className="flex flex-col items-center">
                                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">
                                  <SlidingNumber
                                    value={minutes}
                                    padStart={true}
                                  />
                                </div>
                                <span className="font-sans text-xs sm:text-sm mt-2 text-muted-foreground">
                                  دقیقه
                                </span>
                              </div>
                              <span className="text-muted-foreground text-3xl sm:text-4xl lg:text-5xl mb-4">
                                :
                              </span>
                              <div className="flex flex-col items-center">
                                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">
                                  <SlidingNumber
                                    value={seconds}
                                    padStart={true}
                                  />
                                </div>
                                <span className="font-sans text-xs sm:text-sm mt-2 text-muted-foreground">
                                  ثانیه
                                </span>
                              </div>
                            </div>
                          </>
                        );
                      }
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Test Collection */}
              {/* {test.collection && (
                <div className="text-center">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    مجموعه: {test.collection.name}
                  </Badge>
                </div>
              )} */}

              {/* Test Details Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Date & Time */}
                <Card className="border-2 border-border/50 bg-muted/30">
                  <CardContent className=" text-center ">
                    {test.start_time && (
                      <div className="flex flex-row justify-center">
                        <Calendar className="w-9 h-9 m-3 mb-3 text-primary" />
                        {/* <h3 className="text-lg font-semibold mb-2 text-foreground">
                        تاریخ برگزاری
                      </h3> */}
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary mb-1">
                            {formatDate(test.start_time)}
                          </p>
                          <p className="text-lg text-muted-foreground">
                            ساعت شروع: {formatTime(test.start_time)}
                          </p>
                        </div>
                      </div>
                    )}

                    <Separator className="my-6" />

                    <div className="flex flex-row justify-around gap-6">
                      <div>
                        <div className="flex flex-row justify-center items-stretch">
                          <Clock className="w-6 h-6 mx-auto ml-2" />
                          <h3 className="text-lg font-semibold mb-2 text-foreground">
                            مدت زمان
                          </h3>
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {formatDuration(test.duration)}
                        </p>
                      </div>

                      <div>
                        <div className="flex flex-row justify-center items-stretch">
                          <BookOpen className="w-6 h-6 mx-auto ml-2" />
                          <h3 className="text-lg font-semibold mb-2 text-foreground">
                            تعداد سوالات
                          </h3>
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {test.questions_count || 0} سوال
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status */}
                {/* <Card className="border-2 border-border/50 bg-muted/30">
                  <CardContent className="p-6 text-center">
                    <Share2 className="w-8 h-8 mx-auto mb-3 text-primary" />
                    <h3 className="text-lg font-semibold mb-2 text-foreground">
                      وضعیت
                    </h3>
                    <Badge
                      variant={test.is_active ? "default" : "secondary"}
                      className="text-lg px-4 py-2"
                    >
                      {test.is_active ? "فعال" : "غیرفعال"}
                    </Badge>
                  </CardContent>
                </Card> */}
              </div>

              {/* Link Section */}
              <div className="text-center w-full">
                <Button onClick={() => window.open(getTestLink(), "_blank")}>
                  <Link />
                  <TextShimmer
                    duration={1.2}
                    className="text-lg font-medium [--base-color:rgba(255,255,255,0.7)] [--base-gradient-color:rgba(255,255,255,1)] dark:[--base-color:rgba(255,255,255,0.7)] dark:[--base-gradient-color:rgba(255,255,255,1)]"
                  >
                    ورود به آزمون
                  </TextShimmer>{" "}
                </Button>
              </div>
              {/* <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">
                    لینک ورود به آزمون
                  </h3>
                  <div className="bg-background border border-border rounded-lg p-4 mb-4">
                    <code className="text-sm text-muted-foreground break-all select-all">
                      {getTestLink()}
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    این لینک را با دانش‌آموزان خود به اشتراک بگذارید
                  </p>
                </CardContent>
              </Card> */}

              {/* Footer */}
              <div className="text-center pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  تولید شده توسط سیستم آموزشی آکادمیا •{" "}
                  {formatDate(new Date().toISOString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
