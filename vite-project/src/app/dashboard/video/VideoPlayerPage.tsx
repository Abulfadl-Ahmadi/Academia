// VideoPlayerPage.tsx
import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';

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
  course: {
    id: number;
    title: string;
  };
}

export default function VideoPlayerPage() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionIdFromParams = sessionId || searchParams.get('sessionId');
  const [session, setSession] = useState<Session | null>(null);
  const [relatedSessions, setRelatedSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerUrl, setPlayerUrl] = useState('');

  useEffect(() => {
    if (sessionIdFromParams) {
      fetchSessionData(parseInt(sessionIdFromParams));
    }
  }, [sessionIdFromParams]);

  const fetchSessionData = async (id: number) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/student-sessions/${id}/`);
      setSession(response.data);
      
      // Fetch player URL for video
      const videoFile = response.data.files.find((f: File) => f.file_type.startsWith('video/'));
      if (videoFile?.id) {
        const playerResponse = await axiosInstance.get(`/files/${videoFile.id}/player_url`);
        setPlayerUrl(playerResponse.data.player_url);
      }
      
      // Mark session as watched
      // if (!response.data.is_watched) {
      //   await axiosInstance.post(`/courses/sessions/${id}/mark-watched/`);
      // }
      
      // Fetch related sessions from the same course
      if (response.data.course) {
        const relatedResponse = await axiosInstance.get(`/courses/${response.data.course}/student-sessions/`);
        
        // Handle both array and pagination format
        let sessionsData = [];
        if (Array.isArray(relatedResponse.data)) {
          sessionsData = relatedResponse.data;
        } else if (relatedResponse.data && Array.isArray(relatedResponse.data.results)) {
          sessionsData = relatedResponse.data.results;
        } else {
          console.warn("Sessions data is not an array:", relatedResponse.data);
          sessionsData = [];
        }
        
        setRelatedSessions(sessionsData.filter((s: Session) => s.id !== id));
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
      toast.error("خطا در دریافت اطلاعات جلسه");
    } finally {
      setLoading(false);
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
    } else {
      toast.error("جزوه‌ای برای این جلسه موجود نیست");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-muted-foreground mb-2">جلسه یافت نشد</h3>
      </div>
    );
  }

  // const videoFile = session.files.find(f => f.file_type.startsWith('video/'));
  const pdfFile = session.files.find(f => f.file_type === 'application/pdf');

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Video Player */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Player */}
          <div className="rounded-lg overflow-hidden bg-black aspect-video">
            {playerUrl ? (
              <iframe 
                src={playerUrl}
                className="w-full h-full"
                title="Video Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                ویدیویی برای این جلسه موجود نیست
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold">{session.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">جلسه {session.session_number}</Badge>
                <span className="text-muted-foreground">{session.course.title}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-t border-b">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(session.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>مشاهده شده</span>
                </div>
              </div>
              
              {/* <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <ThumbsUp className="w-4 h-4 ml-2" />
                  پسندیدم
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 ml-2" />
                  اشتراک‌گذاری
                </Button>
                <Button variant="outline" size="sm">
                  <Bookmark className="w-4 h-4 ml-2" />
                  ذخیره
                </Button>
              </div> */}
            </div>

            {/* Description */}
            <div>
              <p className="text-muted-foreground">
                {session.description || "توضیحی برای این جلسه ثبت نشده است"}
              </p>
            </div>

            {/* Lecture Notes */}
            {pdfFile && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">جزوه جلسه</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">جزوه جلسه {session.session_number}</p>
                      <p className="text-sm text-muted-foreground">فایل PDF</p>
                    </div>
                    <Button onClick={() => handleDownloadLectureNotes(session)}>
                      <Download className="w-4 h-4 ml-2" />
                      دانلود
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Lecture Notes as Recommendations */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">فایل‌های جزوه و دست‌نویس مربوط به این جلسه</h2>
          
          {/* Lecture Notes Section */}
          {pdfFile && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-3">جزوه این جلسه</h3>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">جزوه جلسه {session.session_number}</p>
                    <p className="text-sm text-muted-foreground">فایل PDF</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadLectureNotes(session)}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Sessions */}
          <div className="space-y-3">
            {relatedSessions.length > 0 ? (
              relatedSessions.map((relatedSession) => (
                <RelatedSessionCard 
                  key={relatedSession.id} 
                  session={relatedSession} 
                  onSelect={() => {
                    // Update URL without page reload
                    const url = new URL(window.location.href);
                    url.searchParams.set('sessionId', relatedSession.id.toString());
                    window.history.pushState({}, '', url);
                    // Fetch new session data
                    fetchSessionData(relatedSession.id);
                  }}
                />
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">جلسه دیگری در این دوره موجود نیست</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RelatedSessionCardProps {
  session: Session;
  onSelect: () => void;
}

function RelatedSessionCard({ session, onSelect }: RelatedSessionCardProps) {
  const hasPDF = session.files.some(f => f.file_type === 'application/pdf');
  const hasVideo = session.files.some(f => f.file_type.startsWith('video/'));

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="p-3">
        <div className="flex gap-3">
          <div className="w-24 h-16 bg-gray-100 rounded-md flex items-center justify-center">
            {session.is_watched && (
              <Badge variant="default" className="absolute top-1 right-1 text-xs bg-blue-500">
                مشاهده شده
              </Badge>
            )}
            <div className="text-muted-foreground ">
              جلسه {session.session_number}
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-medium line-clamp-1">{session.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              {hasVideo && (
                <Badge variant="outline" className="text-xs">ویدیو</Badge>
              )}
              {hasPDF && (
                <Badge variant="outline" className="text-xs">جزوه</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}