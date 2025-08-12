import { type ColumnDef } from "@tanstack/react-table"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Session = {
  id: number
  session_number: number
  course: number
}

export const columns: ColumnDef<Session>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "session_number",
    header: "شماره جلسه",
  },
  {
    accessorKey: "course",
    header: "کلاس",
  },
]