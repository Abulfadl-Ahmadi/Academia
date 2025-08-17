import { Moon, Sun, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { toggleTheme, accentColor, setAccentColor } = useTheme();

  const accentColors = [
    { name: 'آبی', value: 'blue' as const, color: 'bg-blue-500' },
    { name: 'سبز', value: 'green' as const, color: 'bg-green-500' },
    { name: 'بنفش', value: 'purple' as const, color: 'bg-purple-500' },
    { name: 'قرمز', value: 'red' as const, color: 'bg-red-500' },
    { name: 'نارنجی', value: 'orange' as const, color: 'bg-orange-500' },
    { name: 'فیروزه‌ای', value: 'teal' as const, color: 'bg-teal-500' },
    { name: 'صورتی', value: 'pink' as const, color: 'bg-pink-500' },
    { name: 'نیلی', value: 'indigo' as const, color: 'bg-indigo-500' },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Theme Toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="h-9 w-9"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">تغییر تم</span>
      </Button>

      {/* Accent Color Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <Palette className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">انتخاب رنگ</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            انتخاب رنگ
          </div>
          {accentColors.map((colorOption) => (
            <DropdownMenuItem
              key={colorOption.value}
              onClick={() => setAccentColor(colorOption.value)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className={`w-4 h-4 rounded-full ${colorOption.color}`} />
              <span>{colorOption.name}</span>
              {accentColor === colorOption.value && (
                <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
