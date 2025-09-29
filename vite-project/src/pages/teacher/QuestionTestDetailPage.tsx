import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, Folder, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axios';
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

interface QuestionTest {
  id: number;
  name: string;
  description?: string;
  duration: string;
  is_active: boolean;
  created_at: string;
  questions_count: number;
  folders_count: number;
  questions: Question[];
  folders: number[];
}

export default function QuestionTestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<QuestionTest | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTestDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/question-tests/${id}/`);
      console.log('Question test detail response:', response.data);
      setTest(response.data);
    } catch (error) {
      console.error('Error loading question test detail:', error);
      toast.error('خطا در بارگذاری جزئیات آزمون');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadTestDetail();
    }
  }, [id, loadTestDetail]);

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?/);
    if (match) {
      const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0;
      const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0;

      if (hours > 0) {
        return `${hours} ساعت و ${minutes} دقیقه`;
      }
      return `${minutes} دقیقه`;
    }
    return duration;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="w-full mx-auto space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="w-full mx-auto space-y-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">آزمون یافت نشد</h2>
          <Button onClick={() => navigate('/panel/question-tests')}>
            بازگشت به لیست آزمون‌ها
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/panel/question-tests')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            بازگشت
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{test.name}</h1>
            {test.description && (
              <p className="text-muted-foreground mt-1">{test.description}</p>
            )}
          </div>
        </div>
        <Badge variant={test.is_active ? "default" : "secondary"}>
          {test.is_active ? "فعال" : "غیرفعال"}
        </Badge>
      </div>

      {/* Test Info */}
      <Card>
        <CardHeader>
          <CardTitle>اطلاعات آزمون</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">مدت: {formatDuration(test.duration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">سوالات: {test.questions_count}</span>
            </div>
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">پوشه‌ها: {test.folders_count}</span>
            </div>
            <div className="flex items-center gap-2 md:col-span-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">ایجاد: {formatDate(test.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">سوالات آزمون ({test.questions?.length || 0})</h2>

        {test.questions && test.questions.length > 0 ? (
          <div className="space-y-4">
            {test.questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                showActions={false}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">سوالی یافت نشد</h3>
              <p className="text-muted-foreground text-center">
                این آزمون هنوز سوالی ندارد.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}