import { useState, useEffect } from 'react';
import { Plus, Target, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as RadioGroup from "@radix-ui/react-radio-group";
import { toast } from 'sonner';
import { knowledgeApi } from '@/features/knowledge/api';
import { DataTable } from '@/components/ui/data-table-with-selection';
import { topicTestColumns, type TopicTestForTable } from './topic-tests-columns';
import { api } from '@/lib/api';
import type { TopicTest, CreateTopicTestData, Topic, Subject } from '@/features/knowledge/types';

interface File {
  id: number;
  name: string;
  content_type: string;
}

// Answer Key Grid Component
const AnswerKeyGrid = ({ 
  answers, 
  onAnswerChange 
}: { 
  answers: string[]; 
  onAnswerChange: (index: number, value: string) => void 
}) => {
  const renderColumn = (startIndex: number) => (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 10 }, (_, i) => {
        const questionIndex = startIndex + i;
        const questionNumber = questionIndex + 1;
        
        return (
          <div key={questionIndex} className="flex items-center gap-3">
            <span className="text-sm font-medium w-6 text-right">
              {questionNumber}
            </span>
            <RadioGroup.Root
              value={answers[questionIndex] || ""}
              onValueChange={(value) => onAnswerChange(questionIndex, value)}
              className="flex gap-1"
            >
              {['1', '2', '3', '4'].map((option) => (
                <RadioGroup.Item
                  key={option}
                  value={option}
                  className={`
                    w-8 h-8 rounded border-2 flex items-center justify-center text-sm font-medium
                    transition-colors duration-200 cursor-pointer
                    ${answers[questionIndex] === option
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary/50'
                    }
                  `}
                >
                  {option}
                </RadioGroup.Item>
              ))}
            </RadioGroup.Root>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-muted/30 rounded-lg">
      {Array.from({ length: 6 }, (_, colIndex) => renderColumn(colIndex * 10))}
    </div>
  );
};

export function TopicTestManager() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TopicTestForTable[]>([]);
  const [allTests, setAllTests] = useState<TopicTestForTable[]>([]); // کل آزمون‌ها برای فیلتر
  const [topics, setTopics] = useState<Topic[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTest, setEditingTest] = useState<TopicTestForTable | null>(null);
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

  // Filter states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number>(0);
  const [selectedChapter, setSelectedChapter] = useState<number>(0);
  const [selectedSection, setSelectedSection] = useState<number>(0);
  const [selectedTopic, setSelectedTopic] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  const [answerKeys, setAnswerKeys] = useState<string[]>(Array(60).fill(''));

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answerKeys];
    newAnswers[index] = value;
    setAnswerKeys(newAnswers);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [testsResponse, topicsResponse, filesResponse, subjectsResponse] = await Promise.all([
        knowledgeApi.getTopicTests(),
        knowledgeApi.getTopics(),
        api.get<File[]>('/files/?content_type=test'),
        knowledgeApi.getKnowledgeTree() // درخت دانش کامل
      ]);
      
      const testsData = testsResponse.data;
      setTests(testsData);
      setAllTests(testsData); // ذخیره کل آزمون‌ها برای فیلتر
      setTopics(topicsResponse.data);
      setFiles(filesResponse.data);
      setSubjects(subjectsResponse.data);
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

    if (!editingTest) {
      toast.error('هیچ آزمونی برای ویرایش انتخاب نشده');
      return;
    }

    // Convert answer keys to the format expected by backend
    const keysArray = answerKeys
      .map((answer, index) => ({
        question_number: index + 1,
        answer: parseInt(answer) || 1
      }))
      .filter(key => answerKeys[key.question_number - 1] !== '');

    const submitData = {
      ...formData,
      keys: keysArray,
    };

    try {
      const response = await knowledgeApi.updateTopicTest(editingTest.id, submitData);
      setTests(tests.map(t => t.id === editingTest.id ? response.data : t));
      toast.success('آزمون با موفقیت ویرایش شد');
      setEditingTest(null);
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
    
    // Load existing answer keys if available
    const existingAnswers = Array(60).fill('');
    if (test.keys) {
      test.keys.forEach(key => {
        if (key.question_number <= 60) {
          existingAnswers[key.question_number - 1] = key.answer.toString();
        }
      });
    }
    setAnswerKeys(existingAnswers);
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
    setAnswerKeys(Array(60).fill(''));
    setEditingTest(null);
  };

  // Filter functions
  const getAvailableChapters = () => {
    if (!selectedSubject) return [];
    const subject = subjects.find(s => s.id === selectedSubject);
    return subject ? subject.chapters : [];
  };

  const getAvailableSections = () => {
    if (!selectedChapter) return [];
    const subject = subjects.find(s => s.id === selectedSubject);
    const chapter = subject?.chapters.find(c => c.id === selectedChapter);
    return chapter ? chapter.sections : [];
  };

  const getAvailableTopics = () => {
    if (!selectedSection) return [];
    const subject = subjects.find(s => s.id === selectedSubject);
    const chapter = subject?.chapters.find(c => c.id === selectedChapter);
    const section = chapter?.sections.find(s => s.id === selectedSection);
    return section ? section.topics : [];
  };

  const handleSubjectChange = (subjectId: number) => {
    setSelectedSubject(subjectId);
    setSelectedChapter(0);
    setSelectedSection(0);
    setSelectedTopic(0);
    applyFilters(subjectId, 0, 0, 0);
  };

  const handleChapterChange = (chapterId: number) => {
    setSelectedChapter(chapterId);
    setSelectedSection(0);
    setSelectedTopic(0);
    applyFilters(selectedSubject, chapterId, 0, 0);
  };

  const handleSectionChange = (sectionId: number) => {
    setSelectedSection(sectionId);
    setSelectedTopic(0);
    applyFilters(selectedSubject, selectedChapter, sectionId, 0);
  };

  const handleTopicChange = (topicId: number) => {
    setSelectedTopic(topicId);
    applyFilters(selectedSubject, selectedChapter, selectedSection, topicId);
  };

  const applyFilters = (subjectId: number, chapterId: number, sectionId: number, topicId: number) => {
    let filteredTests = [...allTests];

    if (topicId) {
      // فیلتر بر اساس مبحث خاص
      filteredTests = filteredTests.filter(test => test.topic_detail.id === topicId);
    } else if (sectionId) {
      // فیلتر بر اساس بخش - باید مباحث این بخش را پیدا کنیم
      const subject = subjects.find(s => s.id === subjectId);
      const chapter = subject?.chapters.find(c => c.id === chapterId);
      const section = chapter?.sections.find(s => s.id === sectionId);
      const topicIds = section?.topics.map(t => t.id) || [];
      filteredTests = filteredTests.filter(test => topicIds.includes(test.topic_detail.id));
    } else if (chapterId) {
      // فیلتر بر اساس فصل - باید مباحث تمام بخش‌های این فصل را پیدا کنیم
      const subject = subjects.find(s => s.id === subjectId);
      const chapter = subject?.chapters.find(c => c.id === chapterId);
      const topicIds = chapter?.sections.flatMap(s => s.topics.map(t => t.id)) || [];
      filteredTests = filteredTests.filter(test => topicIds.includes(test.topic_detail.id));
    } else if (subjectId) {
      // فیلتر بر اساس کتاب - باید مباحث تمام فصل‌ها و بخش‌های این کتاب را پیدا کنیم
      const subject = subjects.find(s => s.id === subjectId);
      const topicIds = subject?.chapters.flatMap(c => 
        c.sections.flatMap(s => s.topics.map(t => t.id))
      ) || [];
      filteredTests = filteredTests.filter(test => topicIds.includes(test.topic_detail.id));
    }

    setTests(filteredTests);
  };

  const resetFilters = () => {
    setSelectedSubject(0);
    setSelectedChapter(0);
    setSelectedSection(0);
    setSelectedTopic(0);
    setTests(allTests);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:justify-between lg:items-center min-w-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold truncate">مدیریت آزمون‌های مبحثی</h2>
          <p className="text-sm sm:text-base text-muted-foreground truncate">آزمون‌های آزاد مرتبط با مباحث درخت دانش</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2"
            size="sm"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">فیلترها</span>
            <span className="sm:hidden">فیلتر</span>
          </Button>
          
          <Button onClick={() => navigate('/panel/topic-tests/create')} className="flex items-center justify-center gap-2" size="sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">آزمون جدید</span>
            <span className="sm:hidden">جدید</span>
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      {showFilters && (
        <Card className="w-full min-w-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="w-4 h-4" />
              فیلتر بر اساس درخت دانش
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
              {/* Subject Selection */}
              <div className="space-y-2">
                <Label>کتاب درسی</Label>
                <Select 
                  value={selectedSubject.toString()} 
                  onValueChange={(value) => handleSubjectChange(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="همه کتاب‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">همه کتاب‌ها</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name} - پایه {subject.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chapter Selection */}
              <div className="space-y-2">
                <Label>فصل</Label>
                <Select 
                  value={selectedChapter.toString()} 
                  onValueChange={(value) => handleChapterChange(parseInt(value))}
                  disabled={!selectedSubject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="همه فصل‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">همه فصل‌ها</SelectItem>
                    {getAvailableChapters().map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.id.toString()}>
                        {chapter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Section Selection */}
              <div className="space-y-2">
                <Label>بخش</Label>
                <Select 
                  value={selectedSection.toString()} 
                  onValueChange={(value) => handleSectionChange(parseInt(value))}
                  disabled={!selectedChapter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="همه بخش‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">همه بخش‌ها</SelectItem>
                    {getAvailableSections().map((section) => (
                      <SelectItem key={section.id} value={section.id.toString()}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Topic Selection */}
              <div className="space-y-2">
                <Label>مبحث</Label>
                <Select 
                  value={selectedTopic.toString()} 
                  onValueChange={(value) => handleTopicChange(parseInt(value))}
                  disabled={!selectedSection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="همه مباحث" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">همه مباحث</SelectItem>
                    {getAvailableTopics().map((topic) => (
                      <SelectItem key={topic.id} value={topic.id.toString()}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={resetFilters}>
                <RotateCcw className="w-4 h-4 mr-2" />
                پاک کردن فیلترها
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <div className="space-y-4 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground gap-2 min-w-0">
          <span className="truncate">
            {tests.length === allTests.length 
              ? `نمایش ${tests.length} آزمون` 
              : `نمایش ${tests.length} از ${allTests.length} آزمون`
            }
          </span>
          {tests.length !== allTests.length && (
            <span className="text-primary whitespace-nowrap">فیلتر فعال</span>
          )}
        </div>
        
        <div className="w-full min-w-0">
          <DataTable 
            columns={topicTestColumns} 
            data={tests}
            searchPlaceholder="جستجو در آزمون‌ها..."
            meta={{
              handleEdit,
              handleDelete
            }}
          />
        </div>
      </div>

      {tests.length === 0 && !loading && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          {allTests.length === 0 ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ آزمونی وجود ندارد</h3>
              <p className="text-gray-600 mb-4">اولین آزمون مبحثی خود را ایجاد کنید</p>
              <Button onClick={() => navigate('/panel/topic-tests/create')}>
                <Plus className="w-4 h-4 mr-2" />
                ایجاد آزمون اول
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ آزمونی با این فیلتر یافت نشد</h3>
              <p className="text-gray-600 mb-4">لطفاً فیلترهای مختلفی را امتحان کنید</p>
              <Button variant="outline" onClick={resetFilters}>
                <RotateCcw className="w-4 h-4 mr-2" />
                پاک کردن فیلترها
              </Button>
            </>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTest} onOpenChange={(open) => !open && setEditingTest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ویرایش آزمون</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-pdf">فایل PDF</Label>
                <Select value={formData.pdf_file.toString()} onValueChange={(value) => setFormData({...formData, pdf_file: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب فایل..." />
                  </SelectTrigger>
                  <SelectContent>
                    {files.filter(f => f.content_type.includes('pdf')).map((file) => (
                      <SelectItem key={file.id} value={file.id.toString()}>
                        {file.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-duration">مدت زمان</Label>
                <Select value={formData.duration} onValueChange={(value) => setFormData({...formData, duration: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PT15M">15 دقیقه</SelectItem>
                    <SelectItem value="PT30M">30 دقیقه</SelectItem>
                    <SelectItem value="PT45M">45 دقیقه</SelectItem>
                    <SelectItem value="PT60M">60 دقیقه</SelectItem>
                    <SelectItem value="PT90M">90 دقیقه</SelectItem>
                    <SelectItem value="PT120M">120 دقیقه</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-total-score">نمره کل</Label>
                <Input
                  id="edit-total-score"
                  type="number"
                  value={formData.total_score}
                  onChange={(e) => setFormData({...formData, total_score: parseFloat(e.target.value)})}
                  min="0"
                  step="0.1"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">توضیحات</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="توضیحات آزمون..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: !!checked})}
              />
              <Label htmlFor="edit-is-active">فعال</Label>
            </div>

            {/* Answer Keys Section */}
            <div className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="answer-keys">
                  <AccordionTrigger className="text-base font-medium">
                    کلیدهای پاسخ (60 سوال)
                  </AccordionTrigger>
                  <AccordionContent>
                    <AnswerKeyGrid 
                      answers={answerKeys} 
                      onAnswerChange={handleAnswerChange} 
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
