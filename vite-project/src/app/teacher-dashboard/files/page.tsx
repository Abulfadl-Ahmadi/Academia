import { useEffect, useState } from "react"
import { columns, type File } from "@/app/teacher-dashboard/files/column"
import { DataTable } from "@/components/ui/data-table"
import axiosInstance from "@/lib/axios";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerFooter,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
// import { Label } from "@/components/ui/label"

export default function FilesPage() {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  // const token = localStorage.getItem("access_token")
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [courses, setCourses] = useState<{ id: number; title: string }[]>([]);

  // Combobox form setup
  const FormSchema = z.object({
    file: z.any().nullable(),
    // file_type: z.string().nullable(),
    title: z.string().min(1, "title required"),
    course_id: z.string().nullable(),
    course_session_id: z.string().nullable(),
  });
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      file: null,
      // file_type: null,
      title: "",
      course_id: null,
      course_session_id: null,
    },
  });

useEffect(() => {
  axiosInstance
    .get(baseURL + "/courses/") // This should return a list of groups
    .then((res) => {
      const groupList = res.data.map((course: any) => ({
        id: course.id,
        title:  course.title,
      }))
      setCourses(groupList)
    })
    .catch((err) => {
      console.error("Error loading courses:", err)
    })
}, [])


  useEffect(() => {
    axiosInstance
      .get(baseURL + "/files/")
      .then((res) => {
        const data = res.data.map((file: any) => ({
          file_id: file.file_id,
          file: file.file,
          title: file.title,
          // file_type: file.file_type || "—",
          course: file.course_info.title || "",
          create_at: file.created_at || 0,
          course_session: file.class_session || 0,
        }))
        setFiles(data)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleCreateCourse = async (data: z.infer<typeof FormSchema>) => {
    setLoading(true)
    try {
      const formData = new FormData();
      if (data.file) formData.append("file", data.file);
      // if (data.file_type) formData.append("file_type", data.file_type);
      if (data.title) formData.append("title", data.title);
      if (data.course_id) formData.append("course", data.course_id);
      if (data.course_session_id) formData.append("course_session_id", data.course_session_id);
      formData.append("file_type", "application/pdf");

      const res = await axiosInstance.post("/files/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setFiles(prev => [...prev, res.data]);
      form.reset();
      console.log(res.data)
      setDrawerOpen(false);
    } catch (error) {
      console.error("Error creating file:", error.response.data);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-4">در آپلود فایل...</div>

  // Prepare cuorse options for combobox
  const courseOptions = courses.map(c => ({ label: c.title, value: c.id.toString() }));

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-4">کلاس‌های دانش‌آموزان</h2>
      <div className="md:hidden">
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <Button>ایجاد فایل</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>اپلود فایل </DrawerTitle>
            <DrawerDescription>
              گروهی جدید برای دانش آموزان ایجاد کنید.
            </DrawerDescription>
          </DrawerHeader>
          <form
            className="p-4 space-y-4"
            onSubmit={form.handleSubmit(handleCreateCourse)}
          >
            <Input
              placeholder="عنوان فایل"
              {...form.register("title")}
            />
            {/* <Select
              {...form.register("file_type")}
              defaultValue="">
            <SelectTrigger className="w-full">
                <SelectValue placeholder="انتخاب نوع فایل" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                <SelectItem value="video/mp4">ویدیو</SelectItem>
                <SelectItem value="application/pdf">PDF</SelectItem>
                </SelectGroup>
            </SelectContent>
            </Select> */}
            <Input
              placeholder="آپلود فایل"
              type="file"
              onChange={e => {
                form.setValue("file", e.target.files?.[0] ?? null)
              }}
            />
            <Input
              placeholder="شناسه جلسه کلاس (اختیاری)"
              {...form.register("course_session_id")}
            />
            <div>
              {/* <label className="block mb-1 text-sm font-medium">انتخاب استاد</label> */}
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
                    <CommandInput placeholder="Search course..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>استاد یافت نشد.</CommandEmpty>
                      <CommandGroup>
                        {courseOptions.map((course) => (
                          <CommandItem
                            value={course.label}
                            key={course.value}
                            onSelect={() => {
                            form.setValue("course_id", course.value);
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
            <DrawerFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "در حال ایجاد" : "ایجاد"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">لغو</Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
      </div>
      <div className="hidden md:block">
    <Dialog>
        <DialogTrigger asChild>
          <Button>ایجاد کلاس</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleCreateCourse)}
          >          <DialogHeader>
            <DialogTitle>ایجاد فایل جدید</DialogTitle>
            <DialogDescription>
              فایل جدیدی برای کلاس ایجاد کنید.
            </DialogDescription>
          </DialogHeader>
          {/* <div className="grid gap-4"> */}
            <div className="grid gap-3">
              {/* <Label htmlFor="name-1">نام کلاس</Label> */}
              <Input
              placeholder="عنوان فایل"
              {...form.register("title")}
            />
            {/* <select
              {...form.register("file_type")}
              className="w-full border rounded px-2 py-2 mb-2"
              defaultValue=""
            >
              <option value="" disabled>انتخاب نوع فایل</option>
              <option value="video/mp4">ویدیو (MP4)</option>
              <option value="application/pdf">PDF</option>
            </select> */}
            {/* <Select
              {...form.register("file_type")}
              defaultValue="">
            <SelectTrigger className="w-full">
                <SelectValue placeholder="انتخاب نوع فایل" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                <SelectItem value="video/mp4">ویدیو</SelectItem>
                <SelectItem value="application/pdf">PDF</SelectItem>
                </SelectGroup>
            </SelectContent>
            </Select> */}
            <Input
              placeholder="آپلود فایل"
              type="file"
              onChange={e => {
                form.setValue("file", e.target.files?.[0] ?? null)
              }}
            />
            <Input
              placeholder="شناسه جلسه کلاس (اختیاری)"
              {...form.register("course_session_id")}
            />
            <div>
              {/* <label className="block mb-1 text-sm font-medium">انتخاب استاد</label> */}
              <Popover>
                <PopoverTrigger  asChild>
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
                    <CommandInput placeholder="Search group..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>کلاس یافت نشد.</CommandEmpty>
                      <CommandGroup>
                        {courseOptions.map((course) => (
                          <CommandItem
                            value={course.label}
                            key={course.value}
                            onSelect={() => {
                            form.setValue("course_id", course.value);
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
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">لغو</Button>
            </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? "در حال ایجاد" : "ایجاد"}
              </Button>
          </DialogFooter>
      </form>
        </DialogContent>
    </Dialog>
</div>

      <DataTable columns={columns} data={files} />
    </div>
  )
}
