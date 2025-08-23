import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
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

export const StudentLayout = () => {
  const location = useLocation();
  const [courseTitle, setCourseTitle] = useState<string | null>(null);
  
  const segmentLabels: Record<string, string> = {
    profile: 'پروفایل',
    products: 'محصولات من',
    courses: 'دوره‌های من',
    transactions: 'تراکنش‌ها',
    support: 'پشتیبانی',
    'ask-ai': 'هوش مصنوعی'
  };

  // Generate dynamic breadcrumb based on current path
  const generateBreadcrumb = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // If we're at the root of the dashboard
    if (pathSegments.length === 1) {
      return (
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>داشبورد</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
    }
    
    return (
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/panel">داشبورد</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {pathSegments.map((segment, index) => {
          // Check if this is the last segment (current page)
          const isLastSegment = index === pathSegments.length - 1;
          
          // Check if segment is a dynamic parameter (starts with :)
          // const isDynamicSegment = segment.includes(':') || 
          //                         (segment.match(/^[0-9a-f]{8,}$/) !== null);
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
                  {segment === 'products' && 'محصولات من'}
                  {segment === 'courses' && 'دوره‌های من'}
                  {segment === 'transactions' && 'تراکنش‌ها'}
                  {segment === 'support' && 'پشتیبانی'}
                  {segment === 'ask-ai' && 'هوش مصنوعی'}
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
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
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
      console.log("Fetching course ID:", courseId);
      
      // Fetch course title
      const fetchCourseTitle = async () => {
        try {
          const response = await axiosInstance.get(`/courses/${courseId}/`);
          console.log("Course response:", response.data);
          setCourseTitle(response.data.title);
          console.log(courseTitle);
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
  }, [location.pathname, courseTitle]);

  return (
        <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
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
        <div className="p-5"><Outlet /></div>
      </SidebarInset>
    </SidebarProvider>
  );
};