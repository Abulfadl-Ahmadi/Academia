// src/components/ClassDetailsCard.tsx
import React from "react";
import { type CStudentClass } from "@/api/classApi";
import { SectionCards } from "@/components/sectionCard"; // Adjust the import path as necessary
interface Props {
  studentClass: CStudentClass;
}

const ClassDetailsCard: React.FC<Props> = ({ studentClass }) => {
  return (
    <div>
      <h2>کلاس {studentClass.name}</h2>
    <div className="@container/main flex flex-1 flex-col gap-2">

    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
    </div>
    </div>
    </div>
  );
};

export default ClassDetailsCard;
