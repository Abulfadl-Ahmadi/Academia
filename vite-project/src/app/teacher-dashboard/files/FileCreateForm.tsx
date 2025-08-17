import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import axiosInstance from "@/lib/axios"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

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
  const baseURL = import.meta.env.VITE_API_BASE_URL
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
      .get(baseURL + "/courses/")
      .then((res) => {
        const groupList = res.data.map((course: any) => ({
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

<div>
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        className="w-full justify-between"
      >
        {form.watch("content_type")
          ? contentTypeOptions.find(opt => opt.value === form.watch("content_type"))?.label
          : "انتخاب نوع محتوا"}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-full p-0">
      <Command>
        <CommandInput placeholder="جستجو..." className="h-9" />
        <CommandList>
          <CommandEmpty>گزینه‌ای یافت نشد.</CommandEmpty>
          <CommandGroup>
            {contentTypeOptions.map((item) => (
              <CommandItem
                value={item.label}
                key={item.value}
                onSelect={() => {
                  form.setValue("content_type", item.value as "book" | "test" | "note")
                }}
              >
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</div>

      <Input
        placeholder="شناسه جلسه کلاس (اختیاری)"
        {...form.register("course_session_id")}
      />
      <div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between"
            >
              {form.watch("course_id")
                ? courseOptions.find(opt => opt.value === form.watch("course_id"))?.label
                : "انتخاب گروه"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="جستجوی گروه..." className="h-9" />
              <CommandList>
                <CommandEmpty>کلاسی یافت نشد.</CommandEmpty>
                <CommandGroup>
                  {courseOptions.map((course) => (
                    <CommandItem
                      value={course.label}
                      key={course.value}
                      onSelect={() => {
                        form.setValue("course_id", course.value)
                      }}
                    >
                      {course.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "در حال ایجاد..." : "ایجاد"}
      </Button>
    </form>
  )
}
