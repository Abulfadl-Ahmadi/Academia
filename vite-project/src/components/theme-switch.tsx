import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/context/ThemeContext";

export function ThemeSwitch() {
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === "dark";

  return (
    <label dir="ltr" className="flex items-center gap-1.5 cursor-pointer select-none">
      <span className="sr-only">تغییر به حالت {isDark ? "روشن" : "تیره"}</span>
      <Sun className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => toggleTheme(checked ? "dark" : "light")}
        aria-label="تغییر حالت روشن و تیره"
      />
      <Moon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </label>
  );
}
