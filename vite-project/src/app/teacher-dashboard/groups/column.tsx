// src/app/panel/groups/columns.ts
import { type ColumnDef } from "@tanstack/react-table"

export type StudentGroup = {
  id: number
  title: string
  // teacher_name: string
  student_count: number
  // teacher_username: string // Assuming this is the username of the teacher
}

export const columns: ColumnDef<StudentGroup>[] = [
  // {
  //   accessorKey: "id",
  //   header: "ID",
  // },
  {
    accessorKey: "name",
    header: "نام کلاس ",
    cell: ({ row }) => {
      const groupId = row.original.id;
      const groupName = row.original.title;
      return groupName ? (
        <a
          href={`courses/${groupId}`}
          className="text-blue-600 underline hover:text-blue-800"
        >
          {groupName}
        </a>
      ) : (
        <span>—</span>
      );
    },
  },
  // {
  //   accessorKey: "teacher_name",
  //   header: "استاد",
  //   cell: ({ row }) => {
  //     const teacherUsername = row.original.teacher_username;
  //     const teacherName = row.original.teacher_name;
  //     return teacherName ? (
  //       <a
  //         href={`/teacher/${teacherUsername}`}
  //         className="text-blue-600 underline hover:text-blue-800"
  //       >
  //         {teacherName}
  //       </a>
  //     ) : (
  //       <span>—</span>
  //     );
  //   },
  // },
  {
    accessorKey: "student_count",
    header: "تعداد دانش‌آموزان",
  },
]
