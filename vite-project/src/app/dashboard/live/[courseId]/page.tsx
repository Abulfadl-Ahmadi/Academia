import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { ArrowLeft, Radio, AlertCircle, MessageCircle } from "lucide-react";
import LiveChat from "./LiveChat";

interface Course {
  id: number;
  title: string;
  description: string;
  teacher: {
    username: string;
  };
  is_live: boolean;
  live_iframe?: string;
}

export default function LiveStreamPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/courses/${courseId}/`);
      setCourse(response.data);

      // اگر کلاس آنلاین نیست، پیام خطا نمایش داده و به صفحه قبل برگردانده می‌شود
      if (!response.data.is_live) {
        toast.error("این کلاس در حال حاضر آنلاین نیست");
        navigate(-1);
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast.error("خطا در دریافت اطلاعات دوره");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate]);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, fetchCourseData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          دوره یافت نشد
        </h3>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          بازگشت
        </Button>
      </div>
    );
  }

  if (!course.is_live || !course.live_iframe) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          پخش زنده در دسترس نیست
        </h3>
        <p className="text-muted-foreground mb-4">
          این کلاس در حال حاضر آنلاین نیست یا پخش زنده تنظیم نشده است
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          بازگشت
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Left Column: Live Stream and Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        {/* <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300 animate-pulse">
                      <Radio className="w-3 h-3 mr-1" />
                      زنده
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">مدرس: {course.teacher.username}</p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card> */}

        {/* Live Stream Player */}
        <Card className="flex-1">
          <CardContent className="p-0 h-full">
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: course.live_iframe }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Live Chat */}
      <div className="lg:col-span-1 flex flex-col">
        <Card className="flex-1 flex flex-col pb-0 gap-0">
          <CardHeader>
            <CardTitle>
              <div className="flex flex-row items-center">
                <MessageCircle className="ml-2" />
                <p> چت زنده</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {courseId && <LiveChat courseId={courseId} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
