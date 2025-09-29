import { useState, useEffect, useCallback } from "react";
import { QuestionFilters } from "@/components/QuestionFilters";
import { QuestionCard } from "@/components/QuestionCard";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, RefreshCw, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";

interface FilterOptions {
  search: string;
  difficulty: string;
  folders: number[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isActive: string;
  source: string;
  hasSolution: string;
  hasImages: string;
  dateFrom: string;
  dateTo: string;
}

interface Question {
  id: number;
  public_id: string;
  question_text: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  folders: number[]; // Array of folder IDs
  folders_names: string[]; // Array of folder names
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

interface PaginationInfo {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
}

interface QuestionsResponse {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: Question[];
}

interface StatsResponse {
  total_questions: number;
  by_difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  by_status: {
    active: number;
    inactive: number;
  };
  by_content: {
    with_solution: number;
    without_solution: number;
    with_images: number;
    without_images: number;
  };
  folders: Array<{id: string; name: string; parent__name?: string}>;
}

export default function QuestionsListPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    count: 0,
    total_pages: 1,
    current_page: 1,
    page_size: 20,
    next: null,
    previous: null,
  });
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<string>("");
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };

  // Remove a file from selection
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    difficulty: '',
    folders: [],
    sortBy: 'created_at',
    sortOrder: 'desc',
    isActive: '',
    source: '',
    hasSolution: '',
    hasImages: '',
    dateFrom: '',
    dateTo: '',
  });

  // Build API URL with filters
  const buildApiUrl = useCallback((page: number = 1, pageSize: number = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.difficulty) {
      params.append('difficulty', filters.difficulty);
    }
    if (filters.folders.length > 0) {
      filters.folders.forEach(folderId => {
        params.append('folders', folderId.toString());
      });
    }
    if (filters.isActive) {
      params.append('is_active', filters.isActive);
    }
    if (filters.source) {
      params.append('source', filters.source);
    }
    if (filters.hasSolution) {
      params.append('has_solution', filters.hasSolution);
    }
    if (filters.hasImages) {
      params.append('has_images', filters.hasImages);
    }
    if (filters.dateFrom) {
      params.append('date_from', filters.dateFrom);
    }
    if (filters.dateTo) {
      params.append('date_to', filters.dateTo);
    }

    const ordering = filters.sortOrder === 'asc' ? filters.sortBy : `-${filters.sortBy}`;
    params.append('ordering', ordering);

    return `/questions/?${params.toString()}`;
  }, [filters]);

  // Fetch questions
  const fetchQuestions = useCallback(async (page: number = 1, pageSize: number = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = buildApiUrl(page, pageSize);
      console.log('Fetching questions from:', url);
      
      // First try to check if Django server is running
      const testResponse = await axiosInstance.get('/');
      console.log('Django API root response:', testResponse.data);
      
      const response = await axiosInstance.get<QuestionsResponse>(url);
      
      console.log('Questions API response:', response.data);
      
      // Ensure results exist and is an array
      const results = response.data.results || [];
      setQuestions(results);
      
      setPaginationInfo({
        count: response.data.count || 0,
        total_pages: response.data.total_pages || 1,
        current_page: response.data.current_page || page,
        page_size: response.data.page_size || pageSize,
        next: response.data.next || null,
        previous: response.data.previous || null,
      });
    } catch (err) {
      setError('خطا در بارگذاری سوالات');
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  }, [buildApiUrl]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      // Build the same URL parameters as questions API
      const statsUrl = buildApiUrl(1, 1000).replace('/questions/', '/questions/stats/');
      console.log('Fetching stats from:', statsUrl);
      const response = await axiosInstance.get<StatsResponse>(statsUrl);
      console.log('Stats API response:', response.data);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats (non-critical):', err);
      // Stats are not critical, so we don't set error state
    }
  }, [buildApiUrl]);

  // Initial load
  useEffect(() => {
    fetchQuestions();
    fetchStats();
  }, [fetchQuestions, fetchStats]);

  // Reload when filters change
  useEffect(() => {
    fetchQuestions(1, paginationInfo.page_size);
    fetchStats();
  }, [filters, fetchQuestions, fetchStats, paginationInfo.page_size]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchQuestions(page, paginationInfo.page_size);
  };

  const handlePageSizeChange = (pageSize: number) => {
    fetchQuestions(1, pageSize);
  };

  // Handle question actions
  const handleEditQuestion = (questionId: number) => {
    // Navigate to edit page
    window.location.href = `/panel/questions/edit/${questionId}`;
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('آیا از حذف این سوال اطمینان دارید؟')) {
      return;
    }

    try {
      await axiosInstance.delete(`/questions/${questionId}/`);
      await fetchQuestions(paginationInfo.current_page, paginationInfo.page_size);
      await fetchStats();
    } catch (err) {
      alert('خطا در حذف سوال');
      console.error('Error deleting question:', err);
    }
  };

  const handleToggleStatus = async (questionId: number, isActive: boolean) => {
    try {
      await axiosInstance.patch(`/questions/${questionId}/`, { is_active: isActive });
      await fetchQuestions(paginationInfo.current_page, paginationInfo.page_size);
      await fetchStats();
    } catch (err) {
      alert('خطا در تغییر وضعیت سوال');
      console.error('Error toggling question status:', err);
    }
  };

  const handleBulkImport = async () => {
    if (selectedFiles.length === 0 || !selectedEngine) {
      toast.error("لطفا فایل ها و انجین را انتخاب کنید");
      return;
    }

    setBulkImportLoading(true);
    try {
      const formData = new FormData();
      
      // Add all selected files
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('engine', selectedEngine);

      const response = await axiosInstance.post('/questions/import_questions/', formData);

      toast.success(`سوالات با موفقیت وارد شدند. ${response.data.imported_count} سوال وارد شد.`);
      setBulkImportOpen(false);
      setSelectedFiles([]);

      // Refresh the questions list
      await fetchQuestions(paginationInfo.current_page, paginationInfo.page_size);
      await fetchStats();
    } catch (err) {
      console.error('Bulk import error:', err);
      const errorMessage = err instanceof Error ? err.message : 'خطا در وارد کردن سوالات';
      toast.error(errorMessage);
    } finally {
      setBulkImportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">مدیریت سوالات</h1>
          <p className="text-muted-foreground">
            مشاهده، جستجو و مدیریت کامل سوالات خود
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              fetchQuestions(paginationInfo.current_page, paginationInfo.page_size);
              fetchStats();
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>

          <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 ml-2" />
                ایجاد گروهی
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>وارد کردن سوالات گروهی</DialogTitle>
                <DialogDescription>
                  فایل های JSON را انتخاب کنید (برای انتخاب چندین فایل، Ctrl را نگه دارید و فایل ها را انتخاب کنید) و انجین مناسب را برای وارد کردن سوالات انتخاب کنید.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="engine-select">انجین وارد کننده</Label>
                  <Select value={selectedEngine} onValueChange={setSelectedEngine}>
                    <SelectTrigger>
                      <SelectValue placeholder="انجین را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engine-1">موتور ۱</SelectItem>
                      <SelectItem value="engine-2">موتور ۲</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="file-input">فایل های JSON</Label>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm text-gray-600">{selectedFiles.length} فایل انتخاب شده:</p>
                      <ScrollArea className="h-32 w-full rounded-md border p-2">
                        <div className="">
                          {selectedFiles.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="first:border-0 border-t flex items-center justify-between p-2">
                              <span className="text-sm truncate flex-1 mr-2">{file.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-6 w-6 p-0 hover:bg-red-100  hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBulkImportOpen(false);
                      setSelectedFiles([]);
                      setSelectedEngine("");
                    }}
                  >
                    انصراف
                  </Button>
                  <Button
                    onClick={handleBulkImport}
                    disabled={bulkImportLoading || selectedFiles.length === 0 || !selectedEngine}
                  >
                    {bulkImportLoading ? "در حال وارد کردن..." : "وارد کردن"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button asChild>
            <Link to="/panel/questions/create">
              <Plus className="h-4 w-4 ml-2" />
              سوال جدید
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <QuestionFilters 
        onFiltersChange={handleFiltersChange}
        stats={stats || undefined}
      />

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {/* Questions list */}
      {!loading && questions && questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onEdit={handleEditQuestion}
              onDelete={handleDeleteQuestion}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && (!questions || questions.length === 0) && !error && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {Object.values(filters).some(v => v) 
              ? 'هیچ سوالی با این فیلترها یافت نشد'
              : 'هنوز سوالی ایجاد نکرده‌اید'
            }
          </div>
          <Button asChild>
            <Link to="/panel/questions/create">
              <Plus className="h-4 w-4 ml-2" />
              اولین سوال خود را بسازید
            </Link>
          </Button>
        </div>
      )}

      {/* Pagination */}
      {!loading && questions && questions.length > 0 && (
        <Pagination
          paginationInfo={paginationInfo}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          disabled={loading}
        />
      )}
    </div>
  );
}