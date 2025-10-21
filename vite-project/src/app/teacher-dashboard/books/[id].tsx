import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Edit } from "lucide-react";

interface OfficialBook {
  id: number;
  title: string;
  publication_year: number;
  cover_image: string | null;
  pdf_file: string | null;
  file_url: string | null;
  grade: string;
  subject: string;
}

export default function TeacherBookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState<OfficialBook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    axiosInstance.get(`/official-books/${id}/`)
      .then(res => setBook(res.data))
      .catch(() => setError("خطا در دریافت اطلاعات کتاب"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="text-destructive">{error}</div>;
  if (!book) return <div className="text-muted-foreground">کتاب پیدا نشد.</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{book.title}</CardTitle>
        <CardDescription>{book.publication_year} - {book.grade} - {book.subject}</CardDescription>
      </CardHeader>
      <CardContent>
        {book.cover_image && <img src={book.cover_image} alt={book.title} className="w-full h-40 object-cover mb-2 rounded" />}
        <div className="flex gap-2 mb-4">
          {book.pdf_file ? (
            <Button asChild variant="outline" size="sm">
              <a href={book.pdf_file} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 ml-1" /> دانلود PDF
              </a>
            </Button>
          ) : book.file_url ? (
            <Button asChild variant="outline" size="sm">
              <a href={book.file_url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 ml-1" /> دانلود
              </a>
            </Button>
          ) : (
            <span className="text-muted-foreground">فایل برای دانلود موجود نیست</span>
          )}
          <Button variant="secondary" size="sm" onClick={() => navigate(`/panel/books/${book.id}/edit`)}>
            <Edit className="h-4 w-4 ml-1" /> ویرایش
          </Button>
        </div>
        {/* سایر اطلاعات کتاب */}
        <div className="space-y-2 text-sm">
          <div>سال انتشار: {book.publication_year}</div>
          <div>پایه: {book.grade}</div>
          <div>رشته: {book.subject}</div>
        </div>
      </CardContent>
    </Card>
  );
}
