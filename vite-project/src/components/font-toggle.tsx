import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFont } from "@/context/FontContext";

export function FontToggle() {
  const { fontFamily, setFontFamily } = useFont();

  const fontFamilies = [
    { name: 'ایران سنس', value: 'IRANSansX' as const },
    { name: 'راوی', value: 'Ravi' as const },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Type className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">انتخاب فونت</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          انتخاب فونت
        </div>
        {fontFamilies.map((fontOption) => (
          <DropdownMenuItem
            key={fontOption.value}
            onClick={() => setFontFamily(fontOption.value)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span style={{ fontFamily: fontOption.value === 'IRANSansX' ? 'IRANSansX' : 'Ravi' }}>
              {fontOption.name}
            </span>
            {fontFamily === fontOption.value && (
              <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}