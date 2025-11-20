import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { FolderTreeSelector } from "@/components/FolderTreeSelector";
import { ArrowRight, Sparkles, Clock, Target, Folder as FolderIcon } from "lucide-react";

interface CreateTestData {
  name: string;
  folders: number[];
  difficulty_level: string;
  questions_count: number;
  duration_minutes: number;
}

export default function TestMakerCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTestData>({
    name: "",
    folders: [],
    difficulty_level: "",
    questions_count: 10,
    duration_minutes: 30,
  });
  
  const [availableQuestionsCount, setAvailableQuestionsCount] = useState<number | null>(null);
  const [checkingQuestions, setCheckingQuestions] = useState(false);

  // بررسی تعداد سوالات موجود با فیلترهای انتخاب شده
  useEffect(() => {
    const checkAvailableQuestions = async () => {
      if (formData.folders.length === 0 && !formData.difficulty_level) {
        setAvailableQuestionsCount(null);
        return;
      }

      setCheckingQuestions(true);
      try {
        const params = new URLSearchParams();
        if (formData.folders.length > 0) {
          formData.folders.forEach(id => params.append('folders', id.toString()));
        }
        if (formData.difficulty_level) {
          params.append('difficulty', formData.difficulty_level);
        }
        params.append('is_active', 'true');

        const response = await axiosInstance.get(`/questions/?${params.toString()}`);
        const count = response.data.count || response.data.length || 0;
        setAvailableQuestionsCount(count);
      } catch (error) {
        console.error("Error checking questions:", error);
        setAvailableQuestionsCount(0);
      } finally {
        setCheckingQuestions(false);
      }
    };

    const debounce = setTimeout(() => {
      checkAvailableQuestions();
    }, 500);

    return () => clearTimeout(debounce);
  }, [formData.folders, formData.difficulty_level]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // اعتبارسنجی
    if (!formData.name.trim()) {
      toast.error("لطفاً نام آزمون را وارد کنید");
      return;
    }

    if (formData.questions_count < 1 || formData.questions_count > 100) {
      toast.error("تعداد سوالات باید بین 1 تا 100 باشد");
      return;
    }

    if (formData.duration_minutes < 5 || formData.duration_minutes > 300) {
      toast.error("مدت زمان آزمون باید بین 5 تا 300 دقیقه باشد");
      return;
    }

    if (availableQuestionsCount !== null && formData.questions_count > availableQuestionsCount) {
      toast.error(`فقط ${availableQuestionsCount} سوال با فیلترهای انتخابی موجود است`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        folders: formData.folders.length > 0 ? formData.folders : undefined,
        difficulty_level: formData.difficulty_level || undefined,
        questions_count: formData.questions_count,
        duration_minutes: formData.duration_minutes,
      };

      const response = await axiosInstance.post("/custom-tests/", payload);
      toast.success("آزمون با موفقیت ایجاد شد");
      navigate(`/panel/test-maker/test/${response.data.id}`);
    } catch (error) {
      console.error("Error creating test:", error);
      const err = error as { response?: { data?: { questions_count?: string[]; detail?: string } } };
      const errorMsg = err.response?.data?.questions_count?.[0] 
        || err.response?.data?.detail 
        || "خطا در ایجاد آزمون";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/panel/test-maker")}
        >
          <ArrowRight className="h-4 w-4 ml-1" />
          بازگشت
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">ایجاد آزمون شخصی</CardTitle>
              <CardDescription className="mt-1">
                آزمون خود را با انتخاب فیلترهای دلخواه بسازید
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* نام آزمون */}
            <div className="space-y-2">
              <Label htmlFor="name">نام آزمون *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثلاً: تمرین هندسه پایه دهم"
                required
              />
            </div>

            {/* انتخاب پوشه‌ها */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FolderIcon className="h-4 w-4" />
                پوشه‌ها (اختیاری)
              </Label>
              <FolderTreeSelector
                selectedFolderIds={formData.folders}
                onSelectionChange={(ids) => setFormData({ ...formData, folders: ids })}
                placeholder="انتخاب پوشه‌ها"
                maxHeight="max-h-64"
                showSelectedCount={true}
              />
              <p className="text-sm text-muted-foreground">
                با انتخاب چند پوشه، سوالات از تمام پوشه‌های انتخابی انتخاب می‌شوند
              </p>
            </div>

            {/* سطح دشواری */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                سطح دشواری (اختیاری)
              </Label>
              <Select
                value={formData.difficulty_level || "all"}
                onValueChange={(value) => setFormData({ ...formData, difficulty_level: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="همه سطوح" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه سطوح</SelectItem>
                  <SelectItem value="easy">آسان</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="hard">سخت</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* تعداد سوالات */}
            <div className="space-y-2">
              <Label htmlFor="questions_count">تعداد سوالات *</Label>
              <Input
                id="questions_count"
                type="number"
                min="1"
                max="100"
                value={formData.questions_count}
                onChange={(e) => setFormData({ ...formData, questions_count: parseInt(e.target.value) || 0 })}
                required
              />
              {checkingQuestions && (
                <p className="text-sm text-muted-foreground">در حال بررسی...</p>
              )}
              {availableQuestionsCount !== null && !checkingQuestions && (
                <p className={`text-sm ${availableQuestionsCount >= formData.questions_count ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                  {availableQuestionsCount} سوال با فیلترهای انتخابی موجود است
                </p>
              )}
            </div>

            {/* مدت زمان */}
            <div className="space-y-2">
              <Label htmlFor="duration_minutes" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                مدت زمان (دقیقه) *
              </Label>
              <Input
                id="duration_minutes"
                type="number"
                min="5"
                max="300"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                required
              />
              <p className="text-sm text-muted-foreground">
                بین 5 تا 300 دقیقه
              </p>
            </div>

            {/* دکمه‌های عمل */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || (availableQuestionsCount !== null && formData.questions_count > availableQuestionsCount)}
                className="flex-1"
              >
                {loading ? "در حال ایجاد..." : "ایجاد آزمون"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/panel/test-maker")}
                disabled={loading}
              >
                انصراف
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
