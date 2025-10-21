import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

interface OfficialBookForm {
  title: string;
  publication_year: number;
  file_url: string;
  grade: string;
  subject: string;
}

export default function TeacherBookCreatePage() {
  const [form, setForm] = useState<OfficialBookForm>({
    title: "",
    publication_year: new Date().getFullYear(),
    file_url: "",
    grade: "ten",
    subject: "mathematics",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const coverImageRef = useRef<HTMLInputElement>(null);
  const pdfFileRef = useRef<HTMLInputElement>(null);
  const handleSave = () => {
    setLoading(true);
    const data = new FormData();
    data.append("title", form.title);
    data.append("publication_year", String(form.publication_year));
    data.append("file_url", form.file_url);
    data.append("grade", form.grade);
    data.append("subject", form.subject);
    if (coverImageRef.current?.files?.[0]) {
      data.append("cover_image", coverImageRef.current.files[0]);
    }
    if (pdfFileRef.current?.files?.[0]) {
      data.append("pdf_file", pdfFileRef.current.files[0]);
    }
    axiosInstance.post("/official-books/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
      .then(() => navigate("/panel/books"))
      .catch(() => setError("ذخیره کتاب با خطا مواجه شد"))
      .finally(() => setLoading(false));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>افزودن کتاب جدید</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input name="title" value={form.title} onChange={handleChange} placeholder="عنوان کتاب" />
        <Input name="publication_year" value={form.publication_year} onChange={handleChange} placeholder="سال انتشار" type="number" />
        <div>
          <Label htmlFor="grade">پایه</Label>
          <Select value={form.grade} onValueChange={val => setForm(f => ({ ...f, grade: val }))}>
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
          <Select value={form.subject} onValueChange={val => setForm(f => ({ ...f, subject: val }))}>
            <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب درس" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mathematics">ریاضی</SelectItem>
              <SelectItem value="experimental_sciences">علوم تجربی</SelectItem>
              <SelectItem value="humanities">علوم انسانی</SelectItem>
              <SelectItem value="foreign_languages">زبان‌های خارجی</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input name="file_url" value={form.file_url} onChange={handleChange} placeholder="لینک دانلود (اختیاری)" />
        <div>
          <label className="block mb-1">عکس جلد کتاب</label>
          <input type="file" ref={coverImageRef} accept="image/*" />
        </div>
        <div>
          <label className="block mb-1">فایل PDF کتاب</label>
          <input type="file" ref={pdfFileRef} accept="application/pdf" />
        </div>
        <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} ذخیره
        </Button>
        {error && <div className="text-destructive mt-2">{error}</div>}
      </CardContent>
    </Card>
  );
}
