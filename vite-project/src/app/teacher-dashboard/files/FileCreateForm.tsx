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
}

export default function FileCreateForm({ onSuccess, onClose }: FileFormProps) {
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
      if (data.course_session_id) formData.append("course_session_id", data.course_session_id)
      formData.append("file_type", "application/pdf")
      formData.append("content_type", data.content_type)


      const res = await axiosInstance.post("/files/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      onSuccess(res.data)
      form.reset()
      if (onClose) onClose()
    } catch (error: any) {
      console.error("Error creating file:", error?.response?.data)
    } finally {
      toast.success("فایل با موفقیت ایجاد شد.")
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
        placeholder="آپلود فایل"
        type="file"
        onChange={e => {
          form.setValue("file", e.target.files?.[0] ?? null)
        }}
      />

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
        {loading ? "در حال ایجاد..." : "ایجاد"}
      </Button>
    </form>
  )
}
