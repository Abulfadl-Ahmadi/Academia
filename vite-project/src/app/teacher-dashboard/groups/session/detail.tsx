// src/pages/ClassDetailsPage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getClassById, type CStudentClass } from "@/api/classApi";
import { type Sessions } from "@/app/teacher-dashboard/groups/session/column"

import axiosInstance from "@/lib/axios";


const SessionDetailsPage: React.FC = () => {
  const { course_id } = useParams<{ id: string }>();
  const { session_id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Sessions[]>([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    {session.session_number}
  </div>;
};

export default SessionDetailsPage;
