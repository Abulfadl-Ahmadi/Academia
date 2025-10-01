import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Calendar, Clock, FileText, Users, Eye, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axios';

interface QuestionTest {
  id: number;
  name: string;
  description?: string;
  duration: string; // ISO 8601 duration format like "PT30M"
  is_active: boolean;
  created_at: string;
  updated_at: string;
  questions_count?: number;
  folders_count?: number;
  collection?: {
    id: number;
    name: string;
    created_by_name: string;
  };
}

export default function QuestionTestsPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<QuestionTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/question-tests/');
      console.log('Question tests API response:', response.data);
      console.log('Response status:', response.status);
      console.log('Response type:', typeof response.data);
      
      // Handle different response types
      let testsData = [];
      if (Array.isArray(response.data)) {
        testsData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        testsData = response.data.results;
      } else if (typeof response.data === 'string') {
        console.error('API returned HTML instead of JSON:', response.data.substring(0, 200));
        testsData = [];
      } else {
        console.warn('Unexpected API response format:', response.data);
        testsData = [];
      }
      
      console.log('Processed tests data:', testsData);
      setTests(testsData);
    } catch (error) {
      console.error('Error loading question tests:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Error response:', (error as { response?: unknown }).response);
      }
      toast.error('خطا در بارگذاری آزمون‌ها');
      setTests([]); // Ensure tests is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testId: number) => {
    if (!confirm('آیا از حذف این آزمون اطمینان دارید؟')) {
      return;
    }

    try {
      await axiosInstance.delete(`/question-tests/${testId}/`);
      toast.success('آزمون با موفقیت حذف شد');
      loadTests(); // Reload the list
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('خطا در حذف آزمون');
    }
  };

  const handleShare = async (test: QuestionTest) => {
    // Navigate to poster page instead of copying link
    navigate(`/panel/question-tests/${test.id}/poster`);
  };

  const formatDuration = (duration: string) => {
    // Parse ISO 8601 duration format (e.g., "PT30M" = 30 minutes)
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

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">آزمون‌های سوالی</h1>
          <p className="text-muted-foreground">مدیریت آزمون‌های ساخته شده با سوالات تایپ شده</p>
        </div>
        <Button onClick={() => navigate('/panel/question-tests/create')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          آزمون جدید
        </Button>
      </div>

      {/* Tests List */}
      {tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">هیچ آزمونی یافت نشد</h3>
            <p className="text-muted-foreground text-center mb-4">
              هنوز هیچ آزمون سوالی ایجاد نکرده‌اید. برای شروع، آزمون جدیدی بسازید.
            </p>
            <Button onClick={() => navigate('/panel/question-tests/create')}>
              <Plus className="w-4 h-4 mr-2" />
              ایجاد آزمون اول
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(tests || []).map((test) => (
            <Card key={test.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{test.name}</h3>
                      <Badge variant={test.is_active ? "default" : "secondary"}>
                        {test.is_active ? "فعال" : "غیرفعال"}
                      </Badge>
                    </div>

                    {test.description && (
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {test.description}
                      </p>
                    )}

                    {test.collection && (
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          مجموعه: {test.collection.name}
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        مدت: {formatDuration(test.duration)}
                      </div>

                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        سوالات: {test.questions_count || 0}
                      </div>

                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        پوشه‌ها: {test.folders_count || 0}
                      </div>

                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        ایجاد: {formatDate(test.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/panel/question-tests/${test.id}`)}
                      title="مشاهده سوالات"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/panel/question-tests/${test.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/panel/question-tests/${test.id}/results`)}
                    >
                      <Users className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(test)}
                      title="اشتراک‌گذاری آزمون"
                    >
                      <Share className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(test.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}