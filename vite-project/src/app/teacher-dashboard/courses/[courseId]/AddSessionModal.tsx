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
  AlertCircle
} from "lucide-react";

interface AddSessionModalProps {
  courseId: number;
  onClose: () => void;
  onSessionAdded: () => void;
}

interface Course {
  id: number;
  title: string;
  vod_channel_id: string;
}

export default function AddSessionModal({ courseId, onClose, onSessionAdded }: AddSessionModalProps) {
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

  // Fetch course data to get vod_channel_id
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await axiosInstance.get(`/courses/${courseId}/`);
        setCourse(response.data);
      } catch (error) {
        console.error("Error fetching course:", error);
      }
    };
    fetchCourse();
  }, [courseId]);

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

  // const getNextSessionNumber = async () => {
  //   try {
  //     const response = await axiosInstance.get(`/courses/${courseId}/sessions/`);
  //     const sessions = response.data;
  //     if (sessions.length === 0) {
  //       return 1;
  //     }
  //     const maxNumber = Math.max(...sessions.map((s: any) => s.session_number));
  //     return maxNumber + 1;
  //   } catch (error) {
  //     console.error("Error getting next session number:", error);
  //     return 1;
  //   }
  // };

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
            console.log('TUS upload complete at', upload.url);
            
            // Finalize video in ArvanCloud
            const videoData = {
              title: formData.title,
              file_id: fileId,
              convert_mode: 'auto',
              watermark_area: 'ANIMATE_LEFT_TO_RIGHT'
            };
            
            try {
              const videoRes = await fetch(
                `${vodBaseUrl}/channels/${course.vod_channel_id}/videos`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Apikey ${vodApiKey}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(videoData),
                }
              );

              if (!videoRes.ok) {
                const json = await videoRes.json();
                throw new Error(`Failed to finalize video: ${videoRes.status} ${JSON.stringify(json)}`);
              }

              const json = await videoRes.json();
              console.log('Video finalized', json);
              resolve(json.data.id); // Return the video ID
            } catch (error) {
              reject(error);
            }
          },
          onError: (err) => {
            console.error('Upload TUS failed', err);
            reject(err);
          },
        });

        upload.start();
      })
      .catch(reject);
    });
  };

  const uploadPDFToParsPack = async (file: File): Promise<string> => {
    const formDataToSend = new FormData();
    formDataToSend.append('file', file);
    formDataToSend.append('title', `${formData.title}_lecture_notes`);
    formDataToSend.append('file_type', 'application/pdf');
    formDataToSend.append('content_type', 'note');
    formDataToSend.append('course', courseId.toString());

    const response = await axiosInstance.post('/files/', formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.file_id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("عنوان جلسه الزامی است");
      return;
    }
    
    if (!formData.session_number.trim()) {
      toast.error("شماره جلسه الزامی است");
      return;
    }

    if (!videoFile && !lectureNotesFile) {
      toast.error("حداقل یکی از فایل‌های ویدیو یا جزوه باید انتخاب شود");
      return;
    }

    try {
      setLoading(true);
      setIsUploading(true);
      setUploadProgress(0);

      // Create session first
      const sessionData = {
        title: formData.title,
        session_number: formData.session_number,
        description: formData.description,
        course: courseId,
      };

      const sessionResponse = await axiosInstance.post('/sessions/', sessionData);
      const sessionId = sessionResponse.data.id;

      // Upload files and create File records
      if (videoFile) {
        try {
          const videoId = await uploadVideoToArvanCloud(videoFile);
          
          // Create File record for video
          await axiosInstance.post('/files/', {
            file_id: videoId,
            file_type: 'video/mp4',
            content_type: 'note',
            title: `${formData.title}_video`,
            course: courseId,
            session: sessionId,
            arvan_url: `https://napi.arvancloud.ir/vod/2.0/videos/${videoId}`
          });
        } catch (error) {
          console.error("Error uploading video:", error);
          toast.error("خطا در آپلود ویدیو");
        }
      }

      if (lectureNotesFile) {
        try {
          const pdfId = await uploadPDFToParsPack(lectureNotesFile);
          
          // Create File record for PDF
          await axiosInstance.post('/contents/files/', {
            file_id: pdfId,
            file_type: 'application/pdf',
            content_type: 'note',
            title: `${formData.title}_lecture_notes`,
            course: courseId,
            session: sessionId,
          });
        } catch (error) {
          console.error("Error uploading PDF:", error);
          toast.error("خطا در آپلود جزوه");
        }
      }

      toast.success("جلسه با موفقیت ایجاد شد");
      onSessionAdded();
      
    } catch (error: any) {
      console.error("Error creating session:", error);
      toast.error(error.response?.data?.message || "خطا در ایجاد جلسه");
    } finally {
      setLoading(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            افزودن جلسه جدید
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان جلسه *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="عنوان جلسه را وارد کنید"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_number">شماره جلسه *</Label>
              <Input
                id="session_number"
                type="number"
                value={formData.session_number}
                onChange={(e) => handleInputChange("session_number", e.target.value)}
                placeholder="شماره جلسه"
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="توضیحات جلسه (اختیاری)"
              rows={3}
            />
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">آپلود فایل‌ها</h3>
            
            {/* Video Upload */}
            <div className="space-y-3">
              <Label>ویدیو جلسه</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {!videoFile ? (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-muted-foreground  mx-auto" />
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={loading}
                      >
                        انتخاب فایل ویدیو
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      فرمت‌های پشتیبانی شده: MP4, AVI, MOV
                      <br />
                      حداکثر حجم: ۵۰۰ مگابایت
                      <br />
                      <span className="text-blue-600">آپلود از طریق Arvan Cloud Video Platform</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">فایل ویدیو انتخاب شده</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>نام: {videoFile.name}</p>
                      <p>حجم: {formatFileSize(videoFile.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeVideo}
                      disabled={loading}
                    >
                      <X className="w-4 h-4 ml-2" />
                      حذف ویدیو
                    </Button>
                  </div>
                )}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* PDF Upload */}
            <div className="space-y-3">
              <Label>جزوه جلسه</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {!lectureNotesFile ? (
                  <div className="space-y-2">
                    <FileText className="w-8 h-8 text-muted-foreground  mx-auto" />
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => pdfInputRef.current?.click()}
                        disabled={loading}
                      >
                        انتخاب فایل PDF
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      فرمت: PDF
                      <br />
                      حداکثر حجم: ۵۰ مگابایت
                      <br />
                      <span className="text-green-600">آپلود از طریق Pars Pack</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">فایل PDF انتخاب شده</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>نام: {lectureNotesFile.name}</p>
                      <p>حجم: {formatFileSize(lectureNotesFile.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeLectureNotes}
                      disabled={loading}
                    >
                      <X className="w-4 h-4 ml-2" />
                      حذف PDF
                    </Button>
                  </div>
                )}
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleLectureNotesSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                در حال آپلود فایل‌ها...
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-muted-foreground text-center">{uploadProgress}%</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading || isUploading}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={loading || isUploading || (!videoFile && !lectureNotesFile)}
              className="min-w-[120px]"
            >
              {loading || isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  {isUploading ? "در حال آپلود..." : "در حال ایجاد..."}
                </>
              ) : (
                "ایجاد جلسه"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
