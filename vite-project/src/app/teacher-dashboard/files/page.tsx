import { useEffect, useState } from "react";
import { columns, type File } from "@/app/teacher-dashboard/files/column";
import { DataTable } from "@/components/ui/data-table";
import axiosInstance from "@/lib/axios";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { Button } from "@/components/ui/button";
// import { useForm } from "react-hook-form"
// import { z } from "zod"
// import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label"
import FileCreateForm from "./FileCreateForm";

export default function FilesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // const token = localStorage.getItem("access_token")
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [, setCourses] = useState<{ id: number; title: string }[]>([]);

  // Combobox form setup
  // const FormSchema = z.object({
  //   file: z.any().nullable(),
  //   // file_type: z.string().nullable(),
  //   title: z.string().min(1, "title required"),
  //   course_id: z.string().nullable(),
  //   course_session_id: z.string().nullable(),
  // });
  // const form = useForm<z.infer<typeof FormSchema>>({
  //   resolver: zodResolver(FormSchema),
  //   defaultValues: {
  //     file: null,
  //     // file_type: null,
  //     title: "",
  //     course_id: null,
  //     course_session_id: null,
  //   },
  // });

  useEffect(() => {
    axiosInstance
      .get(baseURL + "/courses/") // This should return a list of groups
      .then((res) => {
        const groupList = res.data.map((course: any) => ({
          id: course.id,
          title: course.title,
        }));
        setCourses(groupList);
      })
      .catch((err) => {
        console.error("Error loading courses:", err);
      });
  }, []);

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
        }));
        setFiles(data);
      })
      .finally(() => setLoading(false));
  }, []);

  // const handleCreateCourse = async (data: z.infer<typeof FormSchema>) => {
  //   setLoading(true)
  //   try {
  //     const formData = new FormData();
  //     if (data.file) formData.append("file", data.file);
  //     // if (data.file_type) formData.append("file_type", data.file_type);
  //     if (data.title) formData.append("title", data.title);
  //     if (data.course_id) formData.append("course", data.course_id);
  //     if (data.course_session_id) formData.append("course_session_id", data.course_session_id);
  //     formData.append("file_type", "application/pdf");

  //     const res = await axiosInstance.post("/files/", formData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //       },
  //     });
  //     setFiles(prev => [...prev, res.data]);
  //     form.reset();
  //     console.log(res.data)
  //     setDrawerOpen(false);
  //   } catch (error) {
  //     console.error("Error creating file:", error.response.data);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  if (loading) return <div className="p-4">در آپلود فایل...</div>;

  // Prepare cuorse options for combobox
  // const courseOptions = courses.map(c => ({ label: c.title, value: c.id.toString() }));

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
            <div className="p-4">
              <FileCreateForm
                onSuccess={(newFile) => setFiles((prev) => [...prev, newFile])}
                onClose={() => setDrawerOpen(false)}
                context="drawer"
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
      <div className="hidden md:block">
        <Dialog>
          <DialogTrigger asChild>
            <Button>ایجاد فایل</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogTitle>فرم ایجاد فایل</DialogTitle>
            <FileCreateForm
              onSuccess={(newFile) => setFiles((prev) => [...prev, newFile])}
              onClose={() => {}}
              context="dialog"
            />
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={files} />
    </div>
  );
}
