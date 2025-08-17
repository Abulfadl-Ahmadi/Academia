import React, { useState, useEffect } from 'react';
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

interface UploadResponse {
  file_id: string;
  file_url: string;
  video_data?: any;
}

const VideoUploadForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('');
  const [fileType, setFileType] = useState<string>('video/mp4');
  const [channelId, setChannelId] = useState<string>('');
  const [courseId, setCourseId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Fetch courses on mount
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileType(selectedFile.type === 'application/pdf' ? 'application/pdf' : 'video/mp4');
    }
  };

  const handleSubmit = async () => {
    if (!file || !title || !courseId) {
      setError('Please fill in all required fields and select a file.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('filename', file.name);
    formData.append('file_size', file.size.toString());
    formData.append('file_type', 'video/mp4');
    formData.append('file', file);
    formData.append('course', courseId);
    if (sessionId) formData.append('session', sessionId);
    // Add channel_id only for video uploads
    if (fileType === 'video/mp4' && channelId) {
      formData.append('channel_id', channelId);
    }

    const endpoint = fileType === 'video/mp4' ? baseURL + '/videos/upload/' : baseURL + '/files/';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for JWT authentication
      });

      const data: UploadResponse = await response.json();

      if (response.ok) {
        setSuccess(`File uploaded successfully! URL: ${data.file_url}`);
        setFile(null);
        setTitle('');
        setCourseId('');
        setSessionId('');
        setChannelId('your-channel-id');
      } else {
        setError('Failed to upload file.');
      }
    } catch (err) {
      setError('An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-center">Upload File</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">File Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter file title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">File</label>
          <input
            type="file"
            accept="video/mp4,application/pdf"
            onChange={handleFileChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Course</label>
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
          <label className="block text-sm font-medium text-gray-700">Session (Optional)</label>
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
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          {loading ? 'Uploading...' : 'Upload File'}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}
      </div>
    </div>
  );
};

export default VideoUploadForm;