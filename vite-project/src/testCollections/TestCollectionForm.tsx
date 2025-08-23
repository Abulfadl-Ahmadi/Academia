import { useState, useEffect, useCallback } from "react";
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
  X,
  Edit
} from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";

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
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  
  // Get courseId from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const courseIdParam = queryParams.get('courseId');
  
  console.log("URL parameters:", location.search);
  console.log("Parsed courseIdParam:", courseIdParam);
  console.log("Edit mode:", isEditMode, "Collection ID:", id);
  
  const [formData, setFormData] = useState<FormData>(() => {
    // Initialize with courseId from URL if available
    return {
      name: "",
      description: "",
      courses: courseIdParam ? [parseInt(courseIdParam)] : []
    };
  });

  // Debug function to show alert with current state
  const debugState = useCallback(() => {
    console.log("Current form data:", formData);
    console.log("Available courses:", courses);
    console.log("CourseIdParam:", courseIdParam);
    
    // Check if the courseId is valid
    if (courseIdParam) {
      const courseId = parseInt(courseIdParam);
      console.log("Course ID exists in form data:", formData.courses.includes(courseId));
      
      if (courses.length > 0) {
        const courseExists = courses.some((course: Course) => course.id === courseId);
        console.log("Course ID exists in available courses:", courseExists);
      }
    }
  }, [formData, courses, courseIdParam]);

  // Update formData if courseIdParam changes
  useEffect(() => {
    console.log("courseIdParam changed:", courseIdParam);
    if (courseIdParam) {
      const courseId = parseInt(courseIdParam);
      console.log("Setting courseId in formData:", courseId);
      setFormData(prev => ({
        ...prev,
        courses: prev.courses.includes(courseId) ? prev.courses : [...prev.courses, courseId]
      }));
      
      // Run debug after state update
      setTimeout(debugState, 500);
    }
  }, [courseIdParam, debugState]);

  // Fetch collection details if in edit mode
  const fetchCollectionDetails = useCallback(async () => {
    if (!isEditMode) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/test-collections/${id}/`);
      console.log("Fetched collection:", response.data);
      
      // Extract course IDs from course_details if available
      const courseIds = response.data.course_details 
        ? response.data.course_details.map((course: {id: number}) => course.id)
        : response.data.courses || [];
      
      setFormData({
        name: response.data.name || "",
        description: response.data.description || "",
        courses: courseIds
      });
    } catch (error) {
      console.error("Error fetching collection details:", error);
      toast.error("خطا در دریافت اطلاعات مجموعه آزمون");
    } finally {
      setLoading(false);
    }
  }, [id, isEditMode]);

  useEffect(() => {
    if (isEditMode) {
      fetchCollectionDetails();
    }
  }, [fetchCollectionDetails, isEditMode]);

  const fetchCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      console.log("Fetching courses...");
      const response = await axiosInstance.get("/teacher-courses/");
      console.log("Fetched courses:", response.data);
      
      // Check if the response is an array or has a specific structure
      if (Array.isArray(response.data)) {
        setCourses(response.data);
      } else if (response.data.results && Array.isArray(response.data.results)) {
        setCourses(response.data.results);
      } else {
        console.error("Unexpected response format:", response.data);
        toast.error("دریافت کلاس‌ها با خطا مواجه شد: قالب پاسخ نامعتبر است");
        setCourses([]);
      }
      
      // If we have a courseId parameter, verify that the course exists in the fetched data
      if (courseIdParam) {
        const courseId = parseInt(courseIdParam);
        const coursesArray = Array.isArray(response.data) ? response.data : 
                            (response.data.results && Array.isArray(response.data.results)) ? 
                            response.data.results : [];
        
        const courseExists = coursesArray.some((course: Course) => course.id === courseId);
        console.log(`Course with ID ${courseId} exists in fetched data: ${courseExists}`);
        if (!courseExists) {
          console.warn(`Course with ID ${courseId} not found in fetched courses`);
        }
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("خطا در دریافت کلاس‌ها");
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, [courseIdParam]);
  
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("عنوان مجموعه آزمون الزامی است");
      return;
    }
    
    // Log the submission data for debugging
    console.log("Submitting form data:", formData);
    
    try {
      setLoading(true);
      
      // Clone the form data for submission
      const dataToSubmit = {
        ...formData,
        // Make sure courses is at least an empty array if undefined
        courses: formData.courses || []
      };

      let response;
      
      if (isEditMode) {
        // Update existing collection
        response = await axiosInstance.put(`/test-collections/${id}/`, dataToSubmit);
        console.log("Server response:", response.data);
        toast.success("مجموعه آزمون با موفقیت بروزرسانی شد");
      } else {
        // Create new collection
        response = await axiosInstance.post("/test-collections/", dataToSubmit);
        console.log("Server response:", response.data);
        toast.success("مجموعه آزمون با موفقیت ایجاد شد");
      }
      
      navigate("/panel/test-collections");
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} test collection:`, error);
      toast.error(`خطا در ${isEditMode ? 'بروزرسانی' : 'ایجاد'} مجموعه آزمون`);
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

  // If there's an error loading the component, provide a fallback UI
  if (!Array.isArray(courses) && !coursesLoading) {
    console.error("courses is not an array:", courses);
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
            <h1 className="text-xl font-bold text-red-600">خطا در بارگذاری فرم</h1>
          </div>
        </div>
        <Card className="p-6">
          <div className="flex flex-col gap-4 items-center">
            <p>مشکلی در بارگذاری فرم رخ داده است. لطفاً صفحه را مجدداً بارگذاری کنید.</p>
            <div className="flex gap-3">
              <Button onClick={() => window.location.reload()}>بارگذاری مجدد</Button>
              <Button variant="outline" onClick={() => navigate("/panel/test-collections")}>
                بازگشت به صفحه قبل
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

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
          {isEditMode ? (
            <>
              <Edit className="h-6 w-6" />
              <h1 className="text-3xl font-bold">ویرایش مجموعه آزمون</h1>
            </>
          ) : (
            <>
              <BookOpen className="h-6 w-6" />
              <h1 className="text-3xl font-bold">ایجاد مجموعه آزمون جدید</h1>
            </>
          )}
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isEditMode ? (
                <Edit className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              اطلاعات مجموعه آزمون
            </CardTitle>
            {courseIdParam && !isEditMode && (
              <div className="bg-green-500/10 border border-green-500/50 rounded-md p-3 mt-4 text-sm">
                شما در حال ایجاد مجموعه آزمون برای کلاسی با شناسه {courseIdParam} هستید.
                این کلاس به صورت خودکار انتخاب شده است.
              </div>
            )}
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
                ) : Array.isArray(courses) && courses.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {courses.map((course: Course) => (
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
                      {isEditMode ? 'در حال بروزرسانی...' : 'در حال ایجاد...'}
                    </>
                  ) : isEditMode ? (
                    <>
                      <Edit className="ml-2 h-4 w-4" />
                      بروزرسانی مجموعه آزمون
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
                
                {/* Hidden debug button that only shows in development */}
                {import.meta.env.DEV && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={debugState}
                  >
                    بررسی وضعیت
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
