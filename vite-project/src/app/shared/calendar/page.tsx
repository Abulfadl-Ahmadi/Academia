"use client";

import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { AxiosError } from "axios";
import { Badge } from "@/components/ui/badge";
import { Clock, User, CalendarDays } from "lucide-react";

interface CourseSchedule {
  id: number;
  course: {
    id: number;
    title: string;
    teacher: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
    };
  };
  day: number;
  day_display: string;
  time: string;
}

interface ApiScheduleResponse {
  id: number;
  course: number | {
    id: number;
    title: string;
    teacher: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
    };
  };
  day: number;
  day_display: string;
  time: string;
}

interface DayEvent {
  id: number;
  title: string;
  time: string;
  teacher: string;
  color: string;
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [schedules, setSchedules] = useState<CourseSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Color mapping for different courses
  const courseColors = [
    "bg-blue-50 border-blue-200 text-blue-800",
    "bg-green-50 border-green-200 text-green-800", 
    "bg-red-50 border-red-200 text-red-800",
    "bg-purple-50 border-purple-200 text-purple-800",
    "bg-yellow-50 border-yellow-200 text-yellow-800",
    "bg-pink-50 border-pink-200 text-pink-800",
    "bg-indigo-50 border-indigo-200 text-indigo-800",
  ];

  // Fetch course schedules from API
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await axiosInstance.get('/schedules/');
        
        // Handle both paginated and non-paginated responses
        const scheduleList = response.data.results || response.data;
        
        // Ensure we have the course details for each schedule
        const schedulesWithCourseDetails: CourseSchedule[] = await Promise.all(
          scheduleList.map(async (schedule: ApiScheduleResponse) => {
            if (typeof schedule.course === 'number') {
              // If course is just an ID, fetch the full course details
              try {
                const courseResponse = await axiosInstance.get(`/courses/${schedule.course}/`);
                return {
                  ...schedule,
                  course: courseResponse.data
                };
              } catch (err) {
                console.warn('خطا در دریافت جزئیات دوره:', err);
                // Fallback if course fetch fails
                return {
                  ...schedule,
                  course: {
                    id: schedule.course,
                    title: 'دوره نامشخص',
                    teacher: {
                      id: 0,
                      username: 'نامشخص',
                      first_name: '',
                      last_name: ''
                    }
                  }
                };
              }
            }
            return schedule as CourseSchedule;
          })
        );
        
        setSchedules(schedulesWithCourseDetails);
      } catch (err) {
        console.error('خطا در دریافت برنامه‌ها:', err);
        if ((err as AxiosError)?.response?.status === 401) {
          setError('لطفاً مجدداً وارد شوید');
        } else {
          setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  // Get events for a specific date
  const getEventsForDate = (date: Date): DayEvent[] => {
    if (!date) return [];
    const dayOfWeek = (date.getDay() + 1) % 7; // Convert to Persian week (0=Saturday)
    
    return schedules
      .filter(schedule => schedule.day === dayOfWeek)
      .map((schedule, index) => {
        const teacherName = schedule.course.teacher 
          ? `${schedule.course.teacher.first_name} ${schedule.course.teacher.last_name}`.trim() || schedule.course.teacher.username
          : 'استاد نامشخص';

        return {
          id: schedule.id,
          title: schedule.course.title,
          time: schedule.time,
          teacher: teacherName,
          color: courseColors[index % courseColors.length]
        };
      });
  };

  // Get event indicators for calendar dates
  const getEventIndicators = (date: Date) => {
    const events = getEventsForDate(date);
    return events.map((event) => {
      // Extract background color from the event color class
      const colorMap: { [key: string]: string } = {
        'bg-blue-50 border-blue-200 text-blue-800': 'bg-blue-500',
        'bg-green-50 border-green-200 text-green-800': 'bg-green-500',
        'bg-red-50 border-red-200 text-red-800': 'bg-red-500',
        'bg-purple-50 border-purple-200 text-purple-800': 'bg-purple-500',
        'bg-yellow-50 border-yellow-200 text-yellow-800': 'bg-yellow-500',
        'bg-pink-50 border-pink-200 text-pink-800': 'bg-pink-500',
        'bg-indigo-50 border-indigo-200 text-indigo-800': 'bg-indigo-500',
      };
      
      return {
        color: colorMap[event.color] || 'bg-gray-500',
        title: event.title
      };
    });
  };

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = () => {
    const events: Array<DayEvent & { date: Date }> = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayEvents = getEventsForDate(date);
      dayEvents.forEach(event => {
        events.push({ ...event, date });
      });
    }
    
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-2 md:p-4">
        <h1 className="text-xl md:text-2xl font-bold mb-4">تقویم برنامه‌ها</h1>
        <Card className="p-6 rounded-lg shadow-md">
          <div className="text-center py-8">در حال بارگذاری...</div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-2 md:p-4">
        <h1 className="text-xl md:text-2xl font-bold mb-4">تقویم برنامه‌ها</h1>
        <Card className="p-6 rounded-lg shadow-md">
          <div className="text-center py-8 text-red-500">{error}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
        <CalendarDays className="h-6 w-6" />
        تقویم برنامه‌ها
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          <Card className="p-3 md:p-6 rounded-lg shadow-md">
            {/* Calendar Legend */}
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                راهنمای تقویم
              </h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  </div>
                  <span>نقطه‌های رنگی نشان‌دهنده کلاس‌های هر روز</span>
                </div>
                <div>• هر نقطه یک کلاس • حداکثر ۴ نقطه نمایش داده می‌شود</div>
              </div>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border-0 w-full"
              weekStartsOn={6} // Saturday
              fixedWeeks
              classNames={{
                nav_button_previous: "absolute right-1",
                nav_button_next: "absolute left-1",
                day: "h-12 w-12 p-0 font-normal aria-selected:opacity-100 relative",
                cell: "h-12 w-12 text-center text-sm p-0 relative",
              }}
              components={{
                DayButton: ({ day, ...props }) => {
                  const indicators = getEventIndicators(day.date);
                  const isSelected = selectedDate?.toDateString() === day.date.toDateString();
                  const isToday = new Date().toDateString() === day.date.toDateString();
                  
                  return (
                    <button
                      {...props}
                      className={`
                        relative w-full h-12 p-1 text-center rounded-md 
                        hover:bg-accent hover:text-accent-foreground
                        transition-all duration-200
                        ${isSelected 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : isToday
                          ? 'bg-accent text-accent-foreground ring-2 ring-primary ring-opacity-50 font-bold'
                          : 'hover:bg-muted hover:scale-105'
                        }
                        ${day.outside ? 'text-muted-foreground opacity-50' : ''}
                      `}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className={`text-sm ${isToday ? 'font-bold' : 'font-medium'} mb-1`}>
                          {day.date.getDate()}
                        </span>
                        {indicators.length > 0 && (
                          <div className="flex gap-0.5 flex-wrap justify-center max-w-full">
                            {indicators.slice(0, 4).map((indicator, index) => (
                              <div
                                key={index}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  indicator.color.includes('blue') ? 'bg-blue-500' :
                                  indicator.color.includes('green') ? 'bg-green-500' :
                                  indicator.color.includes('red') ? 'bg-red-500' :
                                  indicator.color.includes('purple') ? 'bg-purple-500' :
                                  indicator.color.includes('yellow') ? 'bg-yellow-500' :
                                  indicator.color.includes('pink') ? 'bg-pink-500' :
                                  indicator.color.includes('indigo') ? 'bg-indigo-500' : 'bg-gray-500'
                                } ${isSelected ? 'opacity-100 shadow-sm' : 'opacity-80'}`}
                                title={indicator.title}
                              />
                            ))}
                            {indicators.length > 4 && (
                              <div
                                className={`w-1.5 h-1.5 rounded-full bg-gray-600 ${isSelected ? 'opacity-100' : 'opacity-80'}`}
                                title={`${indicators.length - 4} کلاس دیگر`}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                }
              }}
            />
          </Card>
        </div>

        {/* Events Section */}
        <div className="space-y-4">
          {/* Selected Date Events */}
          {selectedDate && (
            <Card className="p-3 md:p-4 rounded-lg shadow-md">
              <h3 className="text-base md:text-lg font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                برنامه‌های {selectedDate.toLocaleDateString('fa-IR')}
              </h3>
              
              {getEventsForDate(selectedDate).length === 0 ? (
                <p className="text-gray-500 text-sm">هیچ برنامه‌ای برای این روز وجود ندارد</p>
              ) : (
                <div className="space-y-2">
                  {getEventsForDate(selectedDate).map((event) => (
                    <div
                      key={event.id}
                      className={`p-2 md:p-3 rounded-lg border-r-4 ${event.color}`}
                    >
                      <h4 className="font-medium text-sm truncate">{event.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{event.time}</span>
                        <User className="h-3 w-3 mr-2" />
                        <span className="truncate">{event.teacher}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Upcoming Events */}
          <Card className="p-3 md:p-4 rounded-lg shadow-md">
            <h3 className="text-base md:text-lg font-medium mb-3">برنامه‌های آینده</h3>
            
            {getUpcomingEvents().length === 0 ? (
              <p className="text-gray-500 text-sm">هیچ برنامه‌ای برای هفته آینده وجود ندارد</p>
            ) : (
              <div className="space-y-2">
                {getUpcomingEvents().slice(0, 10).map((event, index) => (
                  <div
                    key={`${event.id}-${index}`}
                    className={`p-2 md:p-3 rounded-lg border-r-4 ${event.color}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-sm truncate flex-1">{event.title}</h4>
                      <Badge variant="outline" className="text-xs mr-2 flex-shrink-0">
                        {event.date.toLocaleDateString('fa-IR', { weekday: 'short', day: 'numeric' })}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{event.time}</span>
                      <User className="h-3 w-3 mr-2" />
                      <span className="truncate">{event.teacher}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}