import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUser } from "@/context/UserContext"
import { BookOpen, FileText, Play, User, Mail, GraduationCap } from "lucide-react"

export default function Home() {
  const { user } = useUser();

  return (
        <div className="flex flex-1 flex-col gap-6">
          {/* Welcome Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-6 h-6" />
                خوش آمدید، {user?.username}!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                به پنل دانش‌آموزی آکادمیا خوش آمدید. از اینجا می‌توانید به تمام محصولات خریداری شده دسترسی داشته باشید.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="font-medium">دوره‌ها</div>
                    <div className="text-sm text-gray-600">دسترسی به دوره‌های آموزشی</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <FileText className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="font-medium">فایل‌ها</div>
                    <div className="text-sm text-gray-600">دانلود جزوات و منابع</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Play className="w-8 h-8 text-purple-600" />
                  <div>
                    <div className="font-medium">آزمون‌ها</div>
                    <div className="text-sm text-gray-600">شرکت در آزمون‌های مختلف</div>
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
                <div className="text-2xl font-bold mt-2">0</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">فایل‌های قابل دانلود</span>
                </div>
                <div className="text-2xl font-bold mt-2">0</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium">آزمون‌های موجود</span>
                </div>
                <div className="text-2xl font-bold mt-2">0</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium">پایه تحصیلی</span>
                </div>
                <div className="text-2xl font-bold mt-2">-</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>دسترسی سریع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  onClick={() => window.location.href = "/panel/products"} 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <BookOpen className="w-6 h-6" />
                  <span>محصولات من</span>
                </Button>
                
                <Button 
                  onClick={() => window.location.href = "/panel/profile"} 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <User className="w-6 h-6" />
                  <span>پروفایل</span>
                </Button>
                
                <Button 
                  onClick={() => window.location.href = "/shop"} 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <BookOpen className="w-6 h-6" />
                  <span>فروشگاه</span>
                </Button>
                
                <Button 
                  onClick={() => window.location.href = "/panel/support"} 
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
