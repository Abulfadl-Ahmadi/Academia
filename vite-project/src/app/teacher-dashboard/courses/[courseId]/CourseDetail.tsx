import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { 
  BookOpen, 
  Users, 
  Calendar,
  Plus,
  Play,
  FileText,
  Edit,
  Clock,
  Download,
  Eye,
  Trash2
} from "lucide-react";
import AddSessionModal from "./AddSessionModal";

interface Course {
  id: number;
  title: string;
  description: string;
  students_count: number;
  created_at: string;
  is_active: boolean;
}

interface Session {
  id: number;
  title: string;
  session_number: number;
  description: string;
  video_file: string | null;
  video_duration: number | null;
  lecture_notes: string | null;
  created_at: string;
  is_published: boolean;
}

interface Test {
  id: number;
  title: string;
  test_type: string;
  description: string;
  duration_minutes: number;
  total_points: number;
  due_date: string;
  is_active: boolean;
}

interface CourseDetailProps {
  courseId: number;
}

export default function CourseDetail({ courseId }: CourseDetailProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSession, setShowAddSession] = useState(false);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const [courseResponse, sessionsResponse, testsResponse] = await Promise.all([
        axiosInstance.get(`/courses/${courseId}/`),
        axiosInstance.get(`/courses/${courseId}/sessions/`),
        axiosInstance.get(`/courses/${courseId}/tests/`)
      ]);
      
      setCourse(courseResponse.data);
      setSessions(sessionsResponse.data);
      setTests(testsResponse.data);
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast.error("خطا در دریافت اطلاعات دوره");
    } finally {
      setLoading(false);
    }
  };

  const handleSessionAdded = () => {
    setShowAddSession(false);
    fetchCourseData(); // Refresh data
    toast.success("جلسه با موفقیت اضافه شد");
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!confirm("آیا از حذف این جلسه اطمینان دارید؟")) return;
    
    try {
      await axiosInstance.delete(`/sessions/${sessionId}/`);
      toast.success("جلسه با موفقیت حذف شد");
      fetchCourseData(); // Refresh data
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("خطا در حذف جلسه");
    }
  };

  const handleToggleSessionPublish = async (sessionId: number, currentStatus: boolean) => {
    try {
      await axiosInstance.patch(`sessions/${sessionId}/`, {
        is_published: !currentStatus
      });
      toast.success(`جلسه ${!currentStatus ? 'منتشر' : 'غیرمنتشر'} شد`);
      fetchCourseData(); // Refresh data
    } catch (error) {
      console.error("Error updating session:", error);
      toast.error("خطا در به‌روزرسانی وضعیت جلسه");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      weekly: "آزمون هفتگی",
      midterm: "میان‌ترم",
      final: "پایان‌ترم",
      assignment: "تکلیف",
    };
    return labels[type] || type;
  };

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
        <h3 className="text-lg font-medium text-gray-900 mb-2">دوره یافت نشد</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              <p className="text-gray-600 mt-2">{course.description || "توضیحی برای این دوره ثبت نشده است"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={course.is_active ? "default" : "secondary"}>
                {course.is_active ? "فعال" : "غیرفعال"}
              </Badge>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 ml-2" />
                ویرایش دوره
              </Button>
            </div>
          </div>
          
          {/* Course Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Play className="w-6 h-6 text-blue-600" />
              <div>
                <div className="text-lg font-bold text-blue-600">{sessions.length}</div>
                <div className="text-sm text-blue-600">جلسه</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
              <div>
                <div className="text-lg font-bold text-green-600">{tests.length}</div>
                <div className="text-sm text-green-600">آزمون</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
              <div>
                <div className="text-lg font-bold text-purple-600">{course.students_count}</div>
                <div className="text-sm text-purple-600">دانش‌آموز</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
              <div>
                <div className="text-sm text-orange-600">ایجاد شده در</div>
                <div className="text-sm font-medium text-orange-600">{formatDate(course.created_at)}</div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sessions">جلسات ({sessions.length})</TabsTrigger>
          <TabsTrigger value="tests">آزمون‌ها ({tests.length})</TabsTrigger>
          <TabsTrigger value="students">دانش‌آموزان ({course.students_count})</TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>جلسات دوره</CardTitle>
                <Button onClick={() => setShowAddSession(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  افزودن جلسه جدید
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">هنوز جلسه‌ای ایجاد نشده است</h3>
                  <p className="text-gray-500 mb-6">برای شروع، اولین جلسه دوره را ایجاد کنید</p>
                  <Button onClick={() => setShowAddSession(true)}>
                    <Plus className="w-4 h-4 ml-2" />
                    افزودن جلسه جدید
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <SessionCard 
                      key={session.id} 
                      session={session}
                      onDelete={handleDeleteSession}
                      onTogglePublish={handleToggleSessionPublish}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tests Tab */}
        <TabsContent value="tests" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>آزمون‌های دوره</CardTitle>
                <Button variant="outline" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  افزودن آزمون جدید
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tests.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">هنوز آزمونی ایجاد نشده است</h3>
                  <p className="text-gray-500 mb-6">برای شروع، اولین آزمون دوره را ایجاد کنید</p>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 ml-2" />
                    افزودن آزمون جدید
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tests.map((test) => (
                    <TestCard key={test.id} test={test} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>دانش‌آموزان ثبت‌نام شده</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">هنوز دانش‌آموزی ثبت‌نام نشده است</h3>
                <p className="text-gray-500">دانش‌آموزان از طریق فروشگاه می‌توانند در این دوره ثبت‌نام کنند</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Session Modal */}
      {showAddSession && (
        <AddSessionModal
          courseId={courseId}
          onClose={() => setShowAddSession(false)}
          onSessionAdded={handleSessionAdded}
        />
      )}
    </div>
  );
}

interface SessionCardProps {
  session: Session;
  onDelete: (sessionId: number) => void;
  onTogglePublish: (sessionId: number, currentStatus: boolean) => void;
}

function SessionCard({ session, onDelete, onTogglePublish }: SessionCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "نامشخص";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline">جلسه {session.session_number}</Badge>
              <Badge variant={session.is_published ? "default" : "secondary"}>
                {session.is_published ? "منتشر شده" : "پیش‌نویس"}
              </Badge>
            </div>
            <h3 className="text-lg font-medium mb-2">{session.title}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {session.description || "توضیحی برای این جلسه ثبت نشده است"}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(session.created_at)}</span>
              </div>
              {session.video_duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(session.video_duration)}</span>
                </div>
              )}
            </div>

            {/* Files */}
            <div className="flex items-center gap-3">
              {session.video_file && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Play className="w-4 h-4" />
                  <span>ویدیو آپلود شده</span>
                </div>
              )}
              {session.lecture_notes && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <FileText className="w-4 h-4" />
                  <span>جزوه آپلود شده</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onTogglePublish(session.id, session.is_published)}
            >
              {session.is_published ? "غیرمنتشر کردن" : "انتشار"}
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 ml-2" />
              ویرایش
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDelete(session.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              حذف
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TestCardProps {
  test: Test;
}

function TestCard({ test }: TestCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline">{getTestTypeLabel(test.test_type)}</Badge>
              <Badge variant={test.is_active ? "default" : "secondary"}>
                {test.is_active ? "فعال" : "غیرفعال"}
              </Badge>
            </div>
            <h3 className="text-lg font-medium mb-2">{test.title}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {test.description || "توضیحی برای این آزمون ثبت نشده است"}
            </p>
            
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{test.duration_minutes} دقیقه</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>{test.total_points} نمره</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(test.due_date)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 ml-2" />
              مشاهده
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 ml-2" />
              ویرایش
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getTestTypeLabel(type: string) {
  const labels: Record<string, string> = {
    weekly: "آزمون هفتگی",
    midterm: "میان‌ترم",
    final: "پایان‌ترم",
    assignment: "تکلیف",
  };
  return labels[type] || type;
}
