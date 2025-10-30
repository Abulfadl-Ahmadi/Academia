import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { createQuestionCollection } from "@/api/questionCollections";
import axiosInstance from "@/lib/axios";

interface Question {
  id: number;
  public_id: string;
  question_text: string;
  difficulty_level: string;
  folders_names: string[];
}

interface FormData {
  name: string;
  description: string;
  is_active: boolean;
  question_ids: number[];
}

export default function CreateQuestionCollectionPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    is_active: true,
    question_ids: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Question selection states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [questionSearch, setQuestionSearch] = useState("");
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoadingQuestions(true);
      const response = await axiosInstance.get('/questions/', {
        params: {
          page: 1,
          page_size: 100, // Get more questions for selection
          search: questionSearch,
          is_active: true,
        }
      });
      
      let questionsData = [];
      if (response.data.results) {
        questionsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        questionsData = response.data;
      }
      
      setQuestions(questionsData);
    } catch (err) {
      console.error("Error fetching questions:", err);
      toast.error("خطا در بارگذاری سوالات");
    } finally {
      setLoadingQuestions(false);
    }
  }, [questionSearch]);

  useEffect(() => {
    if (questionDialogOpen) {
      fetchQuestions();
    }
  }, [questionDialogOpen, fetchQuestions]);

  const handleInputChange = (field: keyof FormData, value: string | boolean | number[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleQuestionSelect = (question: Question, isSelected: boolean) => {
    if (isSelected) {
      setSelectedQuestions(prev => [...prev, question]);
      setFormData(prev => ({ 
        ...prev, 
        question_ids: [...prev.question_ids, question.id] 
      }));
    } else {
      setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
      setFormData(prev => ({ 
        ...prev, 
        question_ids: prev.question_ids.filter(id => id !== question.id) 
      }));
    }
  };

  const removeSelectedQuestion = (questionId: number) => {
    setSelectedQuestions(prev => prev.filter(q => q.id !== questionId));
    setFormData(prev => ({ 
      ...prev, 
      question_ids: prev.question_ids.filter(id => id !== questionId) 
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("نام مجموعه سوال الزامی است");
      return false;
    }

    if (formData.name.length < 3) {
      setError("نام مجموعه سوال باید حداقل 3 کاراکتر باشد");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      await createQuestionCollection({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        is_active: formData.is_active,
        question_ids: formData.question_ids.length > 0 ? formData.question_ids : undefined,
      });

      toast.success("مجموعه سوال با موفقیت ایجاد شد");
      navigate("/panel/question-collections");
    } catch (error: unknown) {
      console.error("Error creating question collection:", error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        if (axiosError.response?.data) {
          const errorData = axiosError.response.data;
          if (typeof errorData === 'object') {
            const errorMessages = Object.values(errorData).flat();
            setError(errorMessages.join(', '));
          } else {
            setError("خطا در ایجاد مجموعه سوال");
          }
        } else {
          setError("خطا در ایجاد مجموعه سوال");
        }
      } else {
        setError("خطا در ایجاد مجموعه سوال");
      }
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadgeVariant = (level: string) => {
    switch (level) {
      case 'easy':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'hard':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getDifficultyLabel = (level: string) => {
    const labels = {
      easy: 'ساده',
      medium: 'متوسط',
      hard: 'دشوار'
    };
    return labels[level as keyof typeof labels] || level;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/panel/question-collections")}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">ایجاد مجموعه سوال جدید</h1>
            <p className="text-muted-foreground mt-2">
              مجموعه‌ای از سوالات مرتبط ایجاد کنید
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات پایه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">نام مجموعه سوال *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="نام مجموعه سوال را وارد کنید"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">توضیحات</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="توضیحات مجموعه سوال (اختیاری)"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">وضعیت فعال</Label>
                  <p className="text-sm text-muted-foreground">
                    مجموعه سوال فعال برای استفاده در آزمون‌ها در دسترس است
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>انتخاب سوالات</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    سوالاتی که در این مجموعه قرار خواهند گرفت (اختیاری)
                  </p>
                </div>
                <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      افزودن سوال
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>انتخاب سوالات</DialogTitle>
                      <DialogDescription>
                        سوالاتی که می‌خواهید به این مجموعه اضافه کنید را انتخاب کنید
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="جستجو در سوالات..."
                            value={questionSearch}
                            onChange={(e) => setQuestionSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Button onClick={fetchQuestions} variant="outline">
                          جستجو
                        </Button>
                      </div>

                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">انتخاب</TableHead>
                              <TableHead>شناسه</TableHead>
                              <TableHead>متن سوال</TableHead>
                              <TableHead>سطح دشواری</TableHead>
                              <TableHead>پوشه‌ها</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loadingQuestions ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                  در حال بارگذاری...
                                </TableCell>
                              </TableRow>
                            ) : questions.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                  سوالی یافت نشد
                                </TableCell>
                              </TableRow>
                            ) : (
                              questions.map((question) => {
                                const isSelected = formData.question_ids.includes(question.id);
                                return (
                                  <TableRow key={question.id}>
                                    <TableCell>
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => 
                                          handleQuestionSelect(question, checked as boolean)
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{question.public_id}</Badge>
                                    </TableCell>
                                    <TableCell className="max-w-md truncate">
                                      {question.question_text}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={getDifficultyBadgeVariant(question.difficulty_level)}>
                                        {getDifficultyLabel(question.difficulty_level)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {question.folders_names?.slice(0, 2).map((folder, idx) => (
                                        <Badge key={idx} variant="secondary" className="mr-1">
                                          {folder}
                                        </Badge>
                                      ))}
                                      {question.folders_names?.length > 2 && (
                                        <span className="text-xs text-muted-foreground">
                                          +{question.folders_names.length - 2}
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {selectedQuestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  هیچ سوالی انتخاب نشده است
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    {selectedQuestions.length} سوال انتخاب شده:
                  </p>
                  <div className="space-y-2">
                    {selectedQuestions.map((question) => (
                      <div
                        key={question.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{question.public_id}</Badge>
                          <span className="flex-1 truncate">{question.question_text}</span>
                          <Badge variant={getDifficultyBadgeVariant(question.difficulty_level)}>
                            {getDifficultyLabel(question.difficulty_level)}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSelectedQuestion(question.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/panel/question-collections")}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "در حال ایجاد..." : "ایجاد مجموعه سوال"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}