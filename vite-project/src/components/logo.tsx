import { BRAND } from "@/lib/constants";
import { LogoSvg } from "./LogoSvg";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export function Logo({ className, size = "xl", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto", 
    lg: "h-12 w-auto",
    xl: "h-16 w-auto"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-4xl"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="text-gray-900 dark:text-white">
        <LogoSvg 
          className={sizeClasses[size]}
          color="currentColor"
        />
      </div>
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]} text-gray-900 dark:text-white`}>
          {BRAND.name}
        </span>
      )}
    </div>
  );
}
