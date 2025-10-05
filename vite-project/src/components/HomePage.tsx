// import { Logo } from "@/components/logo";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ProgressiveBlur } from "../../components/motion-primitives/progressive-blur";
import { TextEffect } from "../../components/motion-primitives/text-effect";
import { TextShimmer } from "../../components/motion-primitives/text-shimmer";
import { SlidingNumber } from "../../components/motion-primitives/sliding-number";
import { useScrollTrigger } from "@/hooks/useScrollTrigger";
import { HeroGeometric } from "@/components/ui/shadcn-io/shape-landing-hero";

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
import { useEffect, useState, useMemo } from "react";
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
  const [textRef, isVisible] = useScrollTrigger();

  // Target date: September 20, 2025 at 8:00 PM
  const targetDate = useMemo(() => new Date('2025-10-17T20:00:00'), []);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = Math.max(0, targetDate.getTime() - now.getTime());
      
      // Calculate days, hours, minutes, seconds
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setDays(days);
      setHours(hours);
      setMinutes(minutes);
      setSeconds(seconds);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

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
            
            // Handle both array and pagination format
            let productsData = [];
            if (Array.isArray(response.data)) {
              productsData = response.data;
            } else if (response.data && Array.isArray(response.data.results)) {
              productsData = response.data.results;
            } else {
              console.warn("Products data is not an array:", response.data);
              productsData = [];
            }
            
            // Filter only course products and map to Course interface
            productsData = productsData.filter(
              (product: Course) => product.product_type === "course"
            );
            response.data = productsData;
          } catch {
            // Last fallback to teacher-courses (may require auth)
            response = await axiosInstance.get("/teacher-courses/");
          }
        }

        // Handle pagination format for the main response too
        let coursesData = [];
        if (Array.isArray(response.data)) {
          coursesData = response.data;
        } else if (response.data && Array.isArray(response.data.results)) {
          coursesData = response.data.results;
        } else {
          console.warn("Courses data is not an array:", response.data);
          coursesData = [];
        }

        // Take only first 6 courses for featured section
        const featuredCourses = coursesData.slice(0, 6);
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
    <div className="min-h-screen w-full my-10">
      <div className="flex flex-col items-center justify-center gap-6 mb-16 py-12 px-6 max-w-3xl mx-auto relative overflow-hidden">
        
        <div className="flex flex-col items-center gap-6 relative z-10" dir="ltr">
          <div className="flex items-center gap-4 sm:gap-6 font-mono">
            <div className="flex flex-col items-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                <SlidingNumber value={days} padStart={true} />
              </div>
              <span className="font-sans text-xs sm:text-sm mt-2 text-gray-600 dark:text-gray-300">روز</span>
            </div>
            <span className="text-zinc-500 text-4xl sm:text-5xl lg:text-6xl mb-4">:</span>
            <div className="flex flex-col items-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                <SlidingNumber value={hours} padStart={true} />
              </div>
              <span className="font-sans text-xs sm:text-sm mt-2 text-gray-600 dark:text-gray-300">ساعت</span>
            </div>
            <span className="text-zinc-500 text-4xl sm:text-5xl lg:text-6xl mb-4">:</span>
            <div className="flex flex-col items-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                <SlidingNumber value={minutes} padStart={true} />
              </div>
              <span className="font-sans text-xs sm:text-sm mt-2 text-gray-600 dark:text-gray-300">دقیقه</span>
            </div>
            <span className="text-zinc-500 text-4xl sm:text-5xl lg:text-6xl mb-4">:</span>
            <div className="flex flex-col items-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                <SlidingNumber value={seconds} padStart={true} />
              </div>
              <span className="font-sans text-xs sm:text-sm mt-2 text-gray-600 dark:text-gray-300">ثانیه</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center max-w-2xl text-center mt-3" dir="rtl">
            <p className="text-lg sm:text-2xl font-bold leading-relaxed">تا شروع سفری تازه در دنیای ریاضی چیزی باقی نمانده</p>
            <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 mt-3 px-4">منتظر یک تجربه آموزشی متفاوت باشید</p>
          </div>
        </div>
      </div>
      {/* Hero Section */}
      <div className="">
        <HeroGeometric
          title1="به آکادمی "
          title2="آرین تفضلی‌زاده خوش آمدید"
          description="آموزش حرفه‌ای ریاضیات برای رشته‌های ریاضی و تجربی."
        />
      </div>

      <section className="2xl:px-[10%] overflow-hidden">
        <div className="absolute inset-0"></div>
        <div className="relative container mx-auto px-4">
          <div className="grid lg:grid-cols-2 items-center ">
            <div className="inline-block relative lg:hidden mr-10">
              <svg
                className="w-24 text-gray-500/20"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
              >
                <path
                  fill="currentColor"
                  d="M544 360C544 426.3 490.3 480 424 480L416 480C398.3 480 384 465.7 384 448C384 430.3 398.3 416 416 416L424 416C454.9 416 480 390.9 480 360L480 352L416 352C380.7 352 352 323.3 352 288L352 224C352 188.7 380.7 160 416 160L480 160C515.3 160 544 188.7 544 224L544 360zM288 360C288 426.3 234.3 480 168 480L160 480C142.3 480 128 465.7 128 448C128 430.3 142.3 416 160 416L168 416C198.9 416 224 390.9 224 360L224 352L160 352C124.7 352 96 323.3 96 288L96 224C96 188.7 124.7 160 160 160L224 160C259.3 160 288 188.7 288 224L288 360z"
                />
              </svg>
              <div className="w-full absolute bottom-3 right-7">
                <div className="">ریاضی فراتر از فرمول‌هاست؛</div>
                <div className="">راهی‌ست به سوی یک درک واقعی!</div>
              </div>
            </div>

            <div className="fixed top-0">سلام</div>

            {/* <div className="space-y-4">
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
              </div> */}

            <div className="relative my-4 aspect-square h-full overflow-hidden rounded-[4px]">
              <img
                src="https://c242950.parspack.net/c242950/media/portrait.png"
                alt="Benjamin Spiers - Moonlight 2023"
                className="absolute inset-0 h-[95%] mx-auto"
              />

              <ProgressiveBlur
                className="pointer-events-none absolute bottom-0 left-0 h-[30%] w-full"
                blurIntensity={8}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="pointer-events-none absolute top-0 left-0 h-full w-1/4 bg-gradient-to-r from-background via-transparent to-transparent" />
              <div className="pointer-events-none absolute top-0 right-0 h-full w-1/4 bg-gradient-to-l from-background via-transparent to-transparent" />
            </div>

            {/* <div className="relative">
              <div className="aspect-square rounded-3xl p-8">
                <div className="h-full rounded-2xl flex items-center justify-center">
                  <img
                    src="https://c242950.parspack.net/c242950/media/portrait.png"
                    alt="Portrait"
                  />
                </div>
              </div>
            </div> */}

            <div className="space-y-8">
              <div className="w-full  lg:inline-block relative hidden mr-10 items-center justify-center self-center mx-auto">
                <svg
                  className="w-24 text-gray-500/20"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                >
                  <path
                    fill="currentColor"
                    d="M544 360C544 426.3 490.3 480 424 480L416 480C398.3 480 384 465.7 384 448C384 430.3 398.3 416 416 416L424 416C454.9 416 480 390.9 480 360L480 352L416 352C380.7 352 352 323.3 352 288L352 224C352 188.7 380.7 160 416 160L480 160C515.3 160 544 188.7 544 224L544 360zM288 360C288 426.3 234.3 480 168 480L160 480C142.3 480 128 465.7 128 448C128 430.3 142.3 416 160 416L168 416C198.9 416 224 390.9 224 360L224 352L160 352C124.7 352 96 323.3 96 288L96 224C96 188.7 124.7 160 160 160L224 160C259.3 160 288 188.7 288 224L288 360z"
                  />
                </svg>
                <div className="w-full absolute bottom-8 right-7">
                  <div className="w-full ">
                    ریاضی فراتر از فرمول‌هاست؛ راهی‌ست به سوی یک درک واقعی!
                  </div>
                  {/* <div className="w-full "> */}
                  {/* </div> */}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center ">
                <Button size="lg" onClick={() => window.location.href="/register"}>
                  <PlayCircle className="h-5 w-5" />
                  <TextShimmer
                    duration={1.2}
                    className="text-lg font-medium [--base-color:rgba(255,255,255,0.7)] [--base-gradient-color:rgba(255,255,255,1)] dark:[--base-color:rgba(255,255,255,0.7)] dark:[--base-gradient-color:rgba(255,255,255,1)]"
                  >
                    شروع یاد گیری
                  </TextShimmer>{" "}
                </Button>
                <Button variant="outline" size="lg" onClick={() => window.location.href="/shop"}>
                  مشاهده دوره‌ها
                </Button>
              </div>

              {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
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
              </div> */}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {/* <section className="2xl:px-[10%] py-20">
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
            <div className="w-full sm:px-15">
              <Carousel className="" dir="ltr">
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
                                  ? course.students_count.toLocaleString(
                                      "fa-IR"
                                    )
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
                                        (course.current_price || course.price) *
                                          1.4
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
                <div className="sm:block hidden">
                  <CarouselPrevious />
                  <CarouselNext />
                </div>
              </Carousel>
            </div>
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
      </section> */}

      <LogoCloud />

      {/* About Me Section */}
      <section className="2xl:px-[10%] py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-1 gap-12 items-center">
            <div ref={textRef} className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold">
                درباره {BRAND.name}
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground  leading-relaxed">
                <TextEffect preset="blur" trigger={isVisible}>
مدرس ریاضیات
                </TextEffect>

                <TextEffect preset="blur" trigger={isVisible}>
دانش آموخته جبرمحض  
دانشگاه علم و صنعت ایران
                </TextEffect>

                <TextEffect preset="blur" trigger={isVisible}>
دانش آموخته دکتری مدیریت کسب و کار از TBS
                </TextEffect>


                <TextEffect preset="blur" trigger={isVisible}>
۱۴ سال سابقه تدریس 
در مدارس بهارستان ، علامه طباطبایی،ندای کوثر،
ممتاز حنان ،تلاش،بهار علم آموزان، شوق پرواز، اوج و …
                </TextEffect>

                <TextEffect preset="blur" trigger={isVisible}>
 و آموزشگاه های  کنکور هدف ،ماهان، 
راه اندیشه، انرژی و …
                </TextEffect>

                <TextEffect preset="blur" trigger={isVisible}>
مدرس مدرسه آنلاین پرش
                </TextEffect>

                <TextEffect preset="blur" trigger={isVisible}>
مؤلف کتاب لقمه هندسه۳ مهر و ماه
مؤلف کتاب  فرموتست ریاضیات  تجربی (گاج)
                </TextEffect>

                <TextEffect preset="blur" trigger={isVisible}>
عضو انجمن ریاضیات ایران
                </TextEffect>

                <TextEffect preset="blur" trigger={isVisible}>
عضو دپارتمان ریاضیات تعاونی سنجش
                </TextEffect>

                <TextEffect preset="blur" trigger={isVisible}>
عضو دپارتمان ریاضیات کانون فرهنگی آموزش 
                </TextEffect>

                <TextEffect preset="blur" trigger={isVisible}>
نویسنده حوزه توسعه فردی در روزنامه ها و وبسایت های هنرمند ،خوب و …
                </TextEffect>
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
