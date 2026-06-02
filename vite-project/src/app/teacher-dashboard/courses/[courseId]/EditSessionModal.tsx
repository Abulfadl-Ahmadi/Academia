import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import * as tus from 'tus-js-client';
import { 
  X, 
  Upload, 
  Play, 
  FileText, 
  CheckCircle,
  Save
} from "lucide-react";

interface EditSessionModalProps {
  courseId: number;
  sessionId: number;
  onClose: () => void;
  onSessionUpdated: () => void;
}

interface Session {
  id: number;
  title: string;
  session_number: string;
  description: string;
  video_url?: string;
  lecture_notes_url?: string;
}

interface Course {
  id: number;
  title: string;
  vod_channel_id: string;
}

export default function EditSessionModal({ courseId, sessionId, onClose, onSessionUpdated }: EditSessionModalProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [existingVideoFile, setExistingVideoFile] = useState<any | null>(null);
  const [existingNotesFile, setExistingNotesFile] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    session_number: "",
    description: "",
  });
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [lectureNotesFile, setLectureNotesFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Arvan Cloud Video Platform configuration (read from Vite env)
  const vodApiKey = import.meta.env.VITE_VOD_API_KEY || '';
  const vodBaseUrl = import.meta.env.VITE_VOD_BASE_URL || 'https://napi.arvancloud.ir/vod/2.0';

  // Fetch session and course data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch session data
        const sessionResponse = await axiosInstance.get(`/sessions/${sessionId}/`);
        const sessionData = sessionResponse.data;
        setSession(sessionData);
        setFormData({
          title: sessionData.title,
          session_number: sessionData.session_number,
          description: sessionData.description || "",
        });

        // Fetch course data
        const courseResponse = await axiosInstance.get(`/courses/${courseId}/`);
        setCourse(courseResponse.data);
        // Fetch files for this session (video, lecture notes)
        try {
          const filesRes = await axiosInstance.get(`/files/?session=${sessionId}`);
          const files = filesRes.data || [];
          const video = files.find((f: any) => f.file_type && f.file_type.includes('video'));
          const pdf = files.find((f: any) => f.file_type && f.file_type.includes('pdf'));
          setExistingVideoFile(video || null);
          setExistingNotesFile(pdf || null);
        } catch (err) {
          // Non-fatal: just don't show files
          console.warn('Failed to fetch session files', err);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("خطا در دریافت اطلاعات جلسه");
      }
    };
    fetchData();
  }, [courseId, sessionId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate video file type
      if (!file.type.startsWith('video/')) {
        toast.error("لطفاً یک فایل ویدیویی انتخاب کنید");
        return;
      }
      
      // Validate file size (e.g., max 500MB)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        toast.error("حجم فایل ویدیو نباید بیشتر از ۵۰۰ مگابایت باشد");
        return;
      }
      
      setVideoFile(file);
      toast.success("فایل ویدیو انتخاب شد");
    }
  };

  const handleLectureNotesSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate PDF file type
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        toast.error("لطفاً یک فایل PDF انتخاب کنید");
        return;
      }
      
      // Validate file size (e.g., max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error("حجم فایل PDF نباید بیشتر از ۵۰ مگابایت باشد");
        return;
      }
      
      setLectureNotesFile(file);
      toast.success("فایل جزوه انتخاب شد");
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const removeLectureNotes = () => {
    setLectureNotesFile(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const uploadVideoToArvanCloud = async (file: File): Promise<string> => {
    if (!course?.vod_channel_id) {
      throw new Error("VOD channel ID not found");
    }

    const size = file.size;
    const name = file.name;
    const type = file.type;

    const metadata = `filename ${btoa(unescape(encodeURIComponent(name)))},filetype ${btoa(unescape(encodeURIComponent(type)))}`;

    const fileCreateRes = await fetch(`${vodBaseUrl}/channels/${course.vod_channel_id}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Apikey ${vodApiKey}`,
        'Tus-Resumable': '1.0.0',
        'Upload-Length': String(size),
        'Upload-Metadata': metadata,
      },
    });

    if (fileCreateRes.status !== 201) {
      const text = await fileCreateRes.text();
      throw new Error(`Create upload failed: ${fileCreateRes.status} ${text}`);
    }

    const location = fileCreateRes.headers.get('Location');
    if (!location) {
      throw new Error('Missing Location header in upload creation');
    }

    const fileIdMatch = location.match(/\/files\/([^/?]+)/i);
    const fileId = fileIdMatch?.[1];
    if (!fileId) {
      throw new Error('Unable to parse file_id from upload URL');
    }

    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(file, {
        uploadUrl: location,
        headers: { 'Authorization': `Apikey ${vodApiKey}` },
        chunkSize: 1 * 1024 * 1024,
        metadata: { filename: name, filetype: type },
        onProgress: (uploaded, total) => {
          const pct = Math.floor((uploaded / total) * 100);
          setUploadProgress(pct);
        },
        onSuccess: async () => {
          try {
            const videoData = {
              title: formData.title || name,
              file_id: fileId,
              convert_mode: 'auto',
              watermark_area: 'ANIMATE_LEFT_TO_RIGHT',
            };

            const videoRes = await fetch(`${vodBaseUrl}/channels/${course.vod_channel_id}/videos`, {
              method: 'POST',
              headers: {
                'Authorization': `Apikey ${vodApiKey}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(videoData),
            });

            if (!videoRes.ok) {
              const json = await videoRes.text();
              throw new Error(`Failed to finalize video: ${videoRes.status} ${json}`);
            }

            const json = await videoRes.json();
            resolve(json.data.id || fileId);
          } catch (err) {
            reject(err);
          }
        },
        onError: (error) => {
          reject(error);
        },
      });

      upload.start();
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("عنوان جلسه الزامی است");
      return;
    }

    if (!formData.session_number) {
      toast.error("شماره جلسه الزامی است");
      return;
    }

    setLoading(true);

    try {
      // Upload video if selected
      let createdVideoFileDbId = null;
      if (videoFile) {
        setIsUploading(true);
        try {
          // Upload to Arvan and finalize (returns file_db_id)
          const arvanFileDbId = await uploadVideoToArvanCloud(videoFile);
          // If uploadVideoToArvanCloud returned the DB id already (when finalizing via backend), use it
          // Otherwise, try to call backend finalize endpoint if needed.
          if (typeof arvanFileDbId === 'object' && arvanFileDbId.file_db_id) {
            createdVideoFileDbId = arvanFileDbId.file_db_id;
          } else if (typeof arvanFileDbId === 'string' || typeof arvanFileDbId === 'number') {
            createdVideoFileDbId = arvanFileDbId;
          } else {
            // Fallback: call backend finalize if upload function returned a file_id
            try {
              const finalizeRes = await axiosInstance.post('/videos/finalize/', {
                file_id: arvanFileDbId,
                title: formData.title || videoFile.name,
                course: courseId,
                session: sessionId,
              });
              createdVideoFileDbId = finalizeRes.data?.file_db_id || finalizeRes.data?.id || null;
            } catch (err) {
              console.warn('Finalize fallback failed', err);
            }
          }

          toast.success("ویدیو با موفقیت آپلود شد");
        } catch (error) {
          console.error("Error uploading video:", error);
          toast.error("خطا در آپلود ویدیو");
          setLoading(false);
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      // Upload lecture notes if selected
      let createdNotesFileDbId = null;
      if (lectureNotesFile) {
        const lectureNotesFormData = new FormData();
        lectureNotesFormData.append('file', lectureNotesFile);
        lectureNotesFormData.append('title', lectureNotesFile.name);
        lectureNotesFormData.append('file_type', 'application/pdf');
        lectureNotesFormData.append('session', String(sessionId));
        lectureNotesFormData.append('course', String(courseId));
        lectureNotesFormData.append('content_type', 'note');
        try {
          const res = await axiosInstance.post('/files/', lectureNotesFormData);
          createdNotesFileDbId = res.data?.id || null;
          toast.success("جزوه با موفقیت آپلود شد");
        } catch (error) {
          console.error("Error uploading lecture notes:", error);
          toast.error("خطا در آپلود جزوه");
          setLoading(false);
          return;
        }
      }

      // Update session
      const updateData: any = {};
      if (formData.title.trim() !== session?.title) updateData.title = formData.title.trim();
      if (String(formData.session_number) !== String(session?.session_number)) updateData.session_number = formData.session_number;
      if (formData.description.trim() !== (session?.description || '')) updateData.description = formData.description.trim();
      // If a new video was created, attach its file DB id reference (assuming backend expects video_id)
      if (createdVideoFileDbId) updateData.video_id = createdVideoFileDbId;

      await axiosInstance.patch(`/sessions/${sessionId}/`, updateData);

      // If we replaced the video, delete the old File DB record
      if (createdVideoFileDbId && existingVideoFile && existingVideoFile.id) {
        try {
          await axiosInstance.delete(`/files/${existingVideoFile.id}/`);
        } catch (err) {
          console.warn('Failed to delete old video file record', err);
        }
      }

      // If we replaced the lecture notes, delete old one
      if (createdNotesFileDbId && existingNotesFile && existingNotesFile.id) {
        try {
          await axiosInstance.delete(`/files/${existingNotesFile.id}/`);
        } catch (err) {
          console.warn('Failed to delete old notes file record', err);
        }
      }

      toast.success("جلسه با موفقیت بروزرسانی شد");
      onSessionUpdated();
      onClose();

    } catch (error: any) {
      console.error("Error updating session:", error);
      const errorMessage = error.response?.data?.message || "خطا در بروزرسانی جلسه";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>ویرایش جلسه</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان جلسه</Label>
                <Input
                  id="title"
                  placeholder="عنوان جلسه را وارد کنید"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_number">شماره جلسه</Label>
                <Input
                  id="session_number"
                  type="number"
                  min="1"
                  placeholder="شماره جلسه را وارد کنید"
                  value={formData.session_number}
                  onChange={(e) => handleInputChange("session_number", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات جلسه</Label>
              <Textarea
                id="description"
                placeholder="توضیحات جلسه را وارد کنید"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>

            {/* Video Upload */}
            <div className="space-y-2">
              <Label>ویدیو جلسه</Label>
              {existingVideoFile ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Play className="w-4 h-4" />
                  <a href={existingVideoFile.file_url || existingVideoFile.arvan_url} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground underline">
                    ویدیو موجود — مشاهده
                  </a>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground mb-2">
                  ویدیویی برای این جلسه وجود ندارد
                </div>
              )}
              <div className="flex items-center space-x-4 space-x-reverse">
                <Input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Upload className="ml-2 h-4 w-4" />
                  انتخاب ویدیو جدید
                </Button>
                {videoFile && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{videoFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeVideo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Lecture Notes Upload */}
            <div className="space-y-2">
              <Label>جزوه جلسه</Label>
              {existingNotesFile ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <FileText className="w-4 h-4" />
                  <a href={existingNotesFile.file_url || existingNotesFile.file} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground underline">
                    جزوه موجود — مشاهده
                  </a>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground mb-2">
                  جزوه‌ای برای این جلسه وجود ندارد
                </div>
              )}
              <div className="flex items-center space-x-4 space-x-reverse">
                <Input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleLectureNotesSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => pdfInputRef.current?.click()}
                >
                  <Upload className="ml-2 h-4 w-4" />
                  انتخاب جزوه جدید
                </Button>
                {lectureNotesFile && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{lectureNotesFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeLectureNotes}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">در حال آپلود ویدیو...</span>
                  <span className="text-sm">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit" disabled={loading || isUploading}>
              <Save className="ml-2 h-4 w-4" />
              ذخیره تغییرات
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}