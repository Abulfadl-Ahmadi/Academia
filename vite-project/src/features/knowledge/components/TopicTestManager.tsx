import { useState, useEffect } from 'react';
import { Plus, Clock, FileText, Target, Users, Edit, Trash2 } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { knowledgeApi } from '../api';
import { api } from '@/lib/api';
import type { TopicTest, CreateTopicTestData, Topic } from '../types';

interface File {
  id: number;
  name: string;
  content_type: string;
}

export function TopicTestManager() {
  const [tests, setTests] = useState<TopicTest[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TopicTest | null>(null);
  const [formData, setFormData] = useState<CreateTopicTestData>({
    name: '',
    description: '',
    topic: 0,
    pdf_file: 0,
    answers_file: 0,
    duration: 'PT30M',
    is_active: true,
    keys: [],
  });

  const [answerKeys, setAnswerKeys] = useState<Array<{question_number: number, answer: number}>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [testsResponse, topicsResponse, filesResponse] = await Promise.all([
        knowledgeApi.getTopicTests(),
        knowledgeApi.getTopics(),
        api.get<File[]>('/files/?content_type=test')
      ]);
      
      setTests(testsResponse.data);
      setTopics(topicsResponse.data);
      setFiles(filesResponse.data);
    } catch (error) {
      toast.error('خطا در بارگذاری داده‌ها');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.topic || !formData.pdf_file) {
      toast.error('لطفاً مبحث و فایل PDF را انتخاب کنید');
      return;
    }

    const submitData = {
      ...formData,
      keys: answerKeys,
    };

    try {
      if (editingTest) {
        const response = await knowledgeApi.updateTopicTest(editingTest.id, submitData);
        setTests(tests.map(t => t.id === editingTest.id ? response.data : t));
        toast.success('آزمون با موفقیت ویرایش شد');
        setEditingTest(null);
      } else {
        const response = await knowledgeApi.createTopicTest(submitData);
        setTests([...tests, response.data]);
        toast.success('آزمون جدید با موفقیت ایجاد شد');
        setIsCreateOpen(false);
      }
      
      resetForm();
    } catch (error) {
      toast.error('خطا در ذخیره آزمون');
      console.error(error);
    }
  };

  const handleEdit = (test: TopicTest) => {
    setEditingTest(test);
    setFormData({
      name: test.name,
      description: test.description || '',
      topic: test.topic,
      pdf_file: 0, // TODO: باید از API دریافت شود
      answers_file: 0,
      duration: `PT${test.duration_minutes}M`,
      is_active: test.is_active,
      keys: [],
    });
    setAnswerKeys([]);
  };

  const handleDelete = async (id: number) => {
    try {
      await knowledgeApi.deleteTopicTest(id);
      setTests(tests.filter(t => t.id !== id));
      toast.success('آزمون با موفقیت حذف شد');
    } catch (error) {
      toast.error('خطا در حذف آزمون');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      topic: 0,
      pdf_file: 0,
      answers_file: 0,
      duration: 'PT30M',
      is_active: true,
      keys: [],
    });
    setAnswerKeys([]);
    setEditingTest(null);
  };

  const addAnswerKey = () => {
    setAnswerKeys([...answerKeys, { question_number: answerKeys.length + 1, answer: 1 }]);
  };

  const updateAnswerKey = (index: number, field: 'question_number' | 'answer', value: number) => {
    const newKeys = [...answerKeys];
    newKeys[index][field] = value;
    setAnswerKeys(newKeys);
  };

  const removeAnswerKey = (index: number) => {
    setAnswerKeys(answerKeys.filter((_, i) => i !== index));
  };

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'مبتدی';
      case 'intermediate': return 'متوسط';
      case 'advanced': return 'پیشرفته';
      case 'expert': return 'تخصصی';
      default: return difficulty;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} دقیقه`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours} ساعت و ${remainingMinutes} دقیقه` : `${hours} ساعت`;
    }
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
          <h2 className="text-2xl font-bold">مدیریت آزمون‌های مبحثی</h2>
          <p className="text-gray-600">آزمون‌های آزاد مرتبط با مباحث درخت دانش</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              آزمون جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ایجاد آزمون مبحثی جدید</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">نام آزمون</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="مثال: آزمون قضیه تالس - سطح 1"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="topic">مبحث</Label>
                  <Select value={formData.topic.toString()} onValueChange={(value) => setFormData({...formData, topic: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب مبحث" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id.toString()}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pdf_file">فایل PDF آزمون</Label>
                  <Select value={formData.pdf_file.toString()} onValueChange={(value) => setFormData({...formData, pdf_file: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب فایل PDF" />
                    </SelectTrigger>
                    <SelectContent>
                      {files.map((file) => (
                        <SelectItem key={file.id} value={file.id.toString()}>
                          {file.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="answers_file">فایل پاسخنامه (اختیاری)</Label>
                  <Select value={formData.answers_file?.toString() || '0'} onValueChange={(value) => setFormData({...formData, answers_file: value === '0' ? undefined : parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب فایل پاسخنامه" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">بدون پاسخنامه</SelectItem>
                      {files.map((file) => (
                        <SelectItem key={file.id} value={file.id.toString()}>
                          {file.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">مدت زمان (دقیقه)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={parseInt(formData.duration.replace('PT', '').replace('M', ''))}
                    onChange={(e) => setFormData({...formData, duration: `PT${e.target.value}M`})}
                    min="1"
                    placeholder="30"
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2 mt-6">
                  <Checkbox 
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: !!checked})}
                  />
                  <Label htmlFor="is_active">آزمون فعال</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">توضیحات</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="توضیحات آزمون..."
                  rows={3}
                />
              </div>

              {/* Answer Keys Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>کلید پاسخ‌ها</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAnswerKey}>
                    <Plus className="w-3 h-3 mr-1" />
                    اضافه کردن
                  </Button>
                </div>
                
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {answerKeys.map((key, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <Label className="text-sm">سوال</Label>
                      <Input
                        type="number"
                        value={key.question_number}
                        onChange={(e) => updateAnswerKey(index, 'question_number', parseInt(e.target.value) || 1)}
                        className="w-20"
                        min="1"
                      />
                      <Label className="text-sm">پاسخ</Label>
                      <Select 
                        value={key.answer.toString()} 
                        onValueChange={(value) => updateAnswerKey(index, 'answer', parseInt(value))}
                      >
                        <SelectTrigger className="w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAnswerKey(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  انصراف
                </Button>
                <Button type="submit">ایجاد آزمون</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <Card key={test.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={test.is_active ? "default" : "secondary"}>
                    {test.is_active ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>
              </div>
              {test.description && (
                <p className="text-sm text-gray-600 mt-2">{test.description}</p>
              )}
            </CardHeader>
            
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{test.topic_name}</span>
                {test.topic_detail && (
                  <Badge 
                    className={`text-xs ${getDifficultyBadgeColor(test.topic_detail.difficulty)}`}
                  >
                    {getDifficultyLabel(test.topic_detail.difficulty)}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(test.duration_minutes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{test.participants_count} نفر</span>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                <span>{test.total_questions} سوال</span>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(test)}
                  className="flex-1"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  ویرایش
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    if (window.confirm(`آیا مطمئن هستید که می‌خواهید "${test.name}" را حذف کنید؟`)) {
                      handleDelete(test.id);
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

      {tests.length === 0 && !loading && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ آزمونی وجود ندارد</h3>
          <p className="text-gray-600 mb-4">اولین آزمون مبحثی خود را ایجاد کنید</p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            ایجاد آزمون اول
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTest} onOpenChange={(open) => !open && setEditingTest(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ویرایش آزمون</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">نام آزمون</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-topic">مبحث</Label>
                <Select value={formData.topic.toString()} onValueChange={(value) => setFormData({...formData, topic: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id.toString()}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingTest(null)}>
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
