import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { 
  BookOpen, 
  Users, 
  Calendar,
  Plus,
  Search,
  Play,
  FileText,
  Edit,
  Eye
} from "lucide-react";

interface Course {
  id: number;
  title: string;
  description: string;
  students_count: number;
  sessions_count: number;
  tests_count: number;
  created_at: string;
  is_active: boolean;
}

export default function CoursesList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/teacher-courses/");
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("خطا در دریافت دوره‌ها");
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  const handleViewCourse = (courseId: number) => {
    window.location.href = `/panel/courses/${courseId}`;
  };

  const handleEditCourse = (courseId: number) => {
    window.location.href = `/panel/courses/${courseId}/edit`;
  };

  const handleCreateCourse = () => {
    window.location.href = "/panel/courses/create";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">دوره‌های من</h1>
          <p className="text-gray-600 mt-2">مدیریت دوره‌های آموزشی</p>
        </div>
        <Button onClick={handleCreateCourse} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          ایجاد دوره جدید
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="جستجو در دوره‌ها..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "دوره‌ای یافت نشد" : "هنوز دوره‌ای ایجاد نکرده‌اید"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? "لطفاً عبارت جستجوی دیگری امتحان کنید"
                  : "برای شروع، اولین دوره آموزشی خود را ایجاد کنید"
                }
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateCourse}>
                  <Plus className="w-4 h-4 ml-2" />
                  ایجاد دوره جدید
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course}
              onView={handleViewCourse}
              onEdit={handleEditCourse}
            />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {courses.length}
              </div>
              <div className="text-sm text-gray-600">کل دوره‌ها</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {courses.reduce((sum, course) => sum + course.sessions_count, 0)}
              </div>
              <div className="text-sm text-gray-600">کل جلسات</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {courses.reduce((sum, course) => sum + course.tests_count, 0)}
              </div>
              <div className="text-sm text-gray-600">کل آزمون‌ها</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {courses.reduce((sum, course) => sum + course.students_count, 0)}
              </div>
              <div className="text-sm text-gray-600">کل دانش‌آموزان</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CourseCardProps {
  course: Course;
  onView: (courseId: number) => void;
  onEdit: (courseId: number) => void;
}

function CourseCard({ course, onView, onEdit }: CourseCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {course.description || "توضیحی برای این دوره ثبت نشده است"}
            </p>
          </div>
          <Badge variant={course.is_active ? "default" : "secondary"}>
            {course.is_active ? "فعال" : "غیرفعال"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div className="flex flex-col items-center">
            <Play className="w-5 h-5 text-blue-600 mb-1" />
            <span className="text-sm font-medium">{course.sessions_count}</span>
            <span className="text-xs text-gray-500">جلسه</span>
          </div>
          <div className="flex flex-col items-center">
            <FileText className="w-5 h-5 text-green-600 mb-1" />
            <span className="text-sm font-medium">{course.tests_count}</span>
            <span className="text-xs text-gray-500">آزمون</span>
          </div>
          <div className="flex flex-col items-center">
            <Users className="w-5 h-5 text-purple-600 mb-1" />
            <span className="text-sm font-medium">{course.students_count}</span>
            <span className="text-xs text-gray-500">دانش‌آموز</span>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Calendar className="w-3 h-3" />
          <span>ایجاد شده در {formatDate(course.created_at)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={() => onView(course.id)} 
            variant="outline" 
            size="sm" 
            className="flex-1"
          >
            <Eye className="w-4 h-4 ml-2" />
            مشاهده
          </Button>
          <Button 
            onClick={() => onEdit(course.id)} 
            variant="outline" 
            size="sm" 
            className="flex-1"
          >
            <Edit className="w-4 h-4 ml-2" />
            ویرایش
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
