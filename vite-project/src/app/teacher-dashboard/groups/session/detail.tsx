// src/pages/ClassDetailsPage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
// import { getClassById, type CStudentClass } from "@/api/classApi";
interface Sessions {
  id: number;
  session_number: number;
}

import axiosInstance from "@/lib/axios";


const SessionDetailsPage: React.FC = () => {
  const { course_id } = useParams<{ course_id: string }>();
  const { id: session_id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Sessions[]>([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  // Add error handling in the useEffect catch block
  useEffect(() => {
    axiosInstance
      .get(baseURL + `/courses/${course_id}/sessions/${session_id}`)
      .then((res) => {
        const data = res.data.map((session: any) => ({
          id: session.id,
          session_number: session.session_number
        }))
        setSession(data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])
  const baseURL = import.meta.env.VITE_API_BASE_URL;


  useEffect(() => {
    axiosInstance
      .get(baseURL + `/courses/${course_id}/sessions/${session_id}`)
      .then((res) => {
        const data = res.data.map((session: any) => ({
          id: session.id,
          session_number: session.session_number
        }))
        setSession(data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;
  if (!session) return <div className="text-center mt-10">Session not found</div>;

  return <div>
    {session[0]?.session_number}
  </div>;
};

export default SessionDetailsPage;
