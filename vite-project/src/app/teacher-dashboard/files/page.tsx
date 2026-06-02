import { useEffect, useMemo, useState } from "react";
import { columns, type File } from "@/app/teacher-dashboard/files/column";
import { DataTable } from "@/components/ui/data-table-with-selection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/lib/axios";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, Search } from "lucide-react";
type CourseSummary = {
  id: number;
  title: string;
};

type FileApiItem = {
  id?: number;
  file_id?: string;
  file?: string;
  title?: string;
  file_type?: string;
  content_type?: string;
  course?: number | null;
  session?: number | null;
  course_info?: {
    title?: string;
  };
  created_at?: string;
  class_session?: string;
};

export default function FilesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  // const token = localStorage.getItem("access_token")
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
      .get("/courses/") // This should return a list of groups
      .then((res) => {
        const groupList = (Array.isArray(res.data) ? res.data : []).map((course: CourseSummary) => ({
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
      .get("/files/")
      .then((res) => {
        // Handle both array and pagination format
        let filesData: FileApiItem[] = [];
        if (Array.isArray(res.data)) {
          filesData = res.data;
        } else if (res.data && Array.isArray(res.data.results)) {
          filesData = res.data.results;
        } else {
          console.warn("Files data is not an array:", res.data);
          filesData = [];
        }
        
        const data = filesData.map((file) => ({
          id: file.id ?? 0,
          file_id: file.file_id || "",
          file: file.file || "",
          title: file.title || "",
          file_type: file.file_type || "",
          content_type: file.content_type || "",
          // file_type: file.file_type || "—",
          st_group: file.course_info?.title || "",
          create_at: file.created_at || "",
          class_session: file.class_session || (file.session != null ? String(file.session) : ""),
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

  const classOptions = useMemo(() => {
    const uniqueClasses = Array.from(new Set(files.map((file) => file.st_group).filter(Boolean)));
    return uniqueClasses.sort((a, b) => a.localeCompare(b, "fa"));
  }, [files]);

  const filteredFiles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = files.filter((file) => {
      const matchesSearch =
        !normalizedQuery ||
        [file.title, file.file, file.st_group, file.class_session]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));

      const matchesClass =
        selectedClass === "all" || file.st_group === selectedClass;

      return matchesSearch && matchesClass;
    });

    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.create_at || 0).getTime();
      const dateB = new Date(b.create_at || 0).getTime();
      return sortOrder === "oldest" ? dateA - dateB : dateB - dateA;
    });
  }, [files, searchQuery, selectedClass, sortOrder]);

  const handleEdit = (file: File) => {
    setEditingFile(file);
    setEditDrawerOpen(true);
  };

  const handleDelete = async (fileId: number) => {
    try {
      await axiosInstance.delete(`/files/${fileId}/`);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const totalFiles = files.length;
  const visibleFiles = filteredFiles.length;

  if (loading) return <div className="p-4">در آپلود فایل...</div>;

  // Prepare cuorse options for combobox
  // const courseOptions = courses.map(c => ({ label: c.title, value: c.id.toString() }));

  const cleanupOverlays = () => {
    const openOverlays = document.querySelectorAll(
      '[data-slot="dialog-overlay"][data-state="open"], [data-slot="drawer-overlay"][data-state="open"]'
    );
    if (openOverlays.length > 0) return;

    document
      .querySelectorAll('[data-slot="dialog-overlay"], [data-slot="drawer-overlay"]')
      .forEach((el) => el.remove());
    document.body.style.pointerEvents = "";
    document.body.style.overflow = "";
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">جزوه‌ها و فایل‌ها</h2>
          <p className="text-sm text-muted-foreground">
            مدیریت فایل‌های آموزشی، جستجو و مرتب‌سازی سریع
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">کل فایل‌ها: {totalFiles}</Badge>
          <Badge variant="outline">نمایش فعلی: {visibleFiles}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            فیلتر و جستجو
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium">جستجو</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="نام فایل، کلاس یا جلسه را جستجو کنید"
                  className="pr-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">کلاس</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="همه کلاس‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه کلاس‌ها</SelectItem>
                  {classOptions.map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">مرتب‌سازی</label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="جدیدترین اول" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">جدیدترین اول</SelectItem>
                  <SelectItem value="oldest">قدیمی‌ترین اول</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedClass("all");
                setSortOrder("newest");
              }}
            >
              پاک کردن فیلترها
            </Button>
          </div>
        </CardContent>
      </Card>

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

      {typeof window !== "undefined" && (
        <ResponsiveEditFileForm
          open={editDrawerOpen}
          file={editingFile}
          onOpenChange={(open) => {
            setEditDrawerOpen(open);
            if (!open) {
              window.setTimeout(cleanupOverlays, 250);
            }
          }}
          onClosed={() => setEditingFile(null)}
          onSuccess={(updatedFile) => {
            setFiles((prev) =>
              prev.map((f) => (f.id === updatedFile.id ? updatedFile : f))
            );
            setEditDrawerOpen(false);
            setEditingFile(null);
          }}
        />
      )}

      <DataTable 
        columns={columns} 
        data={files}
        meta={{
          handleEdit,
          handleDelete
        }}
      />
    </div>
  );
}

function ResponsiveEditFileForm({
  open,
  file,
  onOpenChange,
  onClosed,
  onSuccess,
}: {
  open: boolean;
  file: File | null;
  onOpenChange: (open: boolean) => void;
  onClosed: () => void;
  onSuccess: (updatedFile: File) => void;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = () => setIsMobile(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (open || !file) return;

    const closeTimer = window.setTimeout(() => {
      onClosed();
    }, 250);

    return () => window.clearTimeout(closeTimer);
  }, [open, file, onClosed]);

  if (!file) return null;

  const form = (
    <FileCreateForm
      mode="edit"
      initialFile={file}
      onSuccess={onSuccess}
      onClose={() => onOpenChange(false)}
      context={isMobile ? "drawer" : "dialog"}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>ویرایش فایل</DrawerTitle>
            <DrawerDescription>{file.title}</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">{form}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle>ویرایش فایل</DialogTitle>
        {form}
      </DialogContent>
    </Dialog>
  );
}
