import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { 
  BookOpen, 
  Users, 
  Calendar,
  Search,
  Play,
  FileText,
  Eye,
  Clock
} from "lucide-react";

interface StudentCourse {
  id: number;
  title: string;
  description: string;
  sessions_count: number;
  tests_count: number;
  last_accessed: string | null;
  progress_percentage: number;
  teacher: {
    username: string;
  };
}

export default function StudentCoursesList() {
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/student-courses/");
      
      // Handle both array and pagination format
      let coursesData = [];
      if (Array.isArray(response.data)) {
        coursesData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        coursesData = response.data.results;
      } else {
        console.warn("Courses data is not an array:", response.data);
        coursesData = [];
      }
      
      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("خطا در دریافت دوره‌ها");
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = Array.isArray(courses) ? courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.teacher.username.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const handleViewCourse = (courseId: number) => {
    window.location.href = `/panel/courses/${courseId}`;
  };

  // const formatDate = (dateString: string | null) => {
  //   if (!dateString) return "هنوز مشاهده نشده";
  //   return new Date(dateString).toLocaleDateString("fa-IR");
  // };

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
      <div>
        <h1 className="text-3xl font-bold">دوره‌های من</h1>
        <p className="text-muted-foreground mt-2">دوره‌هایی که در آنها ثبت‌نام کرده‌اید</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchTerm ? "دوره‌ای یافت نشد" : "هنوز در دوره‌ای ثبت‌نام نکرده‌اید"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? "لطفاً عبارت جستجوی دیگری امتحان کنید"
                  : "برای دسترسی به دوره‌ها، ابتدا آنها را از فروشگاه خریداری کنید"
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => window.location.href = "/shop"}>
                  رفتن به فروشگاه
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <StudentCourseCard 
              key={course.id} 
              course={course}
              onView={handleViewCourse}
            />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold ">
                {courses.length}
              </div>
              <div className="text-sm text-muted-foreground">کل دوره‌ها</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {courses.reduce((sum, course) => sum + course.sessions_count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">کل جلسات</div>
            </div>
            <div>
              <div className="text-2xl font-bold ">
                {courses.reduce((sum, course) => sum + course.tests_count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">کل آزمون‌ها</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(courses.reduce((sum, course) => sum + course.progress_percentage, 0) / courses.length)}%
              </div>
              <div className="text-sm text-muted-foreground">میانگین پیشرفت</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StudentCourseCardProps {
  course: StudentCourse;
  onView: (courseId: number) => void;
}

function StudentCourseCard({ course, onView }: StudentCourseCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "هنوز مشاهده نشده";
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onView(course.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {course.description || "توضیحی برای این دوره ثبت نشده است"}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Teacher */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Users className="w-4 h-4" />
          <span>مدرس: {course.teacher.username}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div className="flex flex-col items-center">
            <Play className="w-5 h-5  mb-1" />
            <span className="text-sm font-medium">{course.sessions_count}</span>
            <span className="text-xs text-muted-foreground">جلسه</span>
          </div>
          <div className="flex flex-col items-center">
            <FileText className="w-5 h-5 mb-1" />
            <span className="text-sm font-medium">{course.tests_count}</span>
            <span className="text-xs text-muted-foreground">آزمون</span>
          </div>
          <div className="flex flex-col items-center">
            <Clock className="w-5 h-5  mb-1" />
            <span className="text-sm font-medium">{course.progress_percentage}%</span>
            <span className="text-xs text-muted-foreground">پیشرفت</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>پیشرفت</span>
            <span>{course.progress_percentage}%</span>
          </div>
          <div className="w-full rounded-full h-2">
            <Progress value={course.progress_percentage}/>
          </div>
        </div>

        {/* Last Accessed */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Calendar className="w-3 h-3" />
          <span>آخرین مشاهده: {formatDate(course.last_accessed)}</span>
        </div>

        {/* Action */}
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            onView(course.id);
          }} 
          className="w-full"
          size="sm"
        >
          <Eye className="w-4 h-4 ml-2" />
          مشاهده دوره
        </Button>
      </CardContent>
    </Card>
  );
}
