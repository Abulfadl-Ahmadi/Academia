import { useState, useEffect } from 'react';
import { Plus, BookOpen, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { knowledgeApi } from '../api';
import type { Subject, CreateSubjectData, File } from '../types';

export function SubjectManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [bookFiles, setBookFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<CreateSubjectData>({
    name: '',
    grade: 10,
    description: '',
    book_file: undefined,
  });

  useEffect(() => {
    loadSubjects();
    loadBookFiles();
  }, []);

  const loadBookFiles = async () => {
    try {
      const response = await knowledgeApi.getBookFiles();
      setBookFiles(response.data || []);
    } catch (error) {
      console.error('خطا در بارگذاری فایل‌های کتاب:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await knowledgeApi.getSubjects();
      
      // Handle both array and pagination format
      let subjectsData = [];
      if (Array.isArray(response.data)) {
        subjectsData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        subjectsData = response.data.results;
      } else {
        console.warn("Subjects data is not an array:", response.data);
        subjectsData = [];
      }
      
      setSubjects(subjectsData);
    } catch (error) {
      toast.error('خطا در بارگذاری کتاب‌ها');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSubject) {
        const response = await knowledgeApi.updateSubject(editingSubject.id, formData);
        const updatedSubject = response.data;
        setSubjects(prevSubjects => 
          Array.isArray(prevSubjects) 
            ? prevSubjects.map(s => s.id === editingSubject.id ? updatedSubject : s)
            : []
        );
        toast.success('کتاب با موفقیت ویرایش شد');
        setEditingSubject(null);
      } else {
        const response = await knowledgeApi.createSubject(formData);
        const newSubject = response.data;
        setSubjects(prevSubjects => 
          Array.isArray(prevSubjects) 
            ? [...prevSubjects, newSubject]
            : [newSubject]
        );
        toast.success('کتاب جدید با موفقیت ایجاد شد');
        setIsCreateOpen(false);
      }
      
      setFormData({ name: '', grade: 10, description: '' });
    } catch (error) {
      toast.error('خطا در ذخیره کتاب');
      console.error(error);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      grade: subject.grade,
      description: subject.description || '',
      book_file: subject.book_file,
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await knowledgeApi.deleteSubject(id);
      setSubjects(prevSubjects => 
        Array.isArray(prevSubjects) 
          ? prevSubjects.filter(s => s.id !== id)
          : []
      );
      toast.success('کتاب با موفقیت حذف شد');
    } catch (error) {
      toast.error('خطا در حذف کتاب');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', grade: 10, description: '', book_file: undefined });
    setEditingSubject(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">مدیریت کتاب‌ها</h2>
          <p className="text-gray-600">کتاب‌های درسی و منابع آموزشی را مدیریت کنید</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              کتاب جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>ایجاد کتاب جدید</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">نام کتاب</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="مثال: هندسه و مثلثات"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="grade">پایه تحصیلی</Label>
                <Select value={formData.grade.toString()} onValueChange={(value) => setFormData({...formData, grade: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">دهم</SelectItem>
                    <SelectItem value="11">یازدهم</SelectItem>
                    <SelectItem value="12">دوازدهم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">توضیحات</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="توضیحات کوتاه درباره کتاب..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="book_file">فایل کتاب (اختیاری)</Label>
                <Select 
                  value={formData.book_file?.toString() || 'none'} 
                  onValueChange={(value) => setFormData({...formData, book_file: value === 'none' ? undefined : parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="فایل کتاب را انتخاب کنید..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون فایل</SelectItem>
                    {bookFiles.map((file) => (
                      <SelectItem key={file.id} value={file.id.toString()}>
                        {file.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  انصراف
                </Button>
                <Button type="submit">ایجاد کتاب</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(subjects) && subjects.map((subject) => (
          <Card key={subject.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                </div>
                <Badge variant="secondary">پایه {subject.grade}</Badge>
              </div>
              {subject.description && (
                <p className="text-sm text-gray-600 mt-2">{subject.description}</p>
              )}
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{subject.total_topics} مبحث</span>
                <span>{subject.chapters.length} فصل</span>
              </div>

              {subject.book_file_title && (
                <div className="mb-4 p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">فایل کتاب:</p>
                  <p className="text-sm text-blue-800">{subject.book_file_title}</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(subject)}
                  className="flex-1"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  ویرایش
                </Button>
                
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="w-3 h-3 mr-1" />
                  مشاهده
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    if (window.confirm(`آیا مطمئن هستید که می‌خواهید "${subject.name}" را حذف کنید؟`)) {
                      handleDelete(subject.id);
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingSubject} onOpenChange={(open) => !open && setEditingSubject(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ویرایش کتاب</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">نام کتاب</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-grade">پایه تحصیلی</Label>
              <Select value={formData.grade.toString()} onValueChange={(value) => setFormData({...formData, grade: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">دهم</SelectItem>
                  <SelectItem value="11">یازدهم</SelectItem>
                  <SelectItem value="12">دوازدهم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">توضیحات</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-book_file">فایل کتاب (اختیاری)</Label>
              <Select 
                value={formData.book_file?.toString() || 'none'} 
                onValueChange={(value) => setFormData({...formData, book_file: value === 'none' ? undefined : parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="فایل کتاب را انتخاب کنید..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون فایل</SelectItem>
                  {bookFiles.map((file) => (
                    <SelectItem key={file.id} value={file.id.toString()}>
                      {file.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingSubject(null)}>
                انصراف
              </Button>
              <Button type="submit">ذخیره تغییرات</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
