import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Save, Plus, BookOpen, FileText, Search, X, FilterX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axios';
import { DateTimePicker } from "@/components/ui/date-picker";
import { Button } from '@/components/ui/button';
import { FolderSelector } from '@/components/FolderSelector';
import { QuestionCard } from '@/components/QuestionCard';

interface Question {
  id: number;
  public_id: string;
  question_text: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  folders: number[];
  folders_names: string[];
  options: Array<{
    id: number;
    option_text: string;
    order: number;
  }>;
  correct_option?: number;
  detailed_solution?: string;
  images?: Array<{
    id: number;
    image: string;
    alt_text?: string;
    order: number;
  }>;
  detailed_solution_images?: Array<{
    id: number;
    image: string;
    alt_text?: string;
    order: number;
  }>;
  created_at: string;
  updated_at: string;
  publish_date: string;
  source: string;
  is_active: boolean;
}

interface CreateQuestionTestData {
  name: string;
  description?: string;
  folders?: number[];
  questions: number[];
  duration: string;
  start_time?: string;
  end_time?: string;
  frequency?: string;
  is_active: boolean;
  content_type: string;
  test_collection?: number;
}

interface Folder {
  id: number;
  name: string;
  parent: number | null;
  description?: string;
  order: number;
  created_at: string;
  updated_at: string;
}

interface TestCollection {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CreateQuestionTestPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Form data
  const [formData, setFormData] = useState<CreateQuestionTestData>({
    name: '',
    description: '',
    folders: [],
    questions: [],
    duration: 'PT30M',
    start_time: '',
    end_time: '',
    frequency: 'once',
    is_active: true,
    content_type: 'typed_question',
    test_collection: undefined,
  });

  // DateTime states for scheduling
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTimeStr, setStartTimeStr] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTimeStr, setEndTimeStr] = useState("");
  const [durationHour, setDurationHour] = useState("");
  const [durationMinute, setDurationMinute] = useState("");

  const [selectedFolders, setSelectedFolders] = useState<number[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [folderFilter, setFolderFilter] = useState<number | null>(null);
  const [availableFolders, setAvailableFolders] = useState<Folder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [availableCollections, setAvailableCollections] = useState<TestCollection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  // Load available questions
  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (difficultyFilter !== 'all') params.append('difficulty_level', difficultyFilter);
      if (folderFilter) params.append('folders', folderFilter.toString());

      const response = await axiosInstance.get(`/questions/?${params.toString()}`);

      // Handle both paginated and non-paginated responses
      let questionsData: Question[] = [];
      if (Array.isArray(response.data)) {
        questionsData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        questionsData = response.data.results;
      } else {
        console.warn("Questions data is not an array:", response.data);
        questionsData = [];
      }

      setAvailableQuestions(questionsData);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('خطا در بارگذاری سوالات');
      setAvailableQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, difficultyFilter, folderFilter]);

  // Load available folders
  useEffect(() => {
    const loadFolders = async () => {
      try {
        setFoldersLoading(true);
        const response = await axiosInstance.get('/knowledge/folders/');
        console.log('Folders API response:', response);
        console.log('Folders data:', response.data);
        console.log('Folders data type:', typeof response.data);
        console.log('Is array?', Array.isArray(response.data));

        if (!response.data) {
          console.error('No data in response');
          setAvailableFolders([]);
          return;
        }

        // Handle both paginated and non-paginated responses
        let foldersData: Folder[] = [];
        if (Array.isArray(response.data)) {
          foldersData = response.data;
        } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.results)) {
          foldersData = response.data.results;
        } else {
          console.warn("Folders data is not an array:", response.data);
          console.warn("Response status:", response.status);
          console.warn("Response headers:", response.headers);
          foldersData = [];
        }

        console.log('Final folders data:', foldersData);
        setAvailableFolders(Array.isArray(foldersData) ? foldersData : []);
      } catch (error) {
        console.error('Error loading folders:', error);
        toast.error('خطا در بارگذاری پوشه‌ها');
      } finally {
        setFoldersLoading(false);
      }
    };

    loadFolders();
  }, []);

  // Load available test collections
  const loadCollections = useCallback(async () => {
    try {
      setCollectionsLoading(true);
      const response = await axiosInstance.get('/test-collections/');
      console.log('Collections API response:', response.data);

      // Handle both paginated and non-paginated responses
      let collectionsData: TestCollection[] = [];
      if (Array.isArray(response.data)) {
        collectionsData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        collectionsData = response.data.results;
      } else {
        console.warn('Unexpected collections API response format:', response.data);
        collectionsData = [];
      }

      setAvailableCollections(collectionsData);
    } catch (error) {
      console.error('Error loading collections:', error);
      toast.error('خطا در بارگذاری مجموعه‌ها');
    } finally {
      setCollectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Load existing test data when in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const loadTestData = async () => {
        try {
          setLoading(true);
          const response = await axiosInstance.get(`/question-tests/${id}/`);
          const testData = response.data;

          // Convert duration from ISO 8601 to HH:MM:SS format for display
          let durationDisplay = testData.duration || 'PT30M';
          if (durationDisplay.startsWith('PT')) {
            const match = durationDisplay.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (match) {
              const hours = parseInt(match[1] || '0');
              const minutes = parseInt(match[2] || '0');
              const seconds = parseInt(match[3] || '0');
              durationDisplay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
          }

          // Parse start_time and end_time
          if (testData.start_time) {
            const startDateTime = new Date(testData.start_time);
            setStartDate(startDateTime);
            setStartTimeStr(startDateTime.toTimeString().slice(0, 5)); // HH:MM format
          }
          if (testData.end_time) {
            const endDateTime = new Date(testData.end_time);
            setEndDate(endDateTime);
            setEndTimeStr(endDateTime.toTimeString().slice(0, 5)); // HH:MM format
          }

          // Parse duration into hours and minutes
          if (testData.duration) {
            const durationStr = String(testData.duration);
            if (durationStr.startsWith('PT')) {
              // ISO 8601 format: PT1H0M
              const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
              if (match) {
                setDurationHour(match[1] || '0');
                setDurationMinute(match[2] || '0');
              }
            } else if (durationStr.includes(':')) {
              // HH:MM:SS format: 01:00:00
              const parts = durationStr.split(':');
              if (parts.length >= 2) {
                setDurationHour(parts[0].padStart(2, '0'));
                setDurationMinute(parts[1].padStart(2, '0'));
              }
            }
          }

          // Populate form with existing data
          setFormData({
            name: testData.name || '',
            description: testData.description || '',
            folders: testData.folders || [],
            questions: testData.questions || [],
            duration: durationDisplay,
            start_time: testData.start_time || '',
            end_time: testData.end_time || '',
            frequency: testData.frequency || 'once',
            is_active: testData.is_active ?? true,
            content_type: 'typed_question',
            test_collection: testData.test_collection || undefined,
          });

          setSelectedFolders(testData.folders || []);
          setSelectedQuestions(testData.questions || []);
        } catch (error) {
          console.error('Error loading test data:', error);
          toast.error('خطا در بارگذاری اطلاعات آزمون');
          navigate('/panel/question-tests');
        } finally {
          setLoading(false);
        }
      };

      loadTestData();
    }
  }, [isEditMode, id, navigate]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleQuestionSelect = (question: Question) => {
    if (selectedQuestions.find(q => q.id === question.id)) {
      // Remove from selected
      setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
    } else {
      // Add to selected
      setSelectedQuestions(prev => [...prev, question]);
    }
  };

  const handleRemoveSelectedQuestion = (questionId: number) => {
    setSelectedQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDifficultyFilter('all');
    setFolderFilter(null);
  };

  const handleSubmit = async (saveAndCreateAnother: boolean = false) => {
    if (selectedFolders.length === 0) {
      toast.error('حداقل یک پوشه را انتخاب کنید');
      return;
    }
    if (selectedQuestions.length === 0) {
      toast.error('حداقل یک سوال را انتخاب کنید');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('نام آزمون الزامی است');
      return;
    }

    setSubmitting(true);
    
    // Combine date and time for start_time and end_time
    let startTimeCombined = '';
    let endTimeCombined = '';
    
    if (startDate && startTimeStr) {
      const startDateTime = new Date(startDate);
      const [hours, minutes] = startTimeStr.split(':');
      startDateTime.setHours(parseInt(hours), parseInt(minutes));
      startTimeCombined = startDateTime.toISOString();
    }
    
    if (endDate && endTimeStr) {
      const endDateTime = new Date(endDate);
      const [hours, minutes] = endTimeStr.split(':');
      endDateTime.setHours(parseInt(hours), parseInt(minutes));
      endTimeCombined = endDateTime.toISOString();
    }

    // Create duration from hours and minutes
    let durationValue = formData.duration;
    if (durationHour || durationMinute) {
      const hours = parseInt(durationHour) || 0;
      const minutes = parseInt(durationMinute) || 0;
      durationValue = `PT${hours}H${minutes}M`;
    } else if (durationValue && durationValue.includes(':')) {
      // Convert HH:MM:SS to ISO 8601 format
      const parts = durationValue.split(':');
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;
      durationValue = `PT${hours}H${minutes}M${seconds}S`;
    }
    
    const submitData: CreateQuestionTestData = {
      ...formData,
      duration: durationValue,
      start_time: startTimeCombined || null,
      end_time: endTimeCombined || null,
      folders: selectedFolders,
      questions: selectedQuestions.map(q => q.id),
    };

    try {
      if (isEditMode && id) {
        await axiosInstance.put(`/question-tests/${id}/`, submitData);
        toast.success('آزمون با موفقیت ویرایش شد');
      } else {
        await axiosInstance.post('/question-tests/', submitData);
        toast.success('آزمون با موفقیت ایجاد شد');
      }

      if (saveAndCreateAnother && !isEditMode) {
        // Reset form (only for create mode)
        setFormData({
          name: '',
          description: '',
          folders: [],
          questions: [],
          duration: 'PT30M',
          start_time: '',
          end_time: '',
          frequency: 'once',
          is_active: true,
          content_type: 'typed_question',
          test_collection: undefined,
        });
        setSelectedFolders([]);
        setSelectedQuestions([]);
        setStartDate(undefined);
        setStartTimeStr("");
        setEndDate(undefined);
        setEndTimeStr("");
        setDurationHour("");
        setDurationMinute("");
        toast.success('فرم آماده آزمون بعدی شد');
      } else {
        navigate('/panel/question-tests');
      }
    } catch (error) {
      console.error('Error saving test:', error);
      toast.error(isEditMode ? 'خطا در ویرایش آزمون' : 'خطا در ایجاد آزمون');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAvailableQuestions = availableQuestions.filter(
    question => !selectedQuestions.find(q => q.id === question.id)
  );

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/panel/tests')}
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'ویرایش آزمون سوالی' : 'ایجاد آزمون سوالی جدید'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'ویرایش آزمون با سوالات تایپ شده' : 'آزمون با سوالات تایپ شده'}
          </p>
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
                  placeholder="مثال: آزمون ریاضی پایه - سطح 1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-duration">مدت آزمون *</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="test-duration-hour"
                      type="number"
                      min="0"
                      max="23"
                      placeholder="ساعت"
                      value={durationHour}
                      onChange={(e) => setDurationHour(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      id="test-duration-minute"
                      type="number"
                      min="0"
                      max="59"
                      placeholder="دقیقه"
                      value={durationMinute}
                      onChange={(e) => setDurationMinute(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test-start-time">زمان شروع *</Label>
                <DateTimePicker
                  date={startDate}
                  setDate={setStartDate}
                  time={startTimeStr}
                  setTime={setStartTimeStr}
                  placeholder="انتخاب زمان شروع"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-end-time">زمان پایان *</Label>
                <DateTimePicker
                  date={endDate}
                  setDate={setEndDate}
                  time={endTimeStr}
                  setTime={setEndTimeStr}
                  placeholder="انتخاب زمان پایان"
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

            <div className="space-y-2">
              <Label htmlFor="test-frequency">تکرار آزمون</Label>
              <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                <SelectTrigger id="test-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">یک بار</SelectItem>
                  <SelectItem value="daily">روزانه</SelectItem>
                  <SelectItem value="weekly">هفتگی</SelectItem>
                  <SelectItem value="monthly">ماهانه</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-collection">مجموعه آزمون (اختیاری)</Label>
              <Select
                value={formData.test_collection?.toString() || "none"}
                onValueChange={(value) => setFormData({ ...formData, test_collection: value !== "none" ? parseInt(value) : undefined })}
                disabled={collectionsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب مجموعه آزمون..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون مجموعه</SelectItem>
                  {availableCollections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id.toString()}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {collectionsLoading && (
                <p className="text-sm text-muted-foreground">در حال بارگذاری مجموعه‌ها...</p>
              )}
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

        {/* Folder Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              انتخاب مباحث *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FolderSelector
              selectedFolderIds={selectedFolders}
              onSelectionChange={setSelectedFolders}
              required={true}
            />
          </CardContent>
        </Card>

        {/* Question Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              انتخاب سوالات *
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              برای انتخاب سوالات از چک‌باکس کنار هر سوال استفاده کنید
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Questions Summary */}
            {selectedQuestions.length > 0 && (
              <div className="space-y-2">
                <Label>سوالات انتخاب شده ({selectedQuestions.length}) - برای حذف کلیک کنید</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedQuestions.map((question) => (
                    <Badge key={question.id} variant="secondary" className="flex items-center gap-1">
                      {question.public_id}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRemoveSelectedQuestion(question.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <Separator />
              </div>
            )}

            {/* Question Filters */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>فیلترها</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="flex items-center gap-2"
                >
                  <FilterX className="w-4 h-4" />
                  پاک کردن فیلترها
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">جستجو</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="جستجو در متن سوال..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">سطح دشواری</Label>
                  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه سطوح</SelectItem>
                      <SelectItem value="easy">ساده</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="hard">دشوار</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="folder">پوشه</Label>
                  <Select
                    value={folderFilter?.toString() || "all"}
                    onValueChange={(value) => setFolderFilter(value === "all" ? null : parseInt(value))}
                    disabled={foldersLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه پوشه‌ها</SelectItem>
                      {Array.isArray(availableFolders) && availableFolders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id.toString()}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Available Questions */}
            <div className="space-y-2">
              <Label>سوالات موجود ({filteredAvailableQuestions.length})</Label>
              <ScrollArea className="h-96 border rounded-md p-4">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredAvailableQuestions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    سوالی یافت نشد
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAvailableQuestions.map((question) => (
                      <div key={question.id} className="">
                        <QuestionCard
                          question={question}
                          showActions={false}
                          selectable={true}
                          isSelected={selectedQuestions.some(q => q.id === question.id)}
                          onSelectionChange={() => handleQuestionSelect(question)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/panel/tests')}
          >
            انصراف
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={submitting || isEditMode}
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
            {isEditMode ? 'به‌روزرسانی آزمون' : 'ذخیره آزمون'}
          </Button>
        </div>
      </form>
    </div>
  );
}