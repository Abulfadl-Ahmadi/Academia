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

  // Arvan Cloud Video Platform configuration
  const vodApiKey = "6642808d-d55c-53f7-a02c-dd3a89d366d3";
  const vodBaseUrl = "https://napi.arvancloud.ir/vod/2.0";

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
      if (file.type !== 'application/pdf') {
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
    return new Promise((resolve, reject) => {
      if (!course?.vod_channel_id) {
        reject(new Error("VOD channel ID not found"));
        return;
      }

      const size = file.size;
      const name = file.name;
      const type = file.type;

      // Create TUS upload
      const metadata = `filename ${btoa(unescape(encodeURIComponent(name)))},filetype ${btoa(unescape(encodeURIComponent(type)))}`;
      
      fetch(`${vodBaseUrl}/channels/${course.vod_channel_id}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Apikey ${vodApiKey}`,
          'Tus-Resumable': '1.0.0',
          'Upload-Length': String(size),
          'Upload-Metadata': metadata,
        },
      })
      .then(async (fileCreateRes) => {
        if (fileCreateRes.status !== 201) {
          const text = await fileCreateRes.text();
          throw new Error(`Create upload failed: ${fileCreateRes.status} ${text}`);
        }

        const location = fileCreateRes.headers.get('Location');
        if (!location) {
          throw new Error('Missing Location header in upload creation');
        }

        // Extract file_id from URL
        const fileIdMatch = location.match(/\/files\/([^/?]+)/i);
        const fileId = fileIdMatch?.[1];
        if (!fileId) {
          throw new Error('Unable to parse file_id from upload URL');
        }

        // Start TUS upload
        const upload = new tus.Upload(file, {
          uploadUrl: location,
          headers: { 'Authorization': `Apikey ${vodApiKey}` },
          chunkSize: 1 * 1024 * 1024, // 1MB
          metadata: {
            filename: name,
            filetype: type,
          },
          onProgress: (uploaded, total) => {
            const pct = Math.floor((uploaded / total) * 100);
            setUploadProgress(pct);
          },
          onSuccess: async () => {
            try {
              // Wait for file processing
              let processingComplete = false;
              while (!processingComplete) {
                const fileStatusRes = await fetch(`${vodBaseUrl}/channels/${course.vod_channel_id}/files/${fileId}`, {
                  headers: { 'Authorization': `Apikey ${vodApiKey}` },
                });
                const fileData = await fileStatusRes.json();
                
                if (fileData.data.status === "encoded") {
                  processingComplete = true;
                  resolve(fileData.data.id);
                } else if (fileData.data.status === "failed") {
                  throw new Error("Video processing failed");
                } else {
                  await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds before checking again
                }
              }
            } catch (error) {
              reject(error);
            }
          },
          onError: (error) => {
            reject(error);
          },
        });

        upload.start();
      })
      .catch(reject);
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
      let videoFileId = null;
      if (videoFile) {
        setIsUploading(true);
        try {
          videoFileId = await uploadVideoToArvanCloud(videoFile);
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
      let lectureNotesFormData = null;
      if (lectureNotesFile) {
        lectureNotesFormData = new FormData();
        lectureNotesFormData.append('file', lectureNotesFile);
        try {
          await axiosInstance.post('/contents/files/', lectureNotesFormData);
          toast.success("جزوه با موفقیت آپلود شد");
        } catch (error) {
          console.error("Error uploading lecture notes:", error);
          toast.error("خطا در آپلود جزوه");
          setLoading(false);
          return;
        }
      }

      // Update session
      const updateData = {
        title: formData.title.trim(),
        session_number: formData.session_number,
        description: formData.description.trim(),
        ...(videoFileId && { video_id: videoFileId }),
      };

      await axiosInstance.put(`/courses/sessions/${sessionId}/`, updateData);

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
              {session?.video_url ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Play className="w-4 h-4" />
                  <span className="text-sm text-muted-foreground">
                    ویدیو موجود است
                  </span>
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
              {session?.lecture_notes_url ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm text-muted-foreground">
                    جزوه موجود است
                  </span>
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