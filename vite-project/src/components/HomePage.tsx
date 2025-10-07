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
  Loader2,
  Calendar,
  ArrowRight,
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

// API Interface for products/courses
interface Course {
  id: number;
  title: string;
  description: string;
  price: number | string;
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
  current_price?: number | string;
  product_type?: string;
  course?: number;
  // Physical product fields
  weight?: number;
  dimensions?: string;
  stock_quantity?: number;
  requires_shipping?: boolean;
  shipping_cost?: number | string;
}

// API Interface for blog posts
interface BlogPost {
  id: number;
  title: string;
  content?: string; // Make content optional since it might not always be available
  excerpt?: string;
  author?: {
    id: number;
    user?: {
      first_name: string;
      last_name: string;
    };
  };
  category?: {
    id: number;
    name: string;
  };
  tags?: string[];
  published_at: string;
  created_at: string;
  updated_at: string;
  image?: string;
  slug?: string;
  is_published?: boolean;
  views_count?: number;
}

// API Interface for gallery images
interface GalleryImage {
  id: number;
  title: string;
  description?: string;
  image: string;
  image_url?: string; // Added for API compatibility
  is_published: boolean;
  created_at: string;
  updated_at: string;
  order: number;
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
    product_type: "course",
  },
  {
    id: 2,
    title: "جزوه ریاضی یازدهم",
    description: "جزوه کامل ریاضی یازدهم با حل تمرین‌ها",
    price: 150000,
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
    students_count: 890,
    created_at: new Date().toISOString(),
    thumbnail: "https://c242950.parspack.net/c242950/media/portrait.png",
    product_type: "file",
  },
  {
    id: 3,
    title: "آزمون ریاضی کنکور",
    description: "مجموعه آزمون‌های ریاضی شبیه‌سازی شده کنکور",
    price: 80000,
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
    students_count: 650,
    created_at: new Date().toISOString(),
    thumbnail: "https://c242950.parspack.net/c242950/media/portrait.png",
    product_type: "test",
  },
];

// Mock data for blog posts (fallback)
const mockBlogPosts = [
  {
    id: 1,
    title: "راهکارهای مؤثر برای یادگیری ریاضی",
    content: "ریاضی یکی از مهم‌ترین دروس دوران تحصیل است که با روش‌های مناسب می‌توان در آن موفق شد...",
    excerpt: "روش‌های علمی و عملی برای بهبود یادگیری ریاضی و غلبه بر ترس از این درس",
    author: {
      id: 1,
      user: {
        first_name: "آرین",
        last_name: "تفضلی‌زاده",
      },
    },
    category: {
      id: 1,
      name: "آموزش",
    },
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    image: "https://c242950.parspack.net/c242950/media/portrait.png",
    slug: "effective-math-learning-methods",
    is_published: true,
    views_count: 1250,
  },
  {
    id: 2,
    title: "نکات مهم برای آمادگی کنکور ریاضی",
    content: "کنکور ریاضی نیازمند آمادگی ویژه و برنامه‌ریزی دقیق است. در این مقاله به نکات کلیدی می‌پردازیم...",
    excerpt: "راهنمای جامع برای آمادگی کنکور ریاضی با نکات عملی و استراتژی‌های مؤثر",
    author: {
      id: 1,
      user: {
        first_name: "آرین",
        last_name: "تفضلی‌زاده",
      },
    },
    category: {
      id: 2,
      name: "کنکور",
    },
    published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    image: "https://c242950.parspack.net/c242950/media/portrait.png",
    slug: "math-exam-preparation-tips",
    is_published: true,
    views_count: 2180,
  },
  {
    id: 3,
    title: "اهمیت هندسه در ریاضیات",
    content: "هندسه یکی از شاخه‌های مهم ریاضی است که کاربردهای فراوانی در زندگی روزمره دارد...",
    excerpt: "بررسی جایگاه و اهمیت هندسه در ریاضیات و زندگی روزمره",
    author: {
      id: 1,
      user: {
        first_name: "آرین",
        last_name: "تفضلی‌زاده",
      },
    },
    category: {
      id: 3,
      name: "هندسه",
    },
    published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    image: "https://c242950.parspack.net/c242950/media/portrait.png",
    slug: "importance-of-geometry-in-mathematics",
    is_published: true,
    views_count: 890,
  },
];

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [blogLoading, setBlogLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blogError, setBlogError] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
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

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Fetch all products from shop API
        const response = await axiosInstance.get("/shop/products/");
        
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
        
        // Sort by popularity (students_count) and take top 3
        const popularProducts = productsData
          .filter((product: any) => product.is_active !== false) // Only active products
          .sort((a: any, b: any) => (b.students_count || 0) - (a.students_count || 0))
          .slice(0, 3);
        
        setCourses(popularProducts);
        setError(null);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("خطا در بارگیری محصولات");
        // Use mock data as fallback
        setCourses(mockCourses.slice(0, 3));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch blog posts from API
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setBlogLoading(true);
        
        // Fetch recent blog posts
        const response = await axiosInstance.get("/blog/posts/");
        
        // Handle both array and pagination format
        let postsData = [];
        if (Array.isArray(response.data)) {
          postsData = response.data;
        } else if (response.data && Array.isArray(response.data.results)) {
          postsData = response.data.results;
        } else {
          console.warn("Blog posts data is not an array:", response.data);
          postsData = [];
        }
        
        // Filter published posts, sort by date and take top 3
        const recentPosts = postsData
          .filter((post: any) => post.is_published !== false) // Only published posts
          .sort((a: any, b: any) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime())
          .slice(0, 3);
        
        setBlogPosts(recentPosts);
        setBlogError(null);
      } catch (err) {
        console.error("Error fetching blog posts:", err);
        setBlogError("خطا در بارگیری پست‌های وبلاگ");
        // Use mock data as fallback
        setBlogPosts(mockBlogPosts.slice(0, 3));
      } finally {
        setBlogLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  // Fetch gallery images from API
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setGalleryLoading(true);
        
        // Fetch published gallery images
        const response = await axiosInstance.get("/gallery/images/");
        
        // Handle both array and pagination format
        let imagesData = [];
        if (Array.isArray(response.data)) {
          imagesData = response.data;
        } else if (response.data && Array.isArray(response.data.results)) {
          imagesData = response.data.results;
        } else {
          console.warn("Gallery images data is not an array:", response.data);
          imagesData = [];
        }
        
        // Filter published images and sort by order
        const publishedImages = imagesData
          .filter((image: any) => image.is_published !== false)
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        
        setGalleryImages(publishedImages);
        setGalleryError(null);
      } catch (err) {
        console.error("Error fetching gallery images:", err);
        setGalleryError("خطا در بارگیری تصاویر گالری");
        // Set empty array on error since we don't have mock data for gallery
        setGalleryImages([]);
      } finally {
        setGalleryLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);
  // Helper function to format date for blog posts
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) {
      return 'تاریخ نامشخص';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'تاریخ نامعتبر';
      }
      return new Intl.DateTimeFormat("fa-IR", {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'تاریخ نامعتبر';
    }
  };

  // Helper function to get reading time estimate
  const getReadingTime = (content: string | undefined) => {
    if (!content || typeof content !== 'string') {
      return '۱ دقیقه مطالعه'; // Default reading time
    }
    const wordsPerMinute = 200; // Average reading speed in Persian
    const wordCount = content.split(' ').length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readingTime} دقیقه مطالعه`;
  };

  // Helper function to get product type badge
  const getProductTypeBadge = (course: Course) => {
    const productType = course.product_type;
    switch (productType) {
      case 'course':
        return 'دوره آموزشی';
      case 'file':
        return 'فایل/جزوه';
      case 'test':
        return 'آزمون';
      case 'book':
        return 'کتاب';
      case 'notebook':
        return 'دفتر';
      case 'pamphlet':
        return 'جزوه';
      case 'stationery':
        return 'لوازم تحریر';
      default:
        return 'محصول';
    }
  };

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
    // Ensure we have a clean number by parsing it
    const cleanPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d.-]/g, '')) : Number(price);
    return new Intl.NumberFormat("fa-IR").format(isNaN(cleanPrice) ? 0 : cleanPrice);
  };

  return (
    <div className="min-h-screen w-full my-10">
      {/* Countdown Section */}
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
            </div>
          </div>
        </div>
      </section>

      <LogoCloud />

      {/* Featured Products Section */}
      <section className="2xl:px-[10%] py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              محصولات آموزشی پرطرفدار
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              ۳ محصول پرطرفدار: دوره‌ها، جزوه‌ها، کتاب‌ها و آزمون‌های آموزشی
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20" dir="ltr">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="mr-2 text-lg text-gray-600 dark:text-gray-300">
                در حال بارگیری محصولات...
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
                                {getProductTypeBadge(course)}
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
                                {course.product_type === 'course' ? 'دانشجو' : 'خریدار'}
                              </div>
                              <div className="flex items-center gap-1">
                                {course.product_type === 'course' ? (
                                  <>
                                    <Clock className="h-4 w-4" />
                                    {course.sessions_count
                                      ? `${course.sessions_count} جلسه`
                                      : "در حال تکمیل"}
                                  </>
                                ) : course.requires_shipping ? (
                                  <>
                                    <Clock className="h-4 w-4" />
                                    موجودی: {course.stock_quantity && course.stock_quantity > 0 ? course.stock_quantity : 'ناموجود'}
                                  </>
                                ) : (
                                  <>
                                    <BookOpen className="h-4 w-4" />
                                    دانلود فوری
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-2xl font-bold text-green-600">
                                  {formatPrice(course)} تومان
                                </span>
                                {/* {course.shipping_cost && course.shipping_cost > 0 && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    + {new Intl.NumberFormat("fa-IR").format(Number(course.shipping_cost))} تومان ارسال
                                  </div>
                                )} */}
                              </div>
                              <Button
                                size="sm"
                                onClick={() =>
                                  window.location.href = `/shop/${course.id}`
                                }
                              >
                                {course.product_type === 'course' ? 'مشاهده دوره' : 'خرید محصول'}
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
              onClick={() => window.location.href = "/shop"}
            >
              مشاهده همه محصولات در فروشگاه
            </Button>
          </div>
        </div>
      </section>

      {/* Recent Blog Posts Section */}
      <section className="2xl:px-[10%] py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              آخرین مقالات وبلاگ
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              مطالب آموزشی و راهنمایی‌های مفید برای بهبود یادگیری ریاضی
            </p>
          </div>

          {blogLoading ? (
            <div className="flex justify-center items-center py-20" dir="ltr">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="mr-2 text-lg text-gray-600 dark:text-gray-300">
                در حال بارگیری مقالات...
              </span>
            </div>
          ) : blogError ? (
            <div className="text-center py-20">
              <div className="text-red-600 mb-4">{blogError}</div>
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
                  {blogPosts.map((post) => (
                    <CarouselItem
                      key={post.id}
                      className="pl-1 md:basis-1/2 lg:basis-1/3"
                    >
                      <div className="p-1" dir="rtl">
                        <Card
                          key={post.id}
                          className="group hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                          <div className="relative">
                            {post.image ? (
                              <div className="aspect-video overflow-hidden">
                                <img
                                  src={post.image}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            ) : (
                              <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 flex items-center justify-center">
                                <BookOpen className="h-12 w-12 text-green-600 dark:text-green-400" />
                              </div>
                            )}
                            {post.category && (
                              <Badge className="absolute top-3 right-3" variant="secondary">
                                {post.category.name}
                              </Badge>
                            )}
                          </div>

                          <CardHeader>
                            <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(post.published_at || post.created_at)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getReadingTime(post.content)}
                              </div>
                            </div>
                            <CardTitle className="text-xl group-hover:text-green-600 transition-colors line-clamp-2">
                              {post.title}
                            </CardTitle>
                            <CardDescription className="text-sm leading-relaxed line-clamp-3">
                              {post.excerpt || (post.content ? post.content.substring(0, 150) + "..." : "خلاصه‌ای در دسترس نیست")}
                            </CardDescription>
                          </CardHeader>

                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {post.author && post.author.user && (
                                  <span>
                                    {post.author.user.first_name} {post.author.user.last_name}
                                  </span>
                                )}
                                {post.views_count && (
                                  <span>
                                    • {post.views_count.toLocaleString("fa-IR")} بازدید
                                  </span>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  window.location.href = `/blog/${post.slug || post.id}`
                                }
                              >
                                ادامه مطلب
                                <ArrowRight className="h-4 w-4 mr-1" />
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
              onClick={() => window.location.href = "/blog"}
            >
              مشاهده همه مقالات وبلاگ
            </Button>
          </div>
        </div>
      </section>

      {/* Photo Gallery Section */}
      <section className="2xl:px-[10%] py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              گالری تصاویر
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              تصاویری از فعالیت‌ها، کلاس‌ها و لحظات آموزشی
            </p>
          </div>

          {galleryLoading ? (
            <div className="flex justify-center items-center py-20" dir="ltr">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="mr-2 text-lg text-gray-600 dark:text-gray-300">
                در حال بارگیری تصاویر...
              </span>
            </div>
          ) : galleryError ? (
            <div className="text-center py-20">
              <div className="text-red-600 mb-4">{galleryError}</div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                تلاش مجدد
              </Button>
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="text-center py-20">
              <p>
                تصویری در گالری موجود نیست
              </p>
            </div>
          ) : (
            <div className="flex flex-row gap-6">
              {galleryImages.map((image) => (
                // <Card key={image.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={image.image_url || image.image}
                      alt={image.title}
                      className="w-auto h-74 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                  </div>
                  // {(image.title || image.description) && (
                  //   <CardContent className="p-4">
                  //     {image.title && (
                  //       <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                  //         {image.title}
                  //       </h3>
                  //     )}
                  //     {image.description && (
                  //       <p className="text-xs text-muted-foreground line-clamp-2">
                  //         {image.description}
                  //       </p>
                  //     )}
                  //   </CardContent>
                  // )}
                // </Card>
              ))}
            </div>
          )}
        </div>
      </section>

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
          </div>
        </div>
      </section>
    </div>
  );
}