// src/pages/ClassDetailsPage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getClassById, type CStudentClass } from "@/api/classApi";
import ClassDetailsCard from "@/components/ClassDetailsCard";

const ClassDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [classData, setClassData] = useState<CStudentClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    getClassById(id)
      .then(setClassData)
      .catch(() => setError("Failed to load class details."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;
  if (!classData) return <div className="text-center mt-10">Class not found</div>;

  return <ClassDetailsCard studentClass={classData} />;
};

export default ClassDetailsPage;
