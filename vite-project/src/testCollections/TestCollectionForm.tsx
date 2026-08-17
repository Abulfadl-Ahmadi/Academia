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
  ArrowRight, 
  Users, 
  UserCheck,
  Check, 
  X, 
  Edit, 
  Trash2,
  Search,
  Globe
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate, useLocation, useParams } from "react-router-dom";

interface Course {
  id: number;
  title: string;
}

interface Student {
  id: number;
  username: string;
  full_name: string;
  phone?: string;
}

interface FormData {
  name: string;
  description: string;
  courses: number[];
  students: number[];
  is_public: boolean;
}

export default function TestCollectionForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  
  // Get courseId from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const courseIdParam = queryParams.get('courseId');
  
  const [formData, setFormData] = useState<FormData>(() => {
    return {
      name: "",
      description: "",
      courses: courseIdParam ? [parseInt(courseIdParam)] : [],
      students: [],
      is_public: false
    };
  });

  // Update formData if courseIdParam changes
  useEffect(() => {
    if (courseIdParam) {
      const courseId = parseInt(courseIdParam);
      setFormData(prev => ({
        ...prev,
        courses: prev.courses.includes(courseId) ? prev.courses : [...prev.courses, courseId]
      }));
    }
  }, [courseIdParam]);

  // Fetch collection details if in edit mode
  const fetchCollectionDetails = useCallback(async () => {
    if (!isEditMode) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/test-collections/${id}/`);
      const data = response.data;
      
      const courseIds = data.course_details 
        ? data.course_details.map((course: { id: number }) => course.id)
        : data.courses || [];
      
      const studentIds = data.student_details
        ? data.student_details.map((s: { id: number }) => s.id)
        : data.students || [];

      setFormData({
        name: data.name || "",
        description: data.description || "",
        courses: courseIds,
        students: studentIds,
        is_public: Boolean(data.is_public)
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
      const response = await axiosInstance.get("/teacher-courses/");
      if (Array.isArray(response.data)) {
        setCourses(response.data);
      } else if (response.data.results && Array.isArray(response.data.results)) {
        setCourses(response.data.results);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("خطا در دریافت کلاس‌ها");
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      setStudentsLoading(true);
      const response = await axiosInstance.get("/test-collections/available_students/");
      if (Array.isArray(response.data)) {
        setStudents(response.data);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, [fetchCourses, fetchStudents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("عنوان مجموعه آزمون الزامی است");
      return;
    }
    
    try {
      setLoading(true);
      
      const dataToSubmit = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        courses: formData.courses || [],
        students: formData.students || [],
        is_public: formData.is_public
      };

      if (isEditMode) {
        await axiosInstance.put(`/test-collections/${id}/`, dataToSubmit);
        toast.success("مجموعه آزمون با موفقیت بروزرسانی شد");
      } else {
        await axiosInstance.post("/test-collections/", dataToSubmit);
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

  const handleDelete = async () => {
    if (!window.confirm("آیا از حذف این مجموعه آزمون اطمینان دارید؟ همه آزمون‌های داخل این مجموعه نیز حذف خواهند شد.")) {
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.delete(`/test-collections/${id}/`);
      toast.success("مجموعه آزمون با موفقیت حذف شد");
      navigate("/panel/test-collections");
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("خطا در حذف مجموعه آزمون");
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

  const toggleStudent = (studentId: number) => {
    setFormData(prev => ({
      ...prev,
      students: prev.students.includes(studentId)
        ? prev.students.filter(id => id !== studentId)
        : [...prev.students, studentId]
    }));
  };

  const selectAllFilteredStudents = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    setFormData(prev => ({
      ...prev,
      students: Array.from(new Set([...prev.students, ...filteredIds]))
    }));
  };

  const deselectAllFilteredStudents = () => {
    const filteredIds = new Set(filteredStudents.map(s => s.id));
    setFormData(prev => ({
      ...prev,
      students: prev.students.filter(id => !filteredIds.has(id))
    }));
  };

  const filteredStudents = students.filter(s => {
    if (!studentSearch.trim()) return true;
    const term = studentSearch.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(term) ||
      s.username?.toLowerCase().includes(term) ||
      s.phone?.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate("/panel/test-collections")}
        >
          <ArrowRight className="h-4 w-4 ml-1" />
          بازگشت
        </Button>
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <Edit className="h-6 w-6 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold">ویرایش مجموعه آزمون</h1>
            </>
          ) : (
            <>
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold">ایجاد مجموعه آزمون جدید</h1>
            </>
          )}
        </div>
      </div>

      <div className="max-w-3xl">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              {isEditMode ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              اطلاعات مجموعه آزمون
            </CardTitle>
            {courseIdParam && !isEditMode && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mt-2 text-sm">
                شما در حال ایجاد مجموعه آزمون برای دوره جاری هستید و این دوره به صورت خودکار انتخاب شده است.
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">عنوان مجموعه آزمون <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: آزمون‌های جامع جمع‌بندی کنکور"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">توضیحات</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="توضیحات مربوط به این مجموعه آزمون و راهنمایی برای دانش‌آموزان"
                  rows={3}
                />
              </div>

              {/* Public Access Switch */}
              <div className="flex items-center justify-between p-4 border rounded-xl bg-card hover:bg-muted/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <Label htmlFor="is_public" className="font-bold text-base cursor-pointer">دسترسی عمومی (Public)</Label>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    در صورت فعال بودن، تمام دانش‌آموزان سیستم بدون نیاز به خرید یا عضویت در دوره به این مجموعه آزمون دسترسی خواهند داشت.
                  </p>
                </div>
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                />
              </div>

              {/* Specific Students Selection */}
              <div className="space-y-3 p-4 border rounded-xl bg-card">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" />
                    <Label className="font-bold text-base">انتخاب دانش‌آموزان دارای دسترسی اختصاصی</Label>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                    {formData.students.length} دانش‌آموز انتخاب شده
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  مشابه پنل ادمین، می‌توانید دانش‌آموزان مشخصی را برای دسترسی به این مجموعه آزمون انتخاب کنید.
                </p>

                {/* Search & Bulk Select Controls */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="جستجو بر اساس نام، نام کاربری یا شماره همراه..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pr-9 text-sm"
                    />
                  </div>
                  {filteredStudents.length > 0 && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectAllFilteredStudents}
                        className="text-xs"
                      >
                        انتخاب همه نتایج
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={deselectAllFilteredStudents}
                        className="text-xs text-destructive"
                      >
                        لغو انتخاب
                      </Button>
                    </div>
                  )}
                </div>

                {/* Students List Box */}
                {studentsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : filteredStudents.length > 0 ? (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto border rounded-lg p-2.5 bg-muted/20">
                    {filteredStudents.map((student) => {
                      const isSelected = formData.students.includes(student.id);
                      return (
                        <div
                          key={student.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? "bg-primary/15 border border-primary/30 font-medium"
                              : "hover:bg-muted/70 border border-transparent"
                          }`}
                          onClick={() => toggleStudent(student.id)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                              isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-sm truncate">{student.full_name}</span>
                            <span className="text-xs text-muted-foreground font-mono">({student.username})</span>
                          </div>
                          {student.phone && (
                            <span className="text-xs text-muted-foreground font-mono hidden sm:inline">{student.phone}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    دانش‌آموزی با این مشخصات یافت نشد.
                  </p>
                )}

                {/* Selected Students Badges */}
                {formData.students.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs text-muted-foreground">دانش‌آموزان انتخاب شده:</Label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 border rounded-lg bg-muted/10">
                      {formData.students.map((studentId) => {
                        const student = students.find(s => s.id === studentId);
                        return (
                          <Badge 
                            key={studentId} 
                            variant="secondary" 
                            className="flex items-center gap-1 py-1 px-2 text-xs"
                          >
                            <span>{student ? student.full_name : `کاربر #${studentId}`}</span>
                            <X 
                              className="w-3 h-3 cursor-pointer hover:text-destructive" 
                              onClick={() => toggleStudent(studentId)} 
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Related Courses */}
              <div className="space-y-3 p-4 border rounded-xl bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <Label className="font-bold text-base">دوره‌های مرتبط (اتصال خودکار دانش‌آموزان دوره)</Label>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                    {formData.courses.length} دوره انتخاب شده
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  دانش‌آموزانی که در این دوره‌ها ثبت‌نام کرده‌اند، به صورت خودکار به این مجموعه آزمون دسترسی خواهند داشت.
                </p>

                {coursesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : courses.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto border rounded-lg p-2.5 bg-muted/20">
                    {courses.map((course: Course) => {
                      const isSelected = formData.courses.includes(course.id);
                      return (
                        <div
                          key={course.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-primary/15 border border-primary/30 font-medium"
                              : "hover:bg-muted/70 border border-transparent"
                          }`}
                          onClick={() => toggleCourse(course.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                              isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-sm">{course.title}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    هیچ دوره‌ای یافت نشد.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4 flex-wrap">
                <Button type="submit" disabled={loading} className="min-w-[140px]">
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

                {isEditMode && (
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={loading}
                    className="mr-auto"
                  >
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف مجموعه آزمون
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
