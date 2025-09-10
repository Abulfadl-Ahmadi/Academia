import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TeacherSidebar } from "@/components/teacher-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import axiosInstance from "@/lib/axios";

export const TeacherLayout = () => {
  const location = useLocation();
  const [courseTitle, setCourseTitle] = useState<string | null>(null);


  const segmentLabels: Record<string, string> = {
    profile: 'پروفایل',
    students: 'دانش‌آموزان',
    courses: 'دوره‌ها',
    files: 'فایل‌ها',
    videos: 'ویدیوها',
    tests: 'آزمون‌ها',
    'topic-tests': 'آزمون‌های مبحثی',
    transactions: 'تراکنش‌ها'
  };
  
  // Generate dynamic breadcrumb based on current path
  const generateBreadcrumb = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // If we're at the root of the dashboard
    if (pathSegments.length === 1) {
      return (
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>پنل معلم</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
    }
    
    return (
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/panel">پنل معلم</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {pathSegments.map((segment, index) => {
          // Check if this is the last segment (current page)
          const isLastSegment = index === pathSegments.length - 1;
          
          // Check if segment is a dynamic parameter (starts with :)
          const isDynamicSegment = segment.includes(':') || 
                         /^\d+$/.test(segment) || 
                         /^[0-9a-f]{8,}$/.test(segment);
          
          // Skip rendering dynamic segments in the middle of the path
          if (isDynamicSegment && !isLastSegment) return null;
          
          // For the last segment (current page)
          if (isLastSegment) {
            return (
              <BreadcrumbItem key={index}>
                <BreadcrumbPage>
                  {segment === 'profile' && 'پروفایل'}
                  {segment === 'students' && 'دانش‌آموزان'}
                  {segment === 'courses' && 'دوره‌ها'}
                  {segment === 'files' && 'فایل‌ها'}
                  {segment === 'videos' && 'ویدیوها'}
                  {segment === 'tests' && 'آزمون‌ها'}
                  {segment === 'topic-tests' && 'آزمون‌های مبحثی'}
                  {segment === 'create' && 'ایجاد آزمون'}
                  {segment === 'transactions' && 'تراکنش‌ها'}
                  {segment === 'sessions' && 'جلسات'}
                  {segment === 'create' && pathSegments[pathSegments.length - 2] === 'courses' && 'ایجاد دوره جدید'}
                  {isDynamicSegment && courseTitle ? courseTitle : ''}
                </BreadcrumbPage>
              </BreadcrumbItem>
            );
          }
          
          // For intermediate segments (navigation links)
          const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
          const label = segmentLabels[segment];
          if (!label) return null;
          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                <BreadcrumbLink href={href}>
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    );
  };

  // Fetch course title when on a course detail page
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // Check if we're on a course detail page (e.g., /panel/courses/6)
    if (pathSegments.length >= 3 && 
        pathSegments[1] === 'courses' && 
        // pathSegments[2] && 
        pathSegments[2].match(/^\d+$/)) {
      
      const courseId = pathSegments[2];
      
      // Fetch course title
      const fetchCourseTitle = async () => {
        try {
          const response = await axiosInstance.get(`/courses/${courseId}/`);
          setCourseTitle(response.data.title);
        } catch (error) {
          console.error('Error fetching course title:', error);
          setCourseTitle(null);
        }
      };
      
      fetchCourseTitle();
    } else {
      // Reset course title when not on a course detail page
      setCourseTitle(null);
    }
  }, [location.pathname]);

  return (
    <SidebarProvider>
      <TeacherSidebar />
      <SidebarInset className="flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-30 bg-inherit flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            {generateBreadcrumb()}  
          </Breadcrumb>
        </header>
        <div className="p-5 min-w-0 overflow-hidden flex-1"><Outlet /></div>
      </SidebarInset>
    </SidebarProvider>
  );
};