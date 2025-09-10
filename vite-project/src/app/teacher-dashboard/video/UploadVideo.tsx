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
            // STEP 1: Get the secure upload URL from our backend
            console.log("Initiating upload with backend...");
            const initResponse = await axiosInstance.post('/videos/init-upload/', {
                title: file.name, // Send the actual filename for metadata
                filesize: file.size,
                channel_id: selectedCourse.vod_channel_id,
                file_type: "video/mp4", // Assuming video uploads are always mp4
            });

            const { upload_url, file_id } = initResponse.data;

            if (!upload_url || !file_id) {
                throw new Error("Backend did not return a valid upload URL or File ID.");
            }    
            // const vodApiKey = "6642808d-d55c-53f7-a02c-dd3a89d366d3";


            // STEP 2: Use TUS client to upload directly to ArvanCloud
            const upload = new tus.Upload(file, {
                uploadUrl: upload_url,
                retryDelays: [0, 3000, 5000, 10000, 20000],
                // headers: { 'Authorization': `Apikey ${vodApiKey}` },

                metadata: {
                    filename: file.name,
                    filetype: file.type,
                    // filetype: "video/mp4", // Assuming video uploads are always mp4
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
                    setUploadProgress(percentage);
                },
                onSuccess: async () => {
                    console.log("Upload successful!");
                    // STEP 3: Finalize the upload with our backend
                    console.log("Finalizing upload with backend...");
                    await axiosInstance.post('/videos/finalize/', {
                        file_id: file_id,
                        title: title,
                        channel_id: selectedCourse.vod_channel_id,
                        course: parseInt(courseId),
                        session: sessionId ? parseInt(sessionId) : null,
                    });
                    
                    setSuccess(`Video "${title}" uploaded successfully!`);
                    setIsUploading(false);
                    // Reset form
                    setFile(null);
                    setTitle('');
                },
                onError: (err) => {
                    console.error("TUS Upload Error:", err);
                    setError("Upload failed. Please try again.");
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