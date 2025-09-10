// "use client"

import * as React from "react";
import {
  House,
  CalendarDays,
  Library,
  Box,
  TvMinimalPlay,
  CreditCard,
  ShoppingCart,
  LifeBuoy,
  Bot,
  Target,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent, 
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useUser } from "@/context/UserContext";
import axiosInstance from "@/lib/axios";

export function TeacherSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user, loading } = useUser();
  const [categories, setCategories] = React.useState<{ id: number; name: string }[]>(
    []
  );

  React.useEffect(() => {
    axiosInstance.get("/course-catagory/") // آدرس API بک‌اند
      .then((res) => res.data)
      .then((data) => {
        // اطمینان از اینکه data یک آرایه است
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.warn("Categories data is not an array:", data);
          setCategories([]);
        }
      })
      .catch((err) => {
        console.error("خطا در گرفتن دسته‌بندی‌ها:", err);
        setCategories([]); // در صورت خطا، آرایه خالی قرار دهیم
      });
  }, []);

  const data = {
    navMain: [
      {
        title: "کلاس‌ها",
        url: "/panel/courses",
        icon: TvMinimalPlay,
        isActive: true,
        items: [
          {
            title: "همه کلاس‌ها",
            url: "/panel/courses",
          },
          ...(Array.isArray(categories) ? categories.map((cat) => ({
            title: cat.name,
            url: `/panel/courses?category=${cat.id}`, // می‌تونی فیلتر بزنی
          })) : []),
        ],
      },
      {
        title: "مدیریت فروشگاه",
        url: "/panel/products",
        icon: ShoppingCart,
        items: [
          {
            title: "لیست محصولات",
            url: "/panel/products",
          },
          {
            title: "ایجاد محصول جدید",
            url: "/panel/products/create",
          },
        ],
      },
      {
        title: "مجموعه آزمون‌ها",
        url: "/panel/test-collections",
        icon: Box,
        items: [
          {
            title: "لیست مجموعه آزمون‌ها",
            url: "/panel/test-collections",
          },
          {
            title: "ایجاد مجموعه آزمون",
            url: "/panel/test-collections/new",
          },
          {
            title: "آمار و گزارشات",
            url: "/panel/test-collections",
            description: "مشاهده آمار آزمون‌های موجود در هر مجموعه"
          },
        ],
      },
      {
        title: "آزمون‌های مبحثی",
        url: "/panel/topic-tests",
        icon: Target,
        items: [
          {
            title: "لیست آزمون‌های مبحثی",
            url: "/panel/topic-tests",
          },
          {
            title: "ایجاد آزمون مبحثی",
            url: "/panel/topic-tests",
            description: "آزمون‌های آزاد مرتبط با مباحث درخت دانش"
          },
        ],
      },
      {
        title: "فایل‌ها",
        url: "/panel/files",
        icon: Library,
        items: [
          {
            title: "جزوه‌ها",
            url: "/panel/files",
          },
          {
            title: "آپلود فایل",
            url: "/panel/files/upload",
          },
        ],
      },
      {
        title: "مدیریت مالی",
        url: "/panel/transactions",
        icon: CreditCard,
        items: [
          {
            title: "ثبت تراکنش جدید",
            url: "/panel/transactions/new",
          },
          {
            title: "لیست تراکنش‌ها",
            url: "/panel/transactions",
          },
        ],
      },
      {
        title: "پشتیبانی و تیکت‌ها",
        url: "/panel/support",
        icon: LifeBuoy,
        items: [
          {
            title: "لیست تیکت‌ها",
            url: "/panel/support",
            description: "مشاهده و رسیدگی به تیکت‌های دانش‌آموزان"
          },
          {
            title: "پاسخ خودکار (هوش مصنوعی)",
            url: "/panel/support/ask-ai",
            description: "مشاوره با هوش مصنوعی"
          },
        ],
      },
    ],
    projects: [
      {
        name: "تقویم برنامه‌ها",
        url: "/panel/calendar",
        icon: CalendarDays,
      },
    ],
    home: [
      {
        name: "خانه",
        url: "/panel",
        icon: House,
      }
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
        {/* <div className="p-2 text-lg font-medium flex gap-2">
          <Box />
          <SidebarGroupLabel className="text-lg font-medium text-black">Platform</SidebarGroupLabel>
        </div> */}
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <Box className="font-medium" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium text-lg text-right">
              پنل مدیریت
            </span>
          </div>
          {/* <ChevronsUpDown className="ml-auto" /> */}
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={data.home || []} />
        <NavMain items={data.navMain || []} />
        <NavProjects projects={data.projects || []} />
      </SidebarContent>
      <SidebarFooter>
        {loading ? (
          <div className="px-4 py-2 text-muted-foreground text-sm">
            در حال بارگذاری...
          </div>
        ) : !user ? (
          <div className="px-4 py-2 text-muted-foreground text-sm">
            وارد نشده‌اید
          </div>
        ) : (
          <NavUser
            user={{
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              avatar: "/avatars/default.jpg",
            }}
          />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
