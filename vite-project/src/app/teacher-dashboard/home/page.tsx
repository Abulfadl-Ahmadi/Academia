import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUser } from "@/context/UserContext"
import { BookOpen, Users, Play, FileText, Calendar, TrendingUp, Clock, CheckCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import axiosInstance from "@/lib/axios"
import { Loader2 } from "lucide-react"

interface TeacherAnalytics {
  total_courses: number;
  active_courses: number;
  total_students: number;
  recent_activity: Array<{
    id: number;
    title: string;
    course_name: string;
    created_at: string;
    type: string;
  }>;
  popular_courses: Array<{
    id: number;
    name: string;
    student_count: number;
    description: string;
  }>;
}

interface DueActivity {
  id: number;
  title: string;
  course_name: string;
  scheduled_time?: string;
  pending_count?: number;
  type: string;
  priority: string;
}

interface ScheduleItem {
  id: number;
  title: string;
  course_name: string;
  scheduled_time: string;
  duration: number;
  is_live: boolean;
  day_of_week?: string;
}

interface TeacherSchedule {
  today_classes: ScheduleItem[];
  week_schedule: ScheduleItem[];
  total_sessions_this_week: number;
  total_sessions_today: number;
}

export default function TeacherDashboardHome() {
  const { user } = useUser();
  const navigate = useNavigate();
  
  // State for dashboard data
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [dueActivities, setDueActivities] = useState<DueActivity[]>([]);
  const [schedule, setSchedule] = useState<TeacherSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch analytics, due activities, and schedule in parallel
        const [analyticsRes, dueActivitiesRes, scheduleRes] = await Promise.all([
          axiosInstance.get('/courses/teacher/analytics/'),
          axiosInstance.get('/courses/teacher/due-activities/'),
          axiosInstance.get('/courses/teacher/schedule/')
        ]);
        
        setAnalytics(analyticsRes.data);
        setDueActivities(dueActivitiesRes.data);
        setSchedule(scheduleRes.data);
      } catch (err) {
        console.error('Error fetching teacher dashboard data:', err);
        setError('خطا در بارگذاری اطلاعات داشبورد');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            خوش آمدید، {user?.first_name} {user?.last_name}!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            به پنل مدیریت معلم خوش آمدید. از اینجا می‌توانید دوره‌ها، دانش‌آموزان و فعالیت‌های خود را مدیریت کنید.
          </p>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-600 text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">کل دوره‌ها</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {analytics?.total_courses || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">دوره‌های فعال</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {analytics?.active_courses || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">کل دانش‌آموزان</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {analytics?.total_students || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium">جلسات امروز</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {schedule?.total_sessions_today || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Due Activities */}
      {dueActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              فعالیت‌های در انتظار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dueActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className={`flex items-center gap-3 p-3 rounded-lg ${
                  activity.priority === 'high' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    activity.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{activity.title}</div>
                    <div className="text-xs text-muted-foreground">{activity.course_name}</div>
                  </div>
                  {activity.scheduled_time && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.scheduled_time).toLocaleDateString('fa-IR')}
                    </div>
                  )}
                  {activity.pending_count && (
                    <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {activity.pending_count} مورد
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Schedule */}
      {schedule?.today_classes && schedule.today_classes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              برنامه امروز
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedule.today_classes.map((session) => (
                <div key={session.id} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Play className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{session.title}</div>
                    <div className="text-xs text-muted-foreground">{session.course_name}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(session.scheduled_time).toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {session.is_live && (
                    <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      زنده
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Courses */}
      {analytics?.popular_courses && analytics.popular_courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              محبوب‌ترین دوره‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.popular_courses.map((course) => (
                <div key={course.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{course.name}</div>
                    <div className="text-xs text-muted-foreground">{course.description}</div>
                  </div>
                  <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {course.student_count} دانش‌آموز
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>دسترسی سریع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={() => navigate("/panel/courses/create")} 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <BookOpen className="w-6 h-6" />
              <span>ایجاد دوره جدید</span>
            </Button>
            
            <Button 
              onClick={() => navigate("/panel/students")} 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <Users className="w-6 h-6" />
              <span>مدیریت دانش‌آموزان</span>
            </Button>
            
            <Button 
              onClick={() => navigate("/panel/test-collections/new")} 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <FileText className="w-6 h-6" />
              <span>ایجاد آزمون</span>
            </Button>
            
            <Button 
              onClick={() => navigate("/panel/calendar")} 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <Calendar className="w-6 h-6" />
              <span>تقویم</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
