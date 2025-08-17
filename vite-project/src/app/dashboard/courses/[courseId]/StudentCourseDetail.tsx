import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { 
  Users, 
  Calendar,
  Play,
  FileText,
  Clock,
  Download,
  X
} from "lucide-react";

interface Course {
  id: number;
  title: string;
  description: string;
  teacher: {
    username: string;
  };
  created_at: string;
}

interface File {
  id: number;
  file_id: string;
  file_type: string;
  title: string;
  arvan_url?: string;
  created_at: string;
  player_url: string;
}

interface Session {
  id: number;
  title: string;
  session_number: number;
  description: string;
  created_at: string;
  is_published: boolean;
  is_watched: boolean;
  files: File[];
}

interface StudentCourseDetailProps {
  courseId: number;
}

export default function StudentCourseDetail({ courseId }: StudentCourseDetailProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const [courseResponse, sessionsResponse] = await Promise.all([
        axiosInstance.get(`/courses/${courseId}/`),
        axiosInstance.get(`/courses/${courseId}/student-sessions/`)
      ]);
      
      setCourse(courseResponse.data);
      setSessions(sessionsResponse.data);
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast.error("خطا در دریافت اطلاعات دوره");
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    // Mark session as watched
    if (!session.is_watched) {
      markSessionAsWatched(session.id);
    }
  };

  const markSessionAsWatched = async (sessionId: number) => {
    try {
      await axiosInstance.post(`/courses/sessions/${sessionId}/mark-watched/`);
      // Update local state
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, is_watched: true } : s
      ));
    } catch (error) {
      console.error("Error marking session as watched:", error);
    }
  };

  const handleDownloadLectureNotes = (session: Session) => {
    const pdfFile = session.files.find(f => f.file_type === 'application/pdf');
    if (pdfFile) {
      const link = document.createElement("a");
      link.href = pdfFile.file_id; // This should be the download URL
      link.download = `lecture_notes_${session.session_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString("fa-IR");
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

  // const publishedSessions = sessions.filter(s => s.is_published);
  const publishedSessions = sessions;
  const progressPercentage = publishedSessions.length > 0 
    ? Math.round((sessions.filter(s => s.is_watched).length / publishedSessions.length) * 100)
    : 0;

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
          </div>
          
          {/* Course Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-3 p-3 bg-blue-500/5 rounded-lg">
              <Play className="w-6 h-6 text-blue-600" />
              <div>
                <div className="text-lg font-bold text-blue-600">{publishedSessions.length}</div>
                <div className="text-sm text-blue-600">جلسه</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-500/5 op rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
              <div>
                <div className="text-sm text-purple-600">مدرس</div>
                <div className="text-sm font-medium text-purple-600">{course.teacher.username}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-500/5 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
              <div>
                <div className="text-sm text-orange-600">پیشرفت</div>
                <div className="text-sm font-medium text-orange-600">{progressPercentage}%</div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sessions">جلسات ({publishedSessions.length})</TabsTrigger>
          <TabsTrigger value="lecture-notes">جزوات ({publishedSessions.filter(s => s.files.some(f => f.file_type === 'application/pdf')).length})</TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>جلسات دوره</CardTitle>
            </CardHeader>
            <CardContent>
              {publishedSessions.length === 0 ? (
                <div className="text-center py-12">
                  <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">هنوز جلسه‌ای منتشر نشده است</h3>
                  <p className="text-muted-foreground">لطفاً منتظر بمانید تا معلم جلسات را منتشر کند</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {publishedSessions.map((session) => (
                    <StudentSessionCard 
                      key={session.id} 
                      session={session}
                      onClick={() => handleSessionClick(session)}
                      onDownloadNotes={() => handleDownloadLectureNotes(session)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lecture Notes Tab */}
        <TabsContent value="lecture-notes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>جزوات دوره</CardTitle>
            </CardHeader>
            <CardContent>
              {publishedSessions.filter(s => s.files.some(f => f.file_type === 'application/pdf')).length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">هنوز جزوه‌ای آپلود نشده است</h3>
                  <p className="text-muted-foreground">لطفاً منتظر بمانید تا معلم جزوات را آپلود کند</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publishedSessions
                    .filter(s => s.files.some(f => f.file_type === 'application/pdf'))
                    .map((session) => (
                      <LectureNotesCard 
                        key={session.id} 
                        session={session}
                        onDownload={() => handleDownloadLectureNotes(session)}
                      />
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}

interface StudentSessionCardProps {
  session: Session;
  onClick: () => void;
  onDownloadNotes: () => void;
}

function StudentSessionCard({ session, onClick, onDownloadNotes }: StudentSessionCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  const hasVideo = session.files.some(f => f.file_type.startsWith('video/'));
  const hasPDF = session.files.some(f => f.file_type === 'application/pdf');

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline">جلسه {session.session_number}</Badge>
              {session.is_watched && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  مشاهده شده
                </Badge>
              )}
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
            </div>

            {/* Files */}
            <div className="flex items-center gap-3">
              {hasVideo && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Play className="w-4 h-4" />
                  <span>ویدیو موجود</span>
                </div>
              )}
              {hasPDF && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <FileText className="w-4 h-4" />
                  <span>جزوه موجود</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <Play className="w-4 h-4 ml-2" />
              مشاهده
            </Button>
            {hasPDF && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadNotes();
                }}
              >
                <Download className="w-4 h-4 ml-2" />
                دانلود جزوه
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface LectureNotesCardProps {
  session: Session;
  onDownload: () => void;
}

function LectureNotesCard({ session, onDownload }: LectureNotesCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="text-center">
          <FileText className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-medium mb-2">جلسه {session.session_number}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{session.title}</p>
          <Button onClick={onDownload} className="w-full" size="sm">
            <Download className="w-4 h-4 ml-2" />
            دانلود جزوه
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface SessionDetailModalProps {
  session: Session;
  onClose: () => void;
}

function SessionDetailModal({ session, onClose }: SessionDetailModalProps) {
  const videoFile = session.files.find(f => f.file_type.startsWith('video/'));
  const pdfFile = session.files.find(f => f.file_type === 'application/pdf');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">جلسه {session.session_number}: {session.title}</h2>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {session.description && (
            <p className="text-muted-foreground mb-6">{session.description}</p>
          )}

          {/* Video Player */}
          {videoFile && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">ویدیو جلسه</h3>
              {/* <video 
                controls 
                className="w-full rounded-lg"
                src={videoFile.arvan_url || videoFile.file_id}
              >
                مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
              </video> */}
              {/* {videoFile.player_url} */}
              <iframe 
                src={videoFile.player_url}
                className="w-full rounded-lg"
                title="Video Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}

          {/* Lecture Notes */}
          {pdfFile && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">جزوه جلسه</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">جزوه جلسه {session.session_number}</p>
                    <p className="text-sm text-muted-foreground">فایل PDF</p>
                  </div>
                  <Button onClick={() => {
                    const link = document.createElement("a");
                    link.href = pdfFile.file_id;
                    link.download = `lecture_notes_${session.session_number}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}>
                    <Download className="w-4 h-4 ml-2" />
                    دانلود
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose}>بستن</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
