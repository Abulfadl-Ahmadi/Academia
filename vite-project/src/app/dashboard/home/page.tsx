import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUser } from "@/context/UserContext"
import { useCart } from "@/context/CartContext"
import { BookOpen, FileText, Play, User, Mail, GraduationCap, Loader2 } from "lucide-react"
import DashboardCart from "@/components/dashboard-cart"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import axiosInstance from "@/lib/axios"

export default function Home() {
  const { user } = useUser();
  const { restorePendingCart } = useCart();
  const navigate = useNavigate();
  
  // State for dashboard data
  const [dashboardStats, setDashboardStats] = useState({
    total_courses: 0,
    active_courses: 0,
    total_sessions: 0,
    total_files: 0,
    recent_activity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/courses/student/dashboard-stats/');
        setDashboardStats(response.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('خطا در بارگذاری اطلاعات داشبورد');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Check for pending cart restoration on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const showCart = urlParams.get('show_cart');
    const registrationSuccess = urlParams.get('registration_success');
    
    if (showCart === 'true' && registrationSuccess === 'true') {
      console.log('Dashboard: restoring pending cart after registration');
      restorePendingCart();
    }
  }, [restorePendingCart]);

  return (
        <div className="flex flex-1 flex-col gap-6">
          {/* Welcome Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-6 h-6" />
                خوش آمدید، {user?.first_name} {user?.last_name}!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                به پنل دانش‌آموزی آرین تفضلی‌زاده خوش آمدید. از اینجا می‌توانید به تمام محصولات خریداری شده دسترسی داشته باشید.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="font-medium">دوره‌ها</div>
                    <div className="text-sm text-muted-foreground">دسترسی به دوره‌های آموزشی</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                  <FileText className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="font-medium">فایل‌ها</div>
                    <div className="text-sm text-muted-foreground">دانلود جزوات و منابع</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-lg">
                  <Play className="w-8 h-8 text-purple-600" />
                  <div>
                    <div className="font-medium">آزمون‌ها</div>
                    <div className="text-sm text-muted-foreground">شرکت در آزمون‌های مختلف</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">دوره‌های فعال</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    dashboardStats.active_courses
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">فایل‌های قابل دانلود</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    dashboardStats.total_files
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium">جلسات آموزشی</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    dashboardStats.total_sessions
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium">کل دوره‌ها</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    dashboardStats.total_courses
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-red-600 text-sm">{error}</div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          {dashboardStats.recent_activity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>فعالیت‌های اخیر</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardStats.recent_activity.slice(0, 5).map((activity: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Play className="w-4 h-4 text-blue-600" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{activity.title}</div>
                        <div className="text-xs text-muted-foreground">{activity.course_name}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString('fa-IR')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shopping Cart */}
          <DashboardCart />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>دسترسی سریع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  onClick={() => navigate("/panel/products")} 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <BookOpen className="w-6 h-6" />
                  <span>محصولات من</span>
                </Button>
                
                <Button 
                  onClick={() => navigate("/panel/profile")} 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <User className="w-6 h-6" />
                  <span>پروفایل</span>
                </Button>
                
                <Button 
                  onClick={() => navigate("/shop")} 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <BookOpen className="w-6 h-6" />
                  <span>فروشگاه</span>
                </Button>
                
                <Button 
                  onClick={() => navigate("/panel/support")} 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <Mail className="w-6 h-6" />
                  <span>پشتیبانی</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
  )
}
