import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";

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

export default function StudentBookListPage() {
  const [books, setBooks] = useState<OfficialBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axiosInstance.get("/official-books/")
      .then(res => setBooks(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => setError("خطا در دریافت لیست کتاب‌ها"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">کتاب‌های درسی</h1>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
