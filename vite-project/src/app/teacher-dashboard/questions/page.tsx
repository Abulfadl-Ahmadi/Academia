import { useState, useEffect, useCallback } from "react";
import { QuestionFilters } from "@/components/QuestionFilters";
import { QuestionCard } from "@/components/QuestionCard";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

interface FilterOptions {
  search: string;
  difficulty: string;
  folder: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface Question {
  id: number;
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
  created_at: string;
  updated_at: string;
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
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    difficulty: '',
    folder: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
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
    if (filters.folder) {
      params.append('folder', filters.folder);
    }
    
    const ordering = filters.sortOrder === 'asc' ? filters.sortBy : `-${filters.sortBy}`;
    params.append('ordering', ordering);

    return `/api/questions/?${params.toString()}`;
  }, [filters]);

  // Fetch questions
  const fetchQuestions = useCallback(async (page: number = 1, pageSize: number = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = buildApiUrl(page, pageSize);
      console.log('Fetching questions from:', url);
      
      // First try to check if Django server is running
      const testResponse = await axios.get('/api/');
      console.log('Django API root response:', testResponse.data);
      
      const response = await axios.get<QuestionsResponse>(url);
      
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
      console.log('Fetching stats from: /api/questions/stats/');
      const response = await axios.get<StatsResponse>('/api/questions/stats/');
      console.log('Stats API response:', response.data);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats (non-critical):', err);
      // Stats are not critical, so we don't set error state
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchQuestions();
    fetchStats();
  }, [fetchQuestions, fetchStats]);

  // Reload when filters change
  useEffect(() => {
    fetchQuestions(1, paginationInfo.page_size);
  }, [filters, fetchQuestions, paginationInfo.page_size]);

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
      await axios.delete(`/api/questions/${questionId}/`);
      await fetchQuestions(paginationInfo.current_page, paginationInfo.page_size);
      await fetchStats();
    } catch (err) {
      alert('خطا در حذف سوال');
      console.error('Error deleting question:', err);
    }
  };

  const handleToggleStatus = async (questionId: number, isActive: boolean) => {
    try {
      await axios.patch(`/api/questions/${questionId}/`, { is_active: isActive });
      await fetchQuestions(paginationInfo.current_page, paginationInfo.page_size);
      await fetchStats();
    } catch (err) {
      alert('خطا در تغییر وضعیت سوال');
      console.error('Error toggling question status:', err);
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