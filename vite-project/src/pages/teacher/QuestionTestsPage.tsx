import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Calendar, Clock, FileText, Users, Eye, Share, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  <Button onClick={() => navigate('/panel/tests/create?type=practice&content=typed_question')} className="flex items-center gap-2">
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
            <Button onClick={() => navigate('/panel/tests/create?type=practice&content=typed_question')}>
              <Plus className="w-4 h-4 mr-2" />
              ایجاد آزمون اول
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(tests || []).map((test) => (
            <Card key={test.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg truncate">{test.name}</CardTitle>
                <CardAction>
                  <div className="flex items-center gap-2">
                    <Badge variant={test.is_active ? "default" : "secondary"}>
                      {test.is_active ? "فعال" : "غیرفعال"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          onClick={() => navigate(`/panel/question-tests/${test.id}`)}
                          className="cursor-pointer"
                        >
                          <Eye className="w-4 h-4 ml-2" />
                          مشاهده سوالات
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => navigate(`/panel/question-tests/${test.id}/edit`)}
                          className="cursor-pointer"
                        >
                          <Edit className="w-4 h-4 ml-2" />
                          ویرایش آزمون
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => navigate(`/panel/question-tests/${test.id}/results`)}
                          className="cursor-pointer"
                        >
                          <Users className="w-4 h-4 ml-2" />
                          نتایج آزمون
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => handleShare(test)}
                          className="cursor-pointer"
                        >
                          <Share className="w-4 h-4 ml-2" />
                          اشتراک‌گذاری
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={() => handleDelete(test.id)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف آزمون
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardAction>
                
                {test.description && (
                  <CardDescription className="line-clamp-2">
                    {test.description}
                  </CardDescription>
                )}
                
                {test.collection && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      مجموعه: {test.collection.name}
                    </Badge>
                  </div>
                )}
              </CardHeader>

              <CardFooter className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground border-t">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">مدت: {formatDuration(test.duration)}</span>
                </div>

                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">سوالات: {test.questions_count || 0}</span>
                </div>

                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">پوشه‌ها: {test.folders_count || 0}</span>
                </div>

                <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">ایجاد: {formatDate(test.created_at)}</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}