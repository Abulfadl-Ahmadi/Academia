// Filename: UploadVideo.tsx
import React, { useState, useEffect } from 'react';
import * as tus from 'tus-js-client';
import { Progress } from "@/components/ui/progress";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios'; // Your configured axios instance

// Keep these interfaces as they are well-defined
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

const UploadVideo: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState<string>('');
    const [courseId, setCourseId] = useState<string>('');
    const [sessionId, setSessionId] = useState<string>('');
    
    const [courses, setCourses] = useState<Course[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    // State to hold the TUS upload instance
    const [tusUpload, setTusUpload] = useState<tus.Upload | null>(null);

    // Fetch courses on mount (your existing logic is good)
    useEffect(() => {
        const fetchCourses = async () => {
          try {
            const response = await axiosInstance.get('/courses/');
            
            // Handle both array and pagination format
            let coursesData = [];
            if (Array.isArray(response.data)) {
              coursesData = response.data;
            } else if (response.data && Array.isArray(response.data.results)) {
              coursesData = response.data.results;
            } else {
              console.warn("Courses data is not an array:", response.data);
              coursesData = [];
            }
            
            setCourses(coursesData);
          } catch (err) {
            setError('Failed to fetch courses.');
          }
        };
        fetchCourses();
    }, []);

    // Update sessions when courseId changes (your existing logic is good)
    useEffect(() => {
      if (!courseId) {
        setSessions([]);
        return;
      }
      const selectedCourse = courses.find((c) => String(c.id) === String(courseId));
      setSessions(selectedCourse?.sessions || []);
    }, [courseId, courses]);

    // Effect to clean up the TUS upload instance if the component unmounts
    useEffect(() => {
        return () => {
            if (tusUpload) {
                tusUpload.abort();
            }
        };
    }, [tusUpload]);

    const handleStartUpload = async () => {
        if (!file || !title || !courseId) {
            setError('Please select a file, enter a title, and choose a course.');
            return;
        }

        const selectedCourse = courses.find((c) => String(c.id) === String(courseId));
        if (!selectedCourse?.vod_channel_id) {
            setError('The selected course does not have a VOD channel configured.');
            return;
        }
        
        setError('');
        setSuccess('');
        setIsUploading(true);
        setUploadProgress(0);

        try {
            // STEP 1: Create TUS upload directly on Arvan
            const metadata = `filename ${btoa(unescape(encodeURIComponent(file.name)))},filetype ${btoa(unescape(encodeURIComponent(file.type)))}`;
            const fileCreateRes = await fetch(`${vodBaseUrl}/channels/${selectedCourse.vod_channel_id}/files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Apikey ${vodApiKey}`,
                    'Tus-Resumable': '1.0.0',
                    'Upload-Length': String(file.size),
                    'Upload-Metadata': metadata,
                },
            });

            if (fileCreateRes.status !== 201) {
                const text = await fileCreateRes.text();
                throw new Error(`Create upload failed: ${fileCreateRes.status} ${text}`);
            }

            const location = fileCreateRes.headers.get('Location');
            if (!location) throw new Error('Missing Location header in upload creation');

            const fileId = location.match(/\/files\/([^/?]+)/i)?.[1];

            // STEP 2: Upload using tus-js-client directly to Arvan
            const upload = new tus.Upload(file, {
                uploadUrl: location,
                retryDelays: [0, 3000, 5000, 10000, 20000],
                headers: { 'Authorization': `Apikey ${vodApiKey}` },

                metadata: {
                    filename: file.name,
                    filetype: file.type,
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
                    setUploadProgress(percentage);
                },
                onSuccess: async () => {
                    console.log('Upload successful!');

                    // Finalize on Arvan
                    const videoData = {
                        title: title,
                        file_id: fileId,
                        convert_mode: 'auto',
                    };

                    const videoRes = await fetch(`${vodBaseUrl}/channels/${selectedCourse.vod_channel_id}/videos`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Apikey ${vodApiKey}`,
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(videoData),
                    });

                    const json = await videoRes.json();
                    // attach file_id and call backend finalize to persist metadata in our DB
                    formData.append('file_id', json.data?.id || fileId);
                    await fetch(baseURL + '/videos/finalize/', {
                        method: 'POST',
                        body: formData,
                        credentials: 'include',
                    });

                    setSuccess(`Video "${title}" uploaded successfully!`);
                    setIsUploading(false);
                    setFile(null);
                    setTitle('');
                },
                onError: (err) => {
                    console.error('TUS Upload Error:', err);
                    setError('Upload failed. Please try again.');
                    setIsUploading(false);
                },
            });

            upload.start();
            setTusUpload(upload);

        } catch (err: any) {
            console.error("Upload process error:", err);
            setError(err.response?.data?.error || "An error occurred while starting the upload.");
            setIsUploading(false);
        }
    };

    const handlePauseResume = () => {
        if (!tusUpload) return;
        if (isUploading) {
            tusUpload.abort(); // This pauses the upload
            setIsUploading(false);
        } else {
            tusUpload.start(); // This resumes the upload
            setIsUploading(true);
        }
    };

    return (
        <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md space-y-4">
            <h1 className="text-2xl font-bold text-center">Secure Video Upload</h1>

            <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                disabled={isUploading}
            />
            
            <Input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={isUploading}
            />
            
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={isUploading} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                <option value="">Select a Course</option>
                {courses.map((course) => ( <option key={course.id} value={course.id}>{course.title}</option> ))}
            </select>
            
            <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} disabled={isUploading || !sessions.length} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                <option value="">Select a Session (Optional)</option>
                {sessions.map((session) => ( <option key={session.id} value={session.id}>{`Session ${session.session_number}`}</option> ))}
            </select>

            {tusUpload && (
                <div className="flex items-center gap-4">
                    <Button onClick={handlePauseResume} variant="outline">
                        {isUploading ? "Pause" : "Resume"}
                    </Button>
                    <Progress value={uploadProgress} className="w-full" />
                    <span>{uploadProgress}%</span>
                </div>
            )}

            {!tusUpload && (
                 <Button onClick={handleStartUpload} disabled={isUploading || !file || !title || !courseId}>
                    {isUploading ? 'Uploading...' : 'Upload Video'}
                </Button>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}
        </div>
    );
};

export default UploadVideo;