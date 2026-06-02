import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import axiosInstance from "@/lib/axios"
import { toast } from "sonner"

type FileRecord = {
  id: number
  title?: string
  file?: string
  file_id?: string
  file_type?: string
  content_type?: "book" | "test" | "note"
  course?: number | null
  session?: number | null
}

export const FormSchema = z.object({
  file: z.any().nullable(),
  title: z.string().min(1, "title required"),
  course_id: z.string().nullable(),
  course_session_id: z.string().nullable(),
  content_type: z.enum(["book", "test", "note"] as const, {
    message: "content_type must be one of: book, test, note",
  }),
})

type FileFormProps = {
  onSuccess: (newFile: any) => void
  onClose?: () => void
  context?: "dialog" | "drawer"
  mode?: "create" | "edit"
  initialFile?: FileRecord | null
}

export default function FileCreateForm({ onSuccess, onClose, mode = "create", initialFile }: FileFormProps) {
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<{ id: number; title: string }[]>([])
  
  const contentTypeOptions = [
  { label: "کتاب", value: "book" },
  { label: "آزمون", value: "test" },
  { label: "جزوه", value: "note" },
]

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      file: null,
      title: "",
      course_id: null,
      content_type: "book" as const,
      course_session_id: null,
    },
  })

  useEffect(() => {
    form.reset({
      file: null,
      title: initialFile?.title ?? "",
      course_id: initialFile?.course != null ? String(initialFile.course) : null,
      content_type: initialFile?.content_type ?? "book",
      course_session_id: initialFile?.session != null ? String(initialFile.session) : null,
    })
  }, [form, initialFile])

  useEffect(() => {
    axiosInstance
      .get("/courses/")
      .then((res) => {
        const courseList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.results)
            ? res.data.results
            : []

        const groupList = courseList.map((course: any) => ({
          id: course.id,
          title: course.title,
        }))
        setCourses(groupList)
      })
      .catch((err) => {
        console.error("Error loading courses:", err)
      })
  }, [])

  const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
    setLoading(true)
    try {
      const formData = new FormData()
      if (data.file) formData.append("file", data.file)
      if (data.title) formData.append("title", data.title)
      if (data.course_id) formData.append("course", data.course_id)
      if (data.course_session_id) formData.append("session", data.course_session_id)
      formData.append("file_type", "application/pdf")
      formData.append("content_type", data.content_type)

      const request = mode === "edit" && initialFile?.id
        ? axiosInstance.patch(`/files/${initialFile.id}/`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
        : axiosInstance.post("/files/", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })

      const res = await request

      onSuccess(res.data)
      form.reset({
        file: null,
        title: "",
        course_id: null,
        content_type: "book",
        course_session_id: null,
      })
      if (onClose) onClose()
      toast.success(mode === "edit" ? "فایل با موفقیت ویرایش شد." : "فایل با موفقیت ایجاد شد.")
    } catch (error: any) {
      console.error("Error creating file:", error?.response?.data)
      toast.error(mode === "edit" ? "خطا در ویرایش فایل" : "خطا در ایجاد فایل")
    } finally {
      setLoading(false)
    }
  }

  const courseOptions = courses.map(c => ({ label: c.title, value: c.id.toString() }))

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <Input placeholder="عنوان فایل" {...form.register("title")} />
      <Input
        placeholder={mode === "edit" ? "آپلود فایل جدید (اختیاری)" : "آپلود فایل"}
        type="file"
        onChange={e => {
          form.setValue("file", e.target.files?.[0] ?? null)
        }}
      />

      {mode === "edit" && initialFile?.file && (
        <p className="text-xs text-muted-foreground break-all">
          فایل فعلی: {initialFile.file}
        </p>
      )}

      <Select
        value={form.watch("content_type")}
        onValueChange={(value) => {
          form.setValue("content_type", value as "book" | "test" | "note", {
            shouldDirty: true,
            shouldTouch: true,
          })
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="انتخاب نوع محتوا" />
        </SelectTrigger>
        <SelectContent>
          {contentTypeOptions.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="شناسه جلسه کلاس (اختیاری)"
        {...form.register("course_session_id")}
      />
      <div>
        <Select
          value={form.watch("course_id") ?? undefined}
          onValueChange={(value) => {
            form.setValue("course_id", value, {
              shouldDirty: true,
              shouldTouch: true,
            })
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="انتخاب گروه" />
          </SelectTrigger>
          <SelectContent>
            {courseOptions.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">کلاسی یافت نشد.</div>
            ) : (
              courseOptions.map((course) => (
                <SelectItem key={course.value} value={course.value}>
                  {course.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (mode === "edit" ? "در حال ویرایش..." : "در حال ایجاد...") : (mode === "edit" ? "ویرایش" : "ایجاد")}
      </Button>
    </form>
  )
}
