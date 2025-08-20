// import { Logo } from "@/components/logo";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Users,
  Clock,
  PlayCircle,
  BookOpen,
  Award,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import LogoCloud from "./LogoCloud";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
// API Interface for courses
interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  teacher?: {
    id: number;
    user: {
      first_name: string;
      last_name: string;
    };
  };
  level?: string;
  category?: {
    id: number;
    name: string;
  };
  sessions_count?: number;
  students_count?: number;
  created_at: string;
  image?: string;
  // For product interface compatibility
  current_price?: number;
  product_type?: string;
  course?: number;
}

// Mock data for products/courses (fallback)
const mockCourses = [
  {
    id: 1,
    title: "دوره جامع ریاضی دوازدهم",
    description: "آموزش کامل ریاضی دوازدهم برای آمادگی کنکور سراسری",
    price: 2500000,
    teacher: {
      id: 1,
      user: {
        first_name: "آرین",
        last_name: "تفضلی‌زاده",
      },
    },
    level: "دوازدهم",
    category: {
      id: 1,
      name: "ریاضی",
    },
    sessions_count: 40,
    students_count: 1240,
    created_at: new Date().toISOString(),
    thumbnail: "https://c242950.parspack.net/c242950/media/portrait.png",
  },
  {
    id: 2,
    title: "دوره ریاضی یازدهم",
    description: "تقویت پایه‌های ریاضی برای پایه یازدهم",
    price: 2200000,
    teacher: {
      id: 1,
      user: {
        first_name: "آرین",
        last_name: "تفضلی‌زاده",
      },
    },
    level: "یازدهم",
    category: {
      id: 1,
      name: "ریاضی",
    },
    sessions_count: 35,
    students_count: 890,
    created_at: new Date().toISOString(),
    thumbnail: "https://c242950.parspack.net/c242950/media/portrait.png",
  },
  {
    id: 3,
    title: "دوره آمادگی کنکور ریاضی",
    description: "تست‌زنی و حل نمونه سوالات کنکور سراسری",
    price: 3500000,
    teacher: {
      id: 1,
      user: {
        first_name: "آرین",
        last_name: "تفضلی‌زاده",
      },
    },
    level: "کنکور",
    category: {
      id: 1,
      name: "ریاضی",
    },
    sessions_count: 60,
    students_count: 650,
    created_at: new Date().toISOString(),
    thumbnail: "https://c242950.parspack.net/c242950/media/portrait.png",
  },
];

const stats = [
  { icon: Users, label: "دانشجوی فعال", value: "3000+" },
  { icon: BookOpen, label: "دوره آموزشی", value: "25+" },
  { icon: Clock, label: "ساعت محتوا", value: "500+" },
  { icon: Award, label: "مدرک معتبر", value: "100%" },
];

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        // Try different endpoints to find the correct one
        let response;
        try {
          response = await axiosInstance.get("/shop/products/");
        } catch {
          // If courses endpoint fails, try teacher-courses or shop/products with course filter
          try {
            response = await axiosInstance.get("/shop/products/");
            // Filter only course products and map to Course interface
            response.data = response.data.filter(
              (product: Course) => product.product_type === "course"
            );
          } catch {
            // Last fallback to teacher-courses (may require auth)
            response = await axiosInstance.get("/teacher-courses/");
          }
        }

        // Take only first 6 courses for featured section
        const featuredCourses = response.data.slice(0, 6);
        setCourses(featuredCourses);
        setError(null);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("خطا در بارگیری دوره‌ها");
        // Use mock data as fallback
        setCourses(mockCourses);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Helper function to get badge text
  const getBadge = (course: Course) => {
    const daysSinceCreated = Math.floor(
      (new Date().getTime() - new Date(course.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSinceCreated < 30) return "جدید";
    if (course.students_count && course.students_count > 500) return "پرفروش";
    return "محبوب";
  };

  // Helper function to format price
  const formatPrice = (course: Course) => {
    const price = course.current_price || course.price || 0;
    return new Intl.NumberFormat("fa-IR").format(price);
  };

  return (
    <div className="2xl:px-[10%] min-h-screen">
      {/* Hero Section */}
      <section className=" overflow-hidden">
        <div className="absolute inset-0"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  به آکادمی
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    {" " + BRAND.name}
                  </span>{" "}
                  خوش آمدید
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  آموزش حرفه‌ای ریاضیات برای رشته‌های ریاضی و تجربی.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  شروع یادگیری
                </Button>
                <Button variant="outline" size="lg">
                  مشاهده دوره‌ها
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mb-2">
                      <stat.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl p-8">
                <div className="h-full rounded-2xl flex items-center justify-center">
                  <img
                    src="https://c242950.parspack.net/c242950/media/portrait.png"
                    alt="Portrait"
                  />
                </div>
              </div>
              {/* <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl">🚀</span>
              </div> */}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              دوره‌های محبوب
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              از بهترین دوره‌های آموزشی ما بهره‌مند شوید و مهارت‌های خود را
              توسعه دهید
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20" dir="ltr">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="mr-2 text-lg text-gray-600 dark:text-gray-300">
                در حال بارگیری دوره‌ها...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-red-600 mb-4">{error}</div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                تلاش مجدد
              </Button>
            </div>
          ) : (
            <Carousel className="w-full" dir="ltr">
              <CarouselContent className="-ml-1">
                {courses.map((course) => (
                    <CarouselItem
                  key={course.id}
                  className="pl-1 md:basis-1/2 lg:basis-1/3"
                >
                  <div className="p-1" dir="rtl">
                  <Card
                    key={course.id}
                    className="group hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                      <div className="relative">
                        {course.image ? (
                          <div className="aspect-video overflow-hidden">
                            <img
                              src={course.image}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                        <Badge className="absolute top-3 right-3">
                          {getBadge(course)}
                        </Badge>
                      </div>

                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">
                            {course.level || "عمومی"}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">4.8</span>
                          </div>
                        </div>
                        <CardTitle className="text-xl group-hover:text-blue-600 transition-colors line-clamp-2">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed line-clamp-3">
                          {course.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {course.students_count
                              ? course.students_count.toLocaleString("fa-IR")
                              : "0"}{" "}
                            دانشجو
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {course.sessions_count
                              ? `${course.sessions_count} جلسه`
                              : "در حال تکمیل"}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold text-green-600">
                              {formatPrice(course)} تومان
                            </span>
                            {(course.price > 0 ||
                              (course.current_price &&
                                course.current_price > 0)) && (
                              <span className="text-sm text-gray-500 line-through mr-2">
                                {formatPrice({
                                  ...course,
                                  price: Math.floor(
                                    (course.current_price || course.price) * 1.4
                                  ),
                                })}
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              window.open(`/courses/${course.id}`, "_blank")
                            }
                          >
                            مشاهده دوره
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    </div>
                  </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
          )}

        

          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.open("/courses", "_blank")}
            >
              مشاهده همه دوره‌ها
            </Button>
          </div>
        </div>
      </section>
            
      <LogoCloud/>

      {/* About Me Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold">
                درباره {BRAND.name}
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground  leading-relaxed">
                <p>
                  بیش از ۱۲ سال سابقه تدریس و آموزش در بالاترین سطوح آموزشی،
                  نویسنده ۴ کتاب تحصیلی از جمله مهرو ماه و گاج و... و آمار قبولی
                  بالا ۹۰ درصد
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-600">8+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    سال تجربه
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-purple-600">50+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    پروژه موفق
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-600">3000+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    دانشجوی راضی
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-orange-600">25+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    دوره تخصصی
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* <div className="aspect-square bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl overflow-hidden shadow-2xl">
                <div className="h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-6xl mb-4">👨‍💻</div>
                    <div className="text-xl font-bold">{BRAND.name}</div>
                    <div className="text-blue-100">مدرس و توسعه‌دهنده</div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl">⭐</span>
              </div> */}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
