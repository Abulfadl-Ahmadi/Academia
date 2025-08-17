// "use client"

import * as React from "react"
import {
  AudioWaveform,
  House,
  CalendarDays,
  Command,
  Box,
  GalleryVerticalEnd,
  TvMinimalPlay,
  ShoppingCart,
  FileText,
  BookOpenCheck,
} from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { useUser } from "@/context/UserContext"

// This is sample data.

const data = {
  user: {
    name: "ابوالفضل",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "کلاس‌های من",
      url: "/panel/courses",
      icon: TvMinimalPlay,
      items: [
        {
          title: "لیست همه دوره‌ها",
          url: "/panel/courses",
        },
        {
          title: "سالیانه",
          url: "#",
        },
        {
          title: "امتحان نهایی",
          url: "#",
        },
        {
          title: "نکته و تست",
          url: "#",
        },
      ],
    },
    {
      title: "آزمون‌های من",
      url: "/panel/tests",
      icon: BookOpenCheck,
      items: [
        {
          title: "لیست آزمون‌ها",
          url: "/panel/tests",
        },
        {
          title: "نتایج آزمون‌ها",
          url: "/panel/tests",
        },
      ],
    },
    {
      title: "فایل‌های من",
      url: "/panel/products",
      icon: FileText,
      items: [
        {
          title: "جزوه‌ها",
          url: "/panel/products",
        },
        {
          title: "کتاب‌ها",
          url: "/panel/products",
        }
      ],
    },
    {
      title: "فروشگاه",
      url: "/shop",
      icon: ShoppingCart,
      items: [
        {
          title: "محصولات",
          url: "/shop",
        },
        {
          title: "سبد خرید",
          url: "/shop",
        },
      ],
    },
  ],
  projects: [
    {
      name: "تقویم برنامه‌ها",
      url: "#",
      icon: CalendarDays,
    },
  ],
    home: [
    {
      name: "خانه",
      url: "/panel",
      icon: House,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, loading } = useUser()
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
                <span className="truncate font-medium text-lg text-right">پنل دانش‌آموز</span>
              </div>
              {/* <ChevronsUpDown className="ml-auto" /> */}
            </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={data.home} />
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>

 {loading ? (
    <div className="px-4 py-2 text-muted-foreground text-sm">در حال بارگذاری...</div>
  ) : !user ? (
    <div className="px-4 py-2 text-muted-foreground text-sm">وارد نشده‌اید</div>
  ) : (
    <NavUser
      user={{
        username: user.username,
        email: user.email,
        // avatar: user.avatar || "/avatars/default.jpg",
        avatar: "/avatars/default.jpg",
      }}
    />
  )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
