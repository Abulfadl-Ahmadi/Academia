// src/app/panel/groups/columns.ts
import { type ColumnDef } from "@tanstack/react-table"

// import { toJalaali } from 'jalaali-js'

// function convertToJalali(isoDate: string): string {
//   const date = new Date(isoDate)
//   const j = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate())
//   return `${j.jy}/${j.jm.toString().padStart(2, '0')}/${j.jd.toString().padStart(2, '0')}`
// }
// @ts-ignore
import moment from 'moment-jalaali'

function convertToJalali(isoDate: string): string {
  return moment(isoDate).format('jYYYY/jMM/jDD HH:mm')
}


export type Test = {
  test_id: number
  name: string
  description: string
  teacher: number
  pdf_file: string
  start_time: string
  end_time: string
  duration: string
  frequency: string
}

export const columns: ColumnDef<Test>[] = [
  // {
  //   accessorKey: "id",
  //   header: "ID",
  // },
  {
    accessorKey: "name",
    header: "نام آزمون",
    cell: ({ row }) => {
      const testName = row.original.name;
      return testName ? (
        <div>
          {testName}
        </div>
      ) : (
        <span>—</span>
      );
    },
  },
  {
    accessorKey: "start_time",
    header: "تاریخ شروع آزمون",
    cell: ({ row }) => {
      const startTime = row.original.start_time;
      return startTime ? (
        <p>
          {convertToJalali(startTime)}
        </p>
      ) : (
        <span>—</span>
      );
    },
  },
  {
    accessorKey: "duration",
    header: "مدت زمان آزمون",
    cell: ({ row }) => {
      const duration = row.original.duration;
      return duration ? (
        <p>
          {duration}
        </p>
      ) : (
        <span>—</span>
      );
    },
  },
]
