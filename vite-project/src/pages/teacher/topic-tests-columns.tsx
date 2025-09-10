import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, Trash2, Users, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// @ts-expect-error - moment-jalaali doesn't have proper types
import moment from 'moment-jalaali';

function convertToJalali(isoDate: string): string {
  return moment(isoDate).format('jYYYY/jMM/jDD HH:mm');
}

export type TopicTestForTable = {
  id: number;
  name: string;
  description?: string;
  topic_name: string;
  topic_detail: {
    id: number;
    name: string;
    section: string;
    chapter: string;
    subject: string;
    difficulty: string;
  };
  duration_minutes: number;
  total_questions: number;
  participants_count: number;
  is_active: boolean;
  created_at: string;
  keys?: Array<{
    question_number: number;
    answer: number;
  }>;
};

export const topicTestColumns: ColumnDef<TopicTestForTable>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="px-1">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="انتخاب همه"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="px-1">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="انتخاب سطر"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "name",
    header: () => <span className="font-iransans">نام آزمون</span>,
    cell: ({ row }) => (
      <div className="font-medium font-iransans max-w-[200px] truncate" title={row.getValue("name") as string}>
        {row.getValue("name")}
      </div>
    ),
    size: 200,
  },
  {
    accessorKey: "topic_name",
    header: () => <span className="font-iransans">مبحث</span>,
    cell: ({ row }) => (
      <div className="font-iransans max-w-[150px] truncate" title={row.getValue("topic_name") as string}>
        {row.getValue("topic_name")}
      </div>
    ),
    size: 150,
  },
  {
    accessorKey: "topic_detail",
    header: () => <span className="font-iransans">درس</span>,
    cell: ({ row }) => {
      const detail = row.getValue("topic_detail") as TopicTestForTable["topic_detail"];
      return (
        <div className="font-iransans text-sm max-w-[180px]">
          <div className="truncate" title={detail.subject}>{detail.subject}</div>
          <div className="text-muted-foreground text-xs truncate" title={`${detail.chapter} - ${detail.section}`}>
            {detail.chapter} - {detail.section}
          </div>
        </div>
      );
    },
    size: 180,
  },
  {
    accessorKey: "duration_minutes",
    header: () => <span className="font-iransans">مدت</span>,
    cell: ({ row }) => {
      const duration = row.getValue("duration_minutes") as number;
      return (
        <div className="flex items-center gap-1 font-iransans text-sm">
          <Clock className="h-3 w-3" />
          {duration}د
        </div>
      );
    },
    size: 80,
  },
  {
    accessorKey: "total_questions",
    header: () => <span className="font-iransans">سوالات</span>,
    cell: ({ row }) => {
      const total = row.getValue("total_questions") as number;
      return <div className="font-iransans text-sm text-center">{total || 60}</div>;
    },
    size: 80,
  },
  {
    accessorKey: "participants_count",
    header: () => <span className="font-iransans">شرکت‌کنندگان</span>,
    cell: ({ row }) => {
      const count = row.getValue("participants_count") as number;
      return (
        <div className="flex items-center gap-1 font-iransans text-sm">
          <Users className="h-3 w-3" />
          {count || 0}
        </div>
      );
    },
    size: 120,
  },
  {
    accessorKey: "is_active",
    header: () => <span className="font-iransans">وضعیت</span>,
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean;
      return isActive ? (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 font-iransans text-xs">
          فعال
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 font-iransans text-xs">
          غیرفعال
        </Badge>
      );
    },
    size: 80,
  },
  {
    accessorKey: "created_at",
    header: () => <span className="font-iransans">تاریخ</span>,
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string;
      const shortDate = date ? convertToJalali(date).split(' ')[0] : "—";
      return <div className="font-iransans text-xs" title={date ? convertToJalali(date) : ""}>{shortDate}</div>;
    },
    size: 100,
  },
  {
    id: "actions",
    header: () => <span className="font-iransans">عملیات</span>,
    cell: ({ row, table }) => {
      const test = row.original;
      // Get actions from table meta if available
      const meta = table.options.meta as { handleEdit?: (test: TopicTestForTable) => void; handleDelete?: (id: number) => void } | undefined;
      const handleEdit = meta?.handleEdit;
      const handleDelete = meta?.handleDelete;
      
      return (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-6 w-6 p-0">
                <span className="sr-only">منوی عملیات</span>
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>عملیات</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => window.location.href = `/tests/topic-tests/${test.id}`}
                className="flex items-center gap-2"
              >
                <Eye className="h-3 w-3" /> مشاهده
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleEdit && handleEdit(test)}
                className="flex items-center gap-2"
              >
                <Edit className="h-3 w-3" /> ویرایش
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  if (handleDelete && window.confirm(`آیا مطمئن هستید که می‌خواهید "${test.name}" را حذف کنید؟`)) {
                    handleDelete(test.id);
                  }
                }}
                className="text-red-600 flex items-center gap-2"
              >
                <Trash2 className="h-3 w-3" /> حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    size: 80,
  }
];
