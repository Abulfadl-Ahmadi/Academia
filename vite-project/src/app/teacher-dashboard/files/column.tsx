// src/app/panel/groups/columns.ts
import { type ColumnDef } from "@tanstack/react-table"

// import { toJalaali } from 'jalaali-js'

// function convertToJalali(isoDate: string): string {
//   const date = new Date(isoDate)
//   const j = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate())
//   return `${j.jy}/${j.jm.toString().padStart(2, '0')}/${j.jd.toString().padStart(2, '0')}`
// }

import moment from 'moment-jalaali'

function convertToJalali(isoDate: string): string {
  return moment(isoDate).format('jYYYY/jMM/jDD HH:mm')
}


export type File = {
  file_id: string
  title: string
  file: string
  // file_type: string
  st_group: number
  create_at: string // Assuming this is the username of the teacher
  class_session: string // Assuming this is the username of the teacher
}

export const columns: ColumnDef<File>[] = [
  // {
  //   accessorKey: "id",
  //   header: "ID",
  // },
  {
    accessorKey: "name",
    header: "نام فایل",
    cell: ({ row }) => {
      const file = row.original.file;
      const fileName = row.original.title;
      return fileName ? (
        <a
          href={`${file}`}
          className="text-blue-600 underline hover:text-blue-800"
        >
          {fileName}
        </a>
      ) : (
        <span>—</span>
      );
    },
  },
  {
    accessorKey: "create_at",
    header: "تاریخ آپلود",
    cell: ({ row }) => {
      const createAt = row.original.create_at;
      return createAt ? (
        <p>
          {convertToJalali(createAt)}
        </p>
      ) : (
        <span>—</span>
      );
    },
  },
  {
    accessorKey: "st_group",
    header: "کلاس",
  },
]
