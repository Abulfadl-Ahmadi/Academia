import { Link } from "react-router-dom";
import { Calculator, Percent } from "lucide-react";

export function FloatingGradeCalculator() {
  return (
    <Link
      to="/grade-calculator"
      dir="ltr"
      className="group fixed bottom-6 left-6 z-50 flex items-center"
      aria-label="محاسبه‌گر درصد"
    >
      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-300 group-hover:scale-105">
        <Calculator className="h-6 w-6" />
        <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-primary shadow ring-1 ring-border">
          <Percent className="h-3 w-3" />
        </span>
      </span>
      <span className="mr-0 max-w-0 overflow-hidden whitespace-nowrap rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 group-hover:mr-2 group-hover:max-w-40 group-hover:px-4 group-hover:py-3">
        <span dir="rtl" className="text-sm font-medium">
          محاسبه‌گر درصد
        </span>
      </span>
    </Link>
  );
}
