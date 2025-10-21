import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Plus } from "lucide-react";

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

export default function TeacherBookListPage() {
  const [books, setBooks] = useState<OfficialBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    axiosInstance.get("/official-books/")
      .then(res => setBooks(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => setError("خطا در دریافت لیست کتاب‌ها"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">کتاب‌های درسی</h1>
        <Button onClick={() => navigate("/panel/books/create")}> <Plus className="mr-2 h-4 w-4" /> افزودن کتاب جدید </Button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : error ? (
        <div className="text-destructive">{error}</div>
      ) : books.length === 0 ? (
        <div className="text-muted-foreground">کتابی ثبت نشده است.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {books.map(book => (
            <Card key={book.id}>
              <CardHeader>
                <CardTitle>{book.title}</CardTitle>
                <CardDescription>{book.publication_year} - {book.grade} - {book.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                {book.cover_image && <img src={book.cover_image} alt={book.title} className="w-full h-32 object-cover mb-2 rounded" />}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/panel/books/${book.id}`)}>
                    <ExternalLink className="h-4 w-4 ml-1" /> مشاهده جزئیات
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
