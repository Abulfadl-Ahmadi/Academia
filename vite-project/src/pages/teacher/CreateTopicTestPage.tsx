import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Save, Plus, BookOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as RadioGroup from "@radix-ui/react-radio-group";
import { toast } from 'sonner';
import { knowledgeApi } from '@/features/knowledge/api';
import axiosInstance from '@/lib/axios';
import type { CreateTopicTestData, Subject } from '@/features/knowledge/types';

interface FileItem {
  id: number;
  title: string;
  content_type: string;
  file_type: string;
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
    <div className="grid grid-cols-6 gap-6 p-4 bg-muted/30 rounded-lg">
      {Array.from({ length: 6 }, (_, colIndex) => renderColumn(colIndex * 10))}
    </div>
  );
};

export default function CreateTopicTestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  
  // States for hierarchical selection
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // File upload states
  const [selectedPdfFile, setSelectedPdfFile] = useState<globalThis.File | null>(null);
  const [selectedAnswersFile, setSelectedAnswersFile] = useState<globalThis.File | null>(null);
  const [uploadingPdfFile, setUploadingPdfFile] = useState(false);
  const [uploadingAnswersFile, setUploadingAnswersFile] = useState(false);

  // Form data
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

  // Selection states
  const [selectedSubject, setSelectedSubject] = useState<number>(0);
  const [selectedChapter, setSelectedChapter] = useState<number>(0);
  const [selectedSection, setSelectedSection] = useState<number>(0);
  const [answerKeys, setAnswerKeys] = useState<string[]>(Array(60).fill(''));

  // Load subjects and files
  const loadInitialData = useCallback(async () => {
    try {
      const [subjectsResponse, filesResponse] = await Promise.all([
        knowledgeApi.getKnowledgeTree(), // This gives us the full hierarchical structure
        axiosInstance.get('/files/?content_type=test')
      ]);
      
      // Handle both array and pagination format for subjects
      let subjectsData = [];
      if (Array.isArray(subjectsResponse.data)) {
        subjectsData = subjectsResponse.data;
      } else if (subjectsResponse.data && Array.isArray(subjectsResponse.data.results)) {
        subjectsData = subjectsResponse.data.results;
      } else {
        console.warn("Subjects data is not an array:", subjectsResponse.data);
        subjectsData = [];
      }
      
      setSubjects(subjectsData);
      
      // Handle both array and pagination format for files
      let filesData = [];
      if (Array.isArray(filesResponse.data)) {
        filesData = filesResponse.data;
      } else if (filesResponse.data && Array.isArray(filesResponse.data.results)) {
        filesData = filesResponse.data.results;
      } else {
        console.warn("Files data is not an array:", filesResponse.data);
        filesData = [];
      }
      
      setFiles(filesData);
      
      console.log('Loaded files:', filesData);
      console.log('Filtered PDF files:', filesData.filter(f => f.content_type === 'test' && f.file_type === 'application/pdf'));

      // Check if there's a pre-selected topic from URL params
      const topicId = searchParams.get('topic');
      if (topicId) {
        await loadTopicHierarchy(parseInt(topicId), subjectsData);
      }
    } catch (error) {
      toast.error('خطا در بارگذاری داده‌ها');
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load the full hierarchy for a specific topic
  const loadTopicHierarchy = async (topicId: number, allSubjects: Subject[]) => {
    try {
      // Find the subject that contains this topic
      let foundHierarchy: { subjectId: number, chapterId: number, sectionId: number } | null = null;
      
      for (const subject of allSubjects) {
        for (const chapter of subject.chapters) {
          for (const section of chapter.sections) {
            if (section.topics.some(t => t.id === topicId)) {
              foundHierarchy = {
                subjectId: subject.id,
                chapterId: chapter.id,
                sectionId: section.id
              };
              break;
            }
          }
          if (foundHierarchy) break;
        }
        if (foundHierarchy) break;
      }

      if (foundHierarchy) {
        setSelectedSubject(foundHierarchy.subjectId);
        setSelectedChapter(foundHierarchy.chapterId);
        setSelectedSection(foundHierarchy.sectionId);
        setFormData(prev => ({ ...prev, topic: topicId }));
      }
    } catch (error) {
      console.error('Error loading topic hierarchy:', error);
    }
  };

  // Get filtered chapters for selected subject
  const getAvailableChapters = () => {
    if (!selectedSubject) return [];
    const subject = subjects.find(s => s.id === selectedSubject);
    return subject ? subject.chapters : [];
  };

  // Get filtered sections for selected chapter
  const getAvailableSections = () => {
    if (!selectedChapter) return [];
    const subject = subjects.find(s => s.id === selectedSubject);
    const chapter = subject?.chapters.find(c => c.id === selectedChapter);
    return chapter ? chapter.sections : [];
  };

  // Get filtered topics for selected section
  const getAvailableTopics = () => {
    if (!selectedSection) return [];
    const subject = subjects.find(s => s.id === selectedSubject);
    const chapter = subject?.chapters.find(c => c.id === selectedChapter);
    const section = chapter?.sections.find(s => s.id === selectedSection);
    return section ? section.topics : [];
  };

  // Handle selection changes
  const handleSubjectChange = (subjectId: number) => {
    setSelectedSubject(subjectId);
    setSelectedChapter(0);
    setSelectedSection(0);
    setFormData(prev => ({ ...prev, topic: 0 }));
  };

  const handleChapterChange = (chapterId: number) => {
    setSelectedChapter(chapterId);
    setSelectedSection(0);
    setFormData(prev => ({ ...prev, topic: 0 }));
  };

  const handleSectionChange = (sectionId: number) => {
    setSelectedSection(sectionId);
    setFormData(prev => ({ ...prev, topic: 0 }));
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answerKeys];
    newAnswers[index] = value;
    setAnswerKeys(newAnswers);
  };

  // File upload function
  const handleFileUpload = async (file: globalThis.File, setUploading: React.Dispatch<React.SetStateAction<boolean>>): Promise<number | null> => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('description', '');
    formData.append('content_type', 'test');
    formData.append('file_type', 'application/pdf');
    
    try {
      setUploading(true);
      const response = await axiosInstance.post(`${baseURL}/files/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update files list
      setFiles(prevFiles => [...prevFiles, { 
        id: response.data.id, 
        title: response.data.title || file.name, 
        content_type: 'test',
        file_type: 'application/pdf'
      }]);
      
      return response.data.id;
    } catch (error) {
      console.error(`Error uploading file:`, error);
      toast.error(`خطا در آپلود فایل ${file.name}`);
      return null;
    } finally {
      setUploading(false);
    }
  };
  
  const handlePdfFileUpload = async () => {
    if (!selectedPdfFile) {
      toast.error("لطفا ابتدا یک فایل انتخاب کنید");
      return;
    }
    
    const fileId = await handleFileUpload(selectedPdfFile, setUploadingPdfFile);
    if (fileId) {
      setFormData({ ...formData, pdf_file: fileId });
      setSelectedPdfFile(null);
      toast.success(`فایل PDF با موفقیت آپلود شد`);
    }
  };
  
  const handleAnswersFileUpload = async () => {
    if (!selectedAnswersFile) {
      toast.error("لطفا ابتدا یک فایل انتخاب کنید");
      return;
    }
    
    const fileId = await handleFileUpload(selectedAnswersFile, setUploadingAnswersFile);
    if (fileId) {
      setFormData({ ...formData, answers_file: fileId });
      setSelectedAnswersFile(null);
      toast.success(`فایل پاسخنامه با موفقیت آپلود شد`);
    }
  };

  const handleSubmit = async (saveAndCreateAnother: boolean = false) => {
    if (!formData.topic || !formData.pdf_file || !formData.name.trim()) {
      toast.error('لطفاً تمام فیلدهای ضروری را پر کنید');
      return;
    }

    setSubmitting(true);

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
      await knowledgeApi.createTopicTest(submitData);
      toast.success('آزمون با موفقیت ایجاد شد');
      
      if (saveAndCreateAnother) {
        // Reset form but keep topic selection
        setFormData(prev => ({
          name: '',
          description: '',
          topic: prev.topic, // Keep the selected topic
          pdf_file: 0,
          answers_file: 0,
          duration: 'PT30M',
          is_active: true,
          keys: [],
        }));
        setAnswerKeys(Array(60).fill(''));
        toast.success('فرم برای ایجاد آزمون بعدی آماده است');
      } else {
        navigate('/panel/topic-tests');
      }
    } catch (error) {
      toast.error('خطا در ایجاد آزمون');
      console.error(error);
    } finally {
      setSubmitting(false);
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/panel/topic-tests')}
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت
        </Button>
        <div>
          <h1 className="text-2xl font-bold">ایجاد آزمون مبحثی جدید</h1>
          <p className="text-gray-600">آزمون جدید مرتبط با مباحث درخت دانش ایجاد کنید</p>
        </div>
      </div>

      <form className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              اطلاعات پایه
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">نام آزمون *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: آزمون قضیه تالس - سطح 1"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">مدت زمان</Label>
                <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="توضیحات آزمون..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
              />
              <Label htmlFor="is-active">فعال</Label>
            </div>
          </CardContent>
        </Card>

        {/* Topic Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              انتخاب مبحث *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Subject Selection */}
              <div className="space-y-2">
                <Label>کتاب درسی</Label>
                <Select 
                  value={selectedSubject.toString()} 
                  onValueChange={(value) => {
                    const subjectId = parseInt(value);
                    handleSubjectChange(subjectId);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب کتاب" />
                  </SelectTrigger>
                  <SelectContent>
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
                  onValueChange={(value) => {
                    const chapterId = parseInt(value);
                    handleChapterChange(chapterId);
                  }}
                  disabled={!selectedSubject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب فصل" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableChapters().map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.id.toString()}>
                        {chapter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Section Selection */}
              <div className="space-y-2">
                <Label>بخش</Label>
                <Select 
                  value={selectedSection.toString()} 
                  onValueChange={(value) => {
                    const sectionId = parseInt(value);
                    handleSectionChange(sectionId);
                  }}
                  disabled={!selectedChapter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب بخش" />
                  </SelectTrigger>
                  <SelectContent>
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
                  value={formData.topic.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, topic: parseInt(value) })}
                  disabled={!selectedSection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب مبحث" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTopics().map((topic) => (
                      <SelectItem key={topic.id} value={topic.id.toString()}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Selection */}
        <Card>
          <CardHeader>
            <CardTitle>فایل‌ها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* PDF File Section */}
            <div className="space-y-4">
              <Label className="text-base font-medium">فایل PDF آزمون *</Label>
              
              <Tabs defaultValue="select" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="select">انتخاب از فایل‌های موجود</TabsTrigger>
                  <TabsTrigger value="upload">آپلود فایل جدید</TabsTrigger>
                </TabsList>
                
                <TabsContent value="select" className="space-y-2">
                  <Select 
                    value={formData.pdf_file.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, pdf_file: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب فایل..." />
                    </SelectTrigger>
                    <SelectContent>
                      {files.filter(f => f.content_type === 'test' && f.file_type === 'application/pdf').map((file) => (
                        <SelectItem key={file.id} value={file.id.toString()}>
                          {file.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>
                
                <TabsContent value="upload" className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="upload-pdf-file"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setSelectedPdfFile(e.target.files?.[0] || null)}
                        className="flex-1 pr-28 rtl"
                      />
                      <label htmlFor="upload-pdf-file" className="absolute top-0 right-0">
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm"
                          className="h-full rounded-l-none border-l"
                        >
                          انتخاب فایل
                        </Button>
                      </label>
                    </div>
                  </div>
                  
                  {selectedPdfFile && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground flex-1 truncate">
                        {selectedPdfFile.name}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handlePdfFileUpload()}
                        disabled={uploadingPdfFile}
                      >
                        {uploadingPdfFile ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current ml-2"></div>
                            در حال آپلود...
                          </>
                        ) : (
                          <>آپلود فایل</>
                        )}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Answer File Section */}
            <div className="space-y-4">
              <Label className="text-base font-medium">فایل پاسخنامه (اختیاری)</Label>
              
              <Tabs defaultValue="select" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="select">انتخاب از فایل‌های موجود</TabsTrigger>
                  <TabsTrigger value="upload">آپلود فایل جدید</TabsTrigger>
                </TabsList>
                
                <TabsContent value="select" className="space-y-2">
                  <Select 
                    value={formData.answers_file?.toString() || "0"} 
                    onValueChange={(value) => setFormData({ ...formData, answers_file: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب فایل..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">بدون فایل</SelectItem>
                      {files.filter(f => f.content_type === 'test').map((file) => (
                        <SelectItem key={file.id} value={file.id.toString()}>
                          {file.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>
                
                <TabsContent value="upload" className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="upload-answers-file"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setSelectedAnswersFile(e.target.files?.[0] || null)}
                        className="flex-1 pr-28 rtl"
                      />
                      <label htmlFor="upload-answers-file" className="absolute top-0 right-0">
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm"
                          className="h-full rounded-l-none border-l"
                        >
                          انتخاب فایل
                        </Button>
                      </label>
                    </div>
                  </div>
                  
                  {selectedAnswersFile && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground flex-1 truncate">
                        {selectedAnswersFile.name}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAnswersFileUpload()}
                        disabled={uploadingAnswersFile}
                      >
                        {uploadingAnswersFile ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current ml-2"></div>
                            در حال آپلود...
                          </>
                        ) : (
                          <>آپلود فایل</>
                        )}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Answer Keys */}
        <Card>
          <CardHeader>
            <CardTitle>کلیدهای پاسخ</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/panel/topic-tests')}
          >
            انصراف
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
          >
            <Plus className="w-4 h-4 mr-2" />
            ذخیره و ساخت یکی دیگر
          </Button>
          
          <Button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
          >
            <Save className="w-4 h-4 mr-2" />
            ذخیره آزمون
          </Button>
        </div>
      </form>
    </div>
  );
}
