// src/api/classApi.ts
import axiosInstance from "@/lib/axios";

export interface CStudentClass {
  id: number;
  name: string;
  description: string;
  teacher: string;
  students_count: number;
  schedule: string;
  teacher_username: string; // Assuming this is the username of the teacher
  // add fields as needed
}

export const getClassById = async (id: string): Promise<CStudentClass> => {
  const response = await axiosInstance.get(`courses/${id}/`);
  return response.data;
};
