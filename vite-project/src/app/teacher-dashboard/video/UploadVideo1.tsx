// Filename: UploadVideo.tsx
import React, { useState, useEffect } from 'react';
import * as tus from 'tus-js-client';
import { Progress } from "@/components/ui/progress"
import { Input } from '@/components/ui/input';
import axiosInstance from '@/lib/axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;


interface Session {
  id: number;
  session_number: number;
  course: number;
}

interface Course {
  id: number;
  title: string;
  vod_channel_id: string;
  sessions: Session[];
}

// interface UploadResponse {
//   file_id: string;
//   file_url: string;
//   video_data?: any;
// }

const UploadVideo: React.FC = () => {

  // const channelId = "86515078-d523-4927-8233-2b6b3b022986";
  const vodApiKey = "6642808d-d55c-53f7-a02c-dd3a89d366d3";
  const vodBaseUrl = "https://napi.arvancloud.ir/vod/2.0";

  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);


  // const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('');
  // const [fileType, setFileType] = useState<string>('video/mp4');
  const [fileType] = useState<string>('video/mp4');
  const [channelId, setChannelId] = useState<string>('');
  const [courseId, setCourseId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  // const [loading, setLoading] = useState<boolean>(false);
  const [, setError] = useState<string>('');
  // const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axiosInstance.get('courses/');
        const data = await response.data;
        setCourses(data);
      } catch (err) {
        setError('Failed to fetch courses.');
      }
    };
    fetchCourses();
  }, []);

  // Update sessions and channelId when courseId changes
  useEffect(() => {
    if (!courseId) {
      setSessions([]);
      setChannelId('');
      return;
    }
    const selectedCourse = courses.find((c) => String(c.id) === String(courseId));
    if (selectedCourse) {
      setSessions(selectedCourse.sessions || []);
      setChannelId(selectedCourse.vod_channel_id || '');
    } else {
      setSessions([]);
      setChannelId('');
    }
  }, [courseId, courses]);

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const onUploadClick = async () => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('filename', file.name);
    formData.append('file_size', file.size.toString());
    formData.append('file_type', fileType);
    formData.append('file', file);
    formData.append('course', courseId);
    if (sessionId) formData.append('session', sessionId);
    // Add channel_id only for video uploads
    if (fileType === 'video/mp4' && channelId) {
      formData.append('channel_id', channelId);
    }

    try {
      const size = file.size;
      const name = file.name;
      const type = file.type;

      // 1️⃣ ایجاد فایل TUS
      const metadata = `filename ${btoa(unescape(encodeURIComponent(name)))},filetype ${btoa(unescape(encodeURIComponent(type)))}`;
      const fileCreateRes = await fetch(
        `${vodBaseUrl}/channels/${channelId}/files`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Apikey ${vodApiKey}`,
            'Tus-Resumable': '1.0.0',
            'Upload-Length': String(size),
            'Upload-Metadata': metadata,
          },
        }
      );

      if (fileCreateRes.status !== 201) {
        const text = await fileCreateRes.text();
        throw new Error(`Create upload failed: ${fileCreateRes.status} ${text}`);
      }

      const location = fileCreateRes.headers.get('Location');
      if (!location) {
        throw new Error('Missing Location header in upload creation');
      }

      // استخراج file_id از URL
      const fileIdMatch = location.match(/\/files\/([^/?]+)/i);
      const fileId = fileIdMatch?.[1];
      if (!fileId) {
        throw new Error('Unable to parse file_id from upload URL');
      }


      // 2️⃣ شروع آپلود TUS
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
          setProgress(pct);
        },
        onSuccess: async () => {
          console.log('TUS upload complete at', upload.url);
          // 3️⃣ نهایی‌سازی ویدیو در ArvanCloud
          const videoData = {
            title: title,
            file_id: fileId,
            convert_mode: 'auto',
            // watermark_id: '1d16d576-61fb-482f-a3a6-2b44fbc788b3',
            watermark_area: 'ANIMATE_LEFT_TO_RIGHT'
          };
          const videoRes = await fetch(
            `${vodBaseUrl}/channels/${channelId}/videos`,
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



          const json = await videoRes.json();
          formData.append('file_id', json.data.id);
          const response = await fetch(baseURL + '/videos/finalize/', {
            method: 'POST',
            body: formData,
            credentials: 'include', // Include cookies for JWT authentication
          });

          await response.json();


          if (!videoRes.ok) {
            throw new Error(
              `Failed to finalize video: ${videoRes.status} ${JSON.stringify(json)}`
            );
          }
          console.log('Video finalized', json);
          setUploading(false);
        },
        onError: (err) => {
          console.error('Upload TFT failed', err);
          setUploading(false);
        },
      });

      upload.start();
    } catch (error: any) {
      console.error('Upload failed', error);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 w-[60%]">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter file title"
      />
      <Input type="file" accept="video/*" onChange={onFileSelected} />

      <div>
        <label className="block text-sm font-medium text-muted-foreground">Course</label>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground">Session (Optional)</label>
        <select
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a session (optional)</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {`جلسه ${session.session_number}`}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={onUploadClick}
        disabled={uploading || !file}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {uploading ? `Uploading ${progress}%…` : 'Upload Video'}
      </button>
      {progress ? <Progress value={progress} className=" w-[60%]" /> : null}

    </div>
  );
};

export default UploadVideo;
