import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowRight, Upload } from 'lucide-react';

interface TicketFormData {
  title: string;
  description: string;
  category: string;
  priority: string;
  attachments?: File[];
}

export default function NewTicket() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // پیش‌فرض‌های اولیه از طریق state در صورت آمدن از صفحه AI
  const initialState = location.state || {};
  
  const [formData, setFormData] = useState<TicketFormData>({
    title: initialState.title || '',
    description: initialState.description || '',
    category: initialState.category || 'other',
    priority: initialState.aiQuestion ? 'medium' : 'medium', // اولویت متوسط برای سوالات AI
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  
  // تنظیم داده‌های پیش‌فرض وقتی state تغییر می‌کند
  useEffect(() => {
    if (location.state) {
      setFormData(prev => ({
        ...prev,
        title: location.state.title || prev.title,
        description: location.state.description || prev.description,
        category: location.state.category || prev.category,
        priority: location.state.aiQuestion ? 'medium' : prev.priority,
      }));
    }
  }, [location.state]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData to handle file uploads
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('priority', formData.priority);
      
      // Append each file
      files.forEach(file => {
        formDataToSend.append('uploaded_files', file);
      });

      const response = await axiosInstance.post('/support/tickets/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('تیکت با موفقیت ثبت شد');
      navigate(`/panel/support/${response.data.id}`);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('خطا در ثبت تیکت');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/panel/support')}>
              <ArrowRight size={16} />
            </Button>
            <div>
              <CardTitle className="text-xl">ثبت تیکت جدید</CardTitle>
              <CardDescription>مشکل یا سؤال خود را مطرح کنید</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان تیکت</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="عنوان تیکت را وارد کنید"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">دسته‌بندی</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب دسته‌بندی" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">مشکل فنی</SelectItem>
                    <SelectItem value="content">محتوا</SelectItem>
                    <SelectItem value="billing">پرداخت</SelectItem>
                    <SelectItem value="account">حساب کاربری</SelectItem>
                    <SelectItem value="other">سایر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">اولویت</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleSelectChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب اولویت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">کم</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="high">زیاد</SelectItem>
                    <SelectItem value="urgent">فوری</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="مشکل یا درخواست خود را با جزئیات شرح دهید"
                className="min-h-32"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="files">پیوست فایل (اختیاری)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="files"
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                />
                <Label htmlFor="files" className="cursor-pointer">
                  <div className="flex items-center gap-2 py-2 px-4 rounded border border-dashed border-gray-300 hover:border-gray-400">
                    <Upload size={16} />
                    <span>انتخاب فایل</span>
                  </div>
                </Label>
                {files.length > 0 && <span className="text-sm text-muted-foreground">{files.length} فایل انتخاب شده</span>}
              </div>
              {files.length > 0 && (
                <div className="mt-2">
                  <ul className="text-sm">
                    {files.map((file, index) => (
                      <li key={index} className="text-muted-foreground">{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                'ثبت تیکت'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
