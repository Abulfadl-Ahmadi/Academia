import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { useSidebar } from '@/components/ui/sidebar';
import { FolderSelector } from '@/components/FolderSelector';
import type { CreateTopicTestData } from '@/features/knowledge/types';

// Lightweight pagination shape to safely narrow API responses without 'any'
// Removed legacy PaginatedSubjects interface (no longer needed after folder migration)

interface FileItem {
  id: number;
  title: string;
  content_type: string;
  file_type: string;
}

// Answer Key Grid Component
const AnswerKeyGrid = ({ 
  answers, 
  onAnswerChange,
  questionCount 
}: { 
  answers: string[]; 
  onAnswerChange: (index: number, value: string) => void;
  questionCount: number;
}) => {
  const { state } = useSidebar();
  
  const renderColumn = (startIndex: number) => (
    <div className="flex flex-col gap-1">
      {Array.from({ length: 10 }, (_, i) => {
        const questionIndex = startIndex + i;
        const questionNumber = questionIndex + 1;
        
        if (questionNumber > questionCount) return null;
        
        return (
          <div key={questionIndex} className="flex items-center gap-2">
            <span className="text-sm font-medium w-5 pl-2 text-left">
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

  // Dynamic grid columns based on sidebar state
  const getGridClasses = () => {
    if (state === "collapsed") {
      // Sidebar is collapsed - more space available
      return "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 ۲xl:grid-cols-7";
    } else {
      // Sidebar is expanded - less space available  
      return "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 2md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";
    }
  };

  // Calculate number of columns needed
  const columnsNeeded = Math.ceil(questionCount / 10);

  return (
    <div className={`${getGridClasses()} gap-3 sm:gap-4 lg:gap-5 xl:gap-6 p-3 sm:p-4 bg-muted/30 rounded-lg`}>
      {Array.from({ length: columnsNeeded }, (_, colIndex) => 
        renderColumn(colIndex * 10)
      )}
    </div>
  );
};

export default function CreateTopicTestPage() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  // New folders tree (infinite depth)
  const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
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
    pdf_file: 0,
    answers_file: 0,
    duration: 'PT30M',
    is_active: true,
    keys: [],
  });

  // (Legacy selection states removed – folders replace the old hierarchy)
  const [questionCount, setQuestionCount] = useState<number>(60);
  const [answerKeys, setAnswerKeys] = useState<string[]>(Array(60).fill(''));

  // Load subjects and files
  const loadInitialData = useCallback(async () => {
    try {
      setFolderLoading(true);
      const filesResponse = await axiosInstance.get('/files/?content_type=test');
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
      console.log('Filtered PDF files:', filesData.filter((f: FileItem) => f.content_type === 'test' && f.file_type === 'application/pdf'));
    } catch (error) {
      toast.error('خطا در بارگذاری داده‌ها');
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load existing test for edit mode
  useEffect(() => {
    const loadExisting = async () => {
      if (!testId) return;
      try {
        setLoading(true);
        const resp = await knowledgeApi.getTopicTests();
        interface KeyItem { question_number: number; answer: number }
        interface RespTest { id: number; name: string; description?: string; pdf_file?: number; answers_file?: number; duration?: string; duration_formatted?: string; is_active?: boolean; keys?: KeyItem[]; folders?: {id:number; name:string}[] }
        let testData: RespTest | undefined;
        if (Array.isArray(resp.data)) {
          testData = (resp.data as RespTest[]).find(t => t.id === parseInt(testId));
        } else if (resp.data && Array.isArray((resp.data as {results: RespTest[]}).results)) {
          testData = (resp.data as {results: RespTest[]}).results.find(t => t.id === parseInt(testId));
        }
        if (!testData) {
          toast.error('آزمون یافت نشد');
          return;
        }
        setEditing(true);
        // Duration normalization: server may send duration like "01:00" or seconds; we fallback to PTxxM if cannot parse
        const durationVal = testData.duration || testData.duration_formatted;
        let isoDuration = 'PT30M';
        if (typeof durationVal === 'string') {
          // Try HH:MM
            const parts = durationVal.split(':');
            if (parts.length >= 2) {
              const h = parseInt(parts[0]) || 0;
              const m = parseInt(parts[1]) || 0;
              const totalM = h * 60 + m;
              isoDuration = `PT${totalM}M`;
            }
        }
        setFormData(prev => ({
          ...prev,
          name: testData.name || '',
          description: testData.description || '',
          pdf_file: testData.pdf_file || 0,
          answers_file: testData.answers_file || 0,
          duration: isoDuration,
          is_active: testData.is_active !== false,
          keys: (testData.keys || []).map((k: KeyItem) => ({ question_number: k.question_number, answer: k.answer }))
        }));
        // Pre-fill keys if available
        if (testData.keys && Array.isArray(testData.keys)) {
          const maxQ = Math.max(60, ...testData.keys.map((k: KeyItem) => k.question_number));
          setQuestionCount(maxQ);
          const arr = Array(maxQ).fill('');
          testData.keys.forEach((k: KeyItem) => { arr[k.question_number - 1] = k.answer.toString(); });
          setAnswerKeys(arr);
        }
        // Pre-select folders
        if (testData.folders && Array.isArray(testData.folders)) {
          setSelectedFolderIds(testData.folders.map(f => f.id));
        }
      } catch (e) {
        console.error(e);
        toast.error('خطا در بارگذاری آزمون');
      } finally {
        setLoading(false);
      }
    };
    loadExisting();
  }, [testId]);

  // Legacy hierarchy code removed.

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
    if (selectedFolderIds.length === 0) {
      toast.error('حداقل یک پوشه را انتخاب کنید');
      return;
    }
    if (!formData.pdf_file || !formData.name.trim()) {
      toast.error('نام و فایل PDF الزامی است');
      return;
    }

    setSubmitting(true);
    const keysArray = answerKeys
      .map((answer, index) => ({ question_number: index + 1, answer: parseInt(answer) || 1 }))
      .filter(key => answerKeys[key.question_number - 1] !== '');

    const submitData: CreateTopicTestData = {
      ...formData,
      keys: keysArray,
      folders: selectedFolderIds,
    };

    try {
      if (editing && testId) {
        await knowledgeApi.updateTopicTest(parseInt(testId), submitData);
        toast.success('آزمون به‌روزرسانی شد');
        navigate('/panel/topic-tests');
        return;
      }
      await knowledgeApi.createTopicTest(submitData);
      toast.success('آزمون با موفقیت ایجاد شد');
      if (saveAndCreateAnother) {
  setFormData(() => ({
          name: '',
          description: '',
          pdf_file: 0,
          answers_file: 0,
          duration: 'PT30M',
          is_active: true,
          keys: [],
        }));
        setAnswerKeys(Array(questionCount).fill(''));
        setSelectedFolderIds([]);
        toast.success('فرم آماده آزمون بعدی شد');
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
    <div className="w-full mx-auto space-y-6">
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
          <h1 className="text-2xl font-bold">{editing ? 'ویرایش آزمون مبحثی' : 'ایجاد آزمون مبحثی جدید'}</h1>
        </div>
      </div>

      <form className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {editing ? 'ویرایش اطلاعات آزمون' : 'اطلاعات پایه'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="questionCount">تعداد سوالات</Label>
                <Input
                  id="questionCount"
                  type="number"
                  min="1"
                  max="100"
                  value={questionCount}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 60;
                    setQuestionCount(count);
                    setAnswerKeys(Array(count).fill(''));
                  }}
                  placeholder="60"
                />
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

        {/* Folder Selection (replaces old hierarchy) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {editing ? 'مباحث مرتبط' : 'انتخاب مباحث *'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FolderSelector
              selectedFolderIds={selectedFolderIds}
              onSelectionChange={setSelectedFolderIds}
              required={true}
            />
          </CardContent>
        </Card>

        {/* File Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{editing ? 'فایل‌های آزمون' : 'فایل‌ها'}</CardTitle>
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
                  کلیدهای پاسخ ({questionCount} سوال)
                </AccordionTrigger>
                <AccordionContent>
                  <AnswerKeyGrid 
                    answers={answerKeys} 
                    onAnswerChange={handleAnswerChange}
                    questionCount={questionCount}
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
            {editing ? 'ذخیره و ماندن' : 'ذخیره و ساخت یکی دیگر'}
          </Button>
          
          <Button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
          >
            <Save className="w-4 h-4 mr-2" />
            {editing ? 'ذخیره تغییرات' : 'ذخیره آزمون'}
          </Button>
        </div>
      </form>
    </div>
  );
}
