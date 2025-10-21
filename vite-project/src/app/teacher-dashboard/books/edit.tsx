import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

interface OfficialBook {
  id?: number;
  title: string;
  publication_year: number;
  cover_image: string | null;
  pdf_file: string | null;
  file_url: string | null;
  grade: string;
  subject: string;
}

export default function TeacherBookEditPage() {
  const { id } = useParams();
  const [book, setBook] = useState<OfficialBook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const coverImageRef = useRef<HTMLInputElement>(null);
  const pdfFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      axiosInstance.get(`/official-books/${id}/`)
        .then(res => setBook(res.data))
        .catch(() => setError("خطا در دریافت اطلاعات کتاب"))
        .finally(() => setLoading(false));
    } else {
  setBook({ title: "", publication_year: new Date().getFullYear(), cover_image: null, pdf_file: null, file_url: "", grade: "ten", subject: "mathematics" });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!book) return;
    setBook({ ...book, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (!book) return;
    setLoading(true);
    const data = new FormData();
    data.append("title", book.title);
    data.append("publication_year", String(book.publication_year));
    data.append("file_url", book.file_url || "");
    data.append("grade", book.grade);
    data.append("subject", book.subject);
    if (coverImageRef.current?.files?.[0]) {
      data.append("cover_image", coverImageRef.current.files[0]);
    }
    if (pdfFileRef.current?.files?.[0]) {
      data.append("pdf_file", pdfFileRef.current.files[0]);
    }
    const method = id ? "put" : "post";
    const url = id ? `/official-books/${id}/` : "/official-books/";
    axiosInstance[method](url, data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
      .then(() => navigate("/panel/books"))
      .catch(() => setError("ذخیره کتاب با خطا مواجه شد"))
      .finally(() => setLoading(false));
  };

  if (loading) return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="text-destructive">{error}</div>;
  if (!book) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{id ? "ویرایش کتاب" : "افزودن کتاب جدید"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input name="title" value={book.title} onChange={handleChange} placeholder="عنوان کتاب" />
        <Input name="publication_year" value={book.publication_year} onChange={handleChange} placeholder="سال انتشار" type="number" />
        <div>
          <Label htmlFor="grade">پایه</Label>
          <Select value={book.grade} onValueChange={val => setBook(b => b ? { ...b, grade: val } : b)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب پایه" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ten">دهم</SelectItem>
              <SelectItem value="eleven">یازدهم</SelectItem>
              <SelectItem value="twelve">دوازدهم</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="subject">درس</Label>
          <Select value={book.subject} onValueChange={val => setBook(b => b ? { ...b, subject: val } : b)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب درس" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mathematics">ریاضی</SelectItem>
              <SelectItem value="experimental_sciences">علوم تجربی</SelectItem>
              <SelectItem value="humanities">علوم انسانی</SelectItem>
              <SelectItem value="foreign_languages">زبان‌های خارجی</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input name="file_url" value={book.file_url || ""} onChange={handleChange} placeholder="لینک دانلود (اختیاری)" />
        <div>
          <label className="block mb-1">عکس جلد کتاب</label>
          <input type="file" ref={coverImageRef} accept="image/*" />
        </div>
        <div>
          <label className="block mb-1">فایل PDF کتاب</label>
          <input type="file" ref={pdfFileRef} accept="application/pdf" />
        </div>
        <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
          <Save className="h-4 w-4" /> ذخیره
        </Button>
      </CardContent>
    </Card>
  );
}
