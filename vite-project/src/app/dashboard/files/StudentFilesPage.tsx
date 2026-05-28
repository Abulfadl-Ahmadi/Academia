import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileText } from "lucide-react";

type StudentFile = {
  id: number;
  name: string;
  title?: string;
  file_type: string;
  file_size: number;
  download_url: string | null;
  course_name: string | null;
  session_name?: string | null;
  created_at: string;
};

function formatFileSize(bytes: number) {
  if (!bytes || Number.isNaN(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDate(dateString: string) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function StudentFilesPage() {
  const [files, setFiles] = useState<StudentFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/courses/student/downloadable-files/");
        const normalizedFiles = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.results)
            ? response.data.results
            : [];

        setFiles(normalizedFiles);
      } catch (error) {
        console.error("Error fetching student files:", error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const handleDownload = (file: StudentFile) => {
    if (!file.download_url) return;
    const link = document.createElement("a");
    link.href = file.download_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = file.name || "file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-4">در حال بارگذاری فایل‌ها...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            فایل‌های قابل دسترس
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              هنوز فایلی برای شما فعال نشده است.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">عنوان</TableHead>
                    <TableHead className="text-right">کلاس</TableHead>
                    <TableHead className="text-right">نوع</TableHead>
                    <TableHead className="text-right">حجم</TableHead>
                    <TableHead className="text-right">تاریخ</TableHead>
                    <TableHead className="text-right">دانلود</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody dir="rtl">
                  {files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">{file.title || file.name}</TableCell>
                      <TableCell>{file.course_name || file.session_name || "—"}</TableCell>
                      <TableCell>{file.file_type || "—"}</TableCell>
                      <TableCell>{formatFileSize(file.file_size)}</TableCell>
                      <TableCell>{formatDate(file.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(file)}
                          disabled={!file.download_url}
                        >
                          <Download className="ml-2 h-4 w-4" />
                          دانلود
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}