import { BRAND } from "@/lib/constants";
import { ATLogo } from "./ATLogo";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-4xl"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="text-gray-900 dark:text-white">
        <ATLogo 
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
