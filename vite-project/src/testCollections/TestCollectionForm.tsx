import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { 
  BookOpen, 
  Plus,
  ArrowLeft,
  Users,
  Check,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Course {
  id: number;
  title: string;
}

interface FormData {
  name: string;
  description: string;
  courses: number[];
}

export default function TestCollectionForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    courses: []
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await axiosInstance.get("/teacher-courses/");
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("خطا در دریافت کلاس‌ها");
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("عنوان مجموعه آزمون الزامی است");
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post("/test-collections/", formData);
      toast.success("مجموعه آزمون با موفقیت ایجاد شد");
      navigate("/panel/test-collections");
    } catch (error) {
      console.error("Error creating test collection:", error);
      toast.error("خطا در ایجاد مجموعه آزمون");
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (courseId: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.includes(courseId)
        ? prev.courses.filter(id => id !== courseId)
        : [...prev.courses, courseId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate("/panel/test-collections")}
        >
          <ArrowLeft className="h-4 w-4 ml-1" />
          بازگشت
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <h1 className="text-3xl font-bold">ایجاد مجموعه آزمون جدید</h1>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              اطلاعات مجموعه آزمون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">عنوان مجموعه آزمون *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="عنوان مجموعه آزمون را وارد کنید"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">توضیحات</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="توضیحات مجموعه آزمون را وارد کنید"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>کلاس‌های مرتبط</Label>
                {coursesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : courses.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          formData.courses.includes(course.id)
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => toggleCourse(course.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{course.title}</span>
                        </div>
                        {formData.courses.includes(course.id) ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    هیچ کلاسی یافت نشد. ابتدا یک کلاس ایجاد کنید.
                  </p>
                )}
              </div>

              {formData.courses.length > 0 && (
                <div className="space-y-2">
                  <Label>کلاس‌های انتخاب شده:</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.courses.map((courseId) => {
                      const course = courses.find(c => c.id === courseId);
                      return course ? (
                        <Badge key={courseId} variant="secondary">
                          {course.title}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current ml-2"></div>
                      در حال ایجاد...
                    </>
                  ) : (
                    <>
                      <Plus className="ml-2 h-4 w-4" />
                      ایجاد مجموعه آزمون
                    </>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/panel/test-collections")}
                >
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
