import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { 
  Users, 
  Calendar,
  Plus,
  Play,
  FileText,
  Edit,
  Clock,
  Eye,
  Trash2,
  BarChart3,
  Radio,
  Copy,
  CheckCircle
} from "lucide-react";
import AddSessionModal from "./AddSessionModal";
import EditSessionModal from "./EditSessionModal";

interface Course {
  id: number;
  title: string;
  description: string;
  students_count: number;
  created_at: string;
  is_active: boolean;
  rtmp_url: string | null;
  rtmp_key: string | null;
  live_iframe: string | null;
  is_live: boolean;
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



interface TestCollection {
  id: number;
  name: string;
  description: string;
  total_tests: number;
  student_count: number;
  created_by_name: string;
  created_at: string;
  is_active: boolean;
}

interface Student {
  id: number;
  username: string;
}

interface CourseDetailProps {
  courseId: number;
}

export default function CourseDetail({ courseId }: CourseDetailProps) {
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [testCollections, setTestCollections] = useState<TestCollection[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSession, setShowAddSession] = useState(false);
  const [editSessionId, setEditSessionId] = useState<number | null>(null);
  const [showLiveDialog, setShowLiveDialog] = useState(false);
  const [isStartingLive, setIsStartingLive] = useState(false);

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      const [courseResponse, sessionsResponse, collectionsResponse] = await Promise.all([
        axiosInstance.get(`/courses/${courseId}/`),
        axiosInstance.get(`/courses/${courseId}/sessions/`),
        axiosInstance.get(`/courses/${courseId}/test_collections/`)
      ]);
      
      setCourse(courseResponse.data);
      
      // Handle both array and pagination format for sessions
      let sessionsData = [];
      if (Array.isArray(sessionsResponse.data)) {
        sessionsData = sessionsResponse.data;
      } else if (sessionsResponse.data && Array.isArray(sessionsResponse.data.results)) {
        sessionsData = sessionsResponse.data.results;
      } else {
        console.warn("Sessions data is not an array:", sessionsResponse.data);
        sessionsData = [];
      }
      
      // Handle both array and pagination format for test collections
      let collectionsData = [];
      if (Array.isArray(collectionsResponse.data)) {
        collectionsData = collectionsResponse.data;
      } else if (collectionsResponse.data && Array.isArray(collectionsResponse.data.results)) {
        collectionsData = collectionsResponse.data.results;
      } else {
        console.warn("Test collections data is not an array:", collectionsResponse.data);
        collectionsData = [];
      }
      
      setSessions(sessionsData);
      setTestCollections(collectionsData);
      setStudents(courseResponse.data.students);
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast.error("خطا در دریافت اطلاعات دوره");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);



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

  const handleStartLive = async () => {
    if (!course?.rtmp_url || !course?.rtmp_key) {
      toast.error("اطلاعات RTMP تکمیل نشده است. لطفاً ابتدا دوره را ویرایش کنید.");
      return;
    }

    if (!course?.live_iframe) {
      toast.error("کد iframe پخش زنده تنظیم نشده است. لطفاً ابتدا دوره را ویرایش کنید.");
      return;
    }

    try {
      setIsStartingLive(true);
      await axiosInstance.patch(`/courses/${courseId}/`, {
        is_live: true
      });
      
      // Update local state
      setCourse(prev => prev ? { ...prev, is_live: true } : null);
      
      toast.success("کلاس آنلاین شروع شد!");
      setShowLiveDialog(false);
    } catch (error) {
      console.error("Error starting live class:", error);
      toast.error("خطا در شروع کلاس آنلاین");
    } finally {
      setIsStartingLive(false);
    }
  };

  const handleStopLive = async () => {
    try {
      setIsStartingLive(true);
      await axiosInstance.patch(`/courses/${courseId}/`, {
        is_live: false
      });
      
      // Update local state
      setCourse(prev => prev ? { ...prev, is_live: false } : null);
      
      toast.success("کلاس آنلاین متوقف شد");
    } catch (error) {
      console.error("Error stopping live class:", error);
      toast.error("خطا در متوقف کردن کلاس آنلاین");
    } finally {
      setIsStartingLive(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} کپی شد`);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("خطا در کپی کردن");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  // const formatDuration = (seconds: number) => {
  //   const hours = Math.floor(seconds / 3600);
  //   const minutes = Math.floor((seconds % 3600) / 60);
  //   const secs = seconds % 60;
    
  //   if (hours > 0) {
  //     return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  //   }
  //   return `${minutes}:${secs.toString().padStart(2, '0')}`;
  // };

  // const getTestTypeLabel = (type: string) => {
  //   const labels: Record<string, string> = {
  //     weekly: "آزمون هفتگی",
  //     midterm: "میان‌ترم",
  //     final: "پایان‌ترم",
  //     assignment: "تکلیف",
  //   };
  //   return labels[type] || type;
  // };

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
        <h3 className="text-lg font-medium text-muted-foreground mb-2">دوره یافت نشد</h3>
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
              <p className="text-muted-foreground mt-2">{course.description || "توضیحی برای این دوره ثبت نشده است"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={course.is_active ? "default" : "secondary"}>
                {course.is_active ? "فعال" : "غیرفعال"}
              </Badge>
              {course.is_live && (
                <Badge variant="destructive" className="animate-pulse">
                  <Radio className="w-3 h-3 ml-1" />
                  پخش زنده
                </Badge>
              )}
              
              {course.rtmp_url && course.rtmp_key && course.live_iframe && (
                <div className="flex gap-2">
                  {!course.is_live ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowLiveDialog(true)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Radio className="w-4 h-4 ml-2" />
                      شروع کلاس آنلاین
                    </Button>
                  ) : (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleStopLive}
                      disabled={isStartingLive}
                    >
                      {isStartingLive ? "در حال متوقف کردن..." : "متوقف کردن کلاس"}
                    </Button>
                  )}
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/panel/courses/${courseId}/edit`)}
              >
                <Edit className="w-4 h-4 ml-2" />
                ویرایش دوره
              </Button>
            </div>
          </div>
          
          {/* Course Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg">
              <Play className="w-6 h-6 text-blue-600" />
              <div>
                <div className="text-lg font-bold text-blue-600">{sessions.length}</div>
                <div className="text-sm text-blue-600">جلسه</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
              <div>
                <div className="text-lg font-bold text-green-600">{testCollections.length}</div>
                <div className="text-sm text-green-600">مجموعه آزمون</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
              <div>
                <div className="text-lg font-bold text-purple-600">{course.students_count}</div>
                <div className="text-sm text-purple-600">دانش‌آموز</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg">
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
          <TabsTrigger value="tests">مجموعه آزمون‌ها ({testCollections.length})</TabsTrigger>
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
                  <Play className="w-16 h-16 text-muted-foreground  mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">هنوز جلسه‌ای ایجاد نشده است</h3>
                  <p className="text-muted-foreground mb-6">برای شروع، اولین جلسه دوره را ایجاد کنید</p>
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
                      onEdit={setEditSessionId}
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
                <CardTitle>مجموعه آزمون‌های دوره</CardTitle>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => navigate(`/panel/test-collections/new?courseId=${courseId}`)}
                >
                  <Plus className="w-4 h-4" />
                  افزودن مجموعه آزمون جدید
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {testCollections.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-muted-foreground  mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">هنوز مجموعه آزمونی ایجاد نشده است</h3>
                  <p className="text-muted-foreground mb-6">برای شروع، اولین مجموعه آزمون دوره را ایجاد کنید</p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/panel/test-collections/new?courseId=${courseId}`)}
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    افزودن مجموعه آزمون جدید
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {testCollections.map((collection) => (
                    <CollectionCard key={collection.id} collection={collection} />
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
              {students.length === 0 ? (
                <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground  mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">هنوز دانش‌آموزی ثبت‌نام نشده است</h3>
                <p className="text-muted-foreground">دانش‌آموزان از طریق فروشگاه می‌توانند در این دوره ثبت‌نام کنند</p>
              </div>
              ) : (
                <div className="space-y-4">
                  {students.map((student) => (
                  <div>{student.username}</div>
                ))}
                </div>
              )}

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

      {/* Edit Session Modal */}
      {editSessionId && (
        <EditSessionModal
          courseId={courseId}
          sessionId={editSessionId}
          onClose={() => setEditSessionId(null)}
          onSessionUpdated={() => {
            setEditSessionId(null);
            fetchCourseData();
          }}
        />
      )}

      {/* Live Class Confirmation Dialog */}
      <Dialog open={showLiveDialog} onOpenChange={setShowLiveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-600" />
              شروع کلاس آنلاین
            </DialogTitle>
            <DialogDescription>
              آیا از شروع کلاس آنلاین اطمینان دارید؟ پس از تأیید، کلاس برای دانش‌آموزان قابل مشاهده خواهد بود.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <h4 className="font-medium text-sm">اطلاعات پخش زنده:</h4>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">RTMP URL:</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={course?.rtmp_url || ""} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(course?.rtmp_url || "", "RTMP URL")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Stream Key:</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="password"
                    value={course?.rtmp_key || ""} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(course?.rtmp_key || "", "Stream Key")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">نکات مهم:</p>
                <ul className="space-y-1 text-xs">
                  <li>• از نرم‌افزار پخش مناسب (مثل OBS) استفاده کنید</li>
                  <li>• اطلاعات RTMP را در نرم‌افزار خود تنظیم کنید</li>
                  <li>• قبل از شروع، اتصال اینترنت را بررسی کنید</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowLiveDialog(false)}
            >
              انصراف
            </Button>
            <Button 
              onClick={handleStartLive}
              disabled={isStartingLive}
              className="bg-red-600 hover:bg-red-700"
            >
              {isStartingLive ? "در حال شروع..." : "شروع کلاس آنلاین"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SessionCardProps {
  session: Session;
  onDelete: (sessionId: number) => void;
  onTogglePublish: (sessionId: number, currentStatus: boolean) => void;
  onEdit: (sessionId: number) => void;
}

function SessionCard({ session, onDelete, onTogglePublish, onEdit }: SessionCardProps) {
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
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {session.description || "توضیحی برای این جلسه ثبت نشده است"}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(session.id)}
            >
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



interface CollectionCardProps {
  collection: TestCollection;
}

function CollectionCard({ collection }: CollectionCardProps) {
  const navigate = useNavigate();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant={collection.is_active ? "default" : "secondary"}>
                {collection.is_active ? "فعال" : "غیرفعال"}
              </Badge>
            </div>
            <h3 className="text-lg font-medium mb-2">{collection.name}</h3>
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {collection.description || "توضیحی برای این مجموعه آزمون ثبت نشده است"}
            </p>
            
            <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>{collection.total_tests} آزمون</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{collection.student_count} دانش‌آموز</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(collection.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/panel/test-collections/${collection.id}`)}
            >
              <Eye className="w-4 h-4 ml-2" />
              مشاهده و ویرایش
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/panel/test-collections/${collection.id}/statistics`)}
            >
              <BarChart3 className="w-4 h-4 ml-2" />
              آمار
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
