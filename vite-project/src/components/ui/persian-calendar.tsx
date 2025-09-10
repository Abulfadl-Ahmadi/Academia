import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PersianCalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
}

// Helper functions for Persian calendar
const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const persianWeekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

function gregorianToPersian(gDate: Date): { year: number; month: number; day: number } {
  const gy = gDate.getFullYear();
  const gm = gDate.getMonth() + 1;
  const gd = gDate.getDate();
  
  let jy = gy <= 1600 ? 0 : 979;
  const gy2 = gy > 1600 ? gy - 1600 : gy - 621;
  const gm2 = gm > 2 ? gm + 1 : gm + 13;
  const a = Math.floor((gy2 * 365.25) + (gm2 * 30.6) + gd - 1);
  const b = Math.floor(a / 365.25);
  jy += 33 * Math.floor(b / 33);
  const b2 = b % 33;
  
  for (let i = 0; i < b2; i++) {
    if ((i % 4) === 0 && i !== 0) {
      jy += 366;
    } else {
      jy += 365;
    }
  }
  
  const jd = Math.floor(a % 365.25) + 1;
  let jm;
  
  if (jd <= 186) {
    jm = 1 + Math.floor(jd / 31);
  } else {
    jm = 7 + Math.floor((jd - 186) / 30);
  }
  
  const jd2 = jd <= 186 ? jd % 31 : (jd - 186) % 30;
  
  return { year: jy, month: jm, day: jd2 === 0 ? (jm <= 6 ? 31 : 30) : jd2 };
}

function persianToGregorian(jy: number, jm: number, jd: number): Date {
  const epyear = jy - 979;
  const epochday = 365 * epyear + Math.floor(epyear / 33) * 8 + Math.floor((epyear % 33 + 3) / 4);
  
  let monthday = 0;
  for (let i = 1; i < jm; i++) {
    if (i <= 6) {
      monthday += 31;
    } else {
      monthday += 30;
    }
  }
  
  const totaldays = epochday + monthday + jd;
  const gregorianDay = new Date(1979, 2, 22); // March 22, 1979 (Nowruz)
  gregorianDay.setDate(gregorianDay.getDate() + totaldays - 1);
  
  return gregorianDay;
}

function getDaysInPersianMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month < 12) return 30;
  // Check for leap year
  const leapYear = ((year - 979) % 33) % 4 === 1;
  return leapYear ? 30 : 29;
}

export function PersianCalendar({ selected, onSelect, className }: PersianCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(() => {
    const today = new Date();
    return gregorianToPersian(today);
  });

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12, day: 1 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1, day: 1 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const getDaysInMonth = () => {
    const daysInMonth = getDaysInPersianMonth(currentDate.year, currentDate.month);
    const firstDay = persianToGregorian(currentDate.year, currentDate.month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Adjust for Persian week (Saturday = 0)
    const adjustedFirstDay = firstDayOfWeek === 6 ? 0 : firstDayOfWeek + 1;
    
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const handleDayClick = (day: number) => {
    if (!day) return;
    
    const gregorianDate = persianToGregorian(currentDate.year, currentDate.month, day);
    onSelect?.(gregorianDate);
  };

  const isSelected = (day: number): boolean => {
    if (!day || !selected) return false;
    
    const gregorianDate = persianToGregorian(currentDate.year, currentDate.month, day);
    return gregorianDate.toDateString() === selected.toDateString();
  };

  const isToday = (day: number): boolean => {
    if (!day) return false;
    
    const today = new Date();
    const gregorianDate = persianToGregorian(currentDate.year, currentDate.month, day);
    return gregorianDate.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth();

  return (
    <div className={cn("p-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextMonth}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-sm font-semibold">
          {persianMonths[currentDate.month - 1]} {currentDate.year}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevMonth}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {persianWeekDays.map((day) => (
          <div
            key={day}
            className="h-8 w-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => handleDayClick(day!)}
            disabled={!day}
            className={cn(
              "h-8 w-8 text-xs rounded-md transition-colors",
              day
                ? "hover:bg-accent hover:text-accent-foreground"
                : "cursor-default",
              isSelected(day!)
                ? "bg-primary text-primary-foreground"
                : "",
              isToday(day!)
                ? "bg-accent text-accent-foreground font-bold ring-2 ring-primary ring-opacity-50"
                : ""
            )}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
