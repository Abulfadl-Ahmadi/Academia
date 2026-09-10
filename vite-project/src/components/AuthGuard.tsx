import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Loader2, LockKeyhole } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

interface AuthGuardProps {
  /** Section name shown in the prompt, e.g. "آزمون‌ها". */
  section: string;
  /** Why this section needs an account, shown under the title. */
  description?: string;
  children: ReactNode;
}

/**
 * Gates a public section behind login. The panel screens reused by /exams,
 * /classes and /ai all read per-user data, so for a signed-out visitor they
 * would render as empty states (or a wall of failed-request toasts) instead of
 * saying what's actually wrong. This shows a sign-in prompt in their place.
 */
export default function AuthGuard({ section, description, children }: AuthGuardProps) {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">در حال بررسی حساب کاربری...</span>
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border bg-card p-8 text-center shadow-xs sm:p-10">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
          <LockKeyhole size={28} />
        </div>

        <h1 className="text-lg font-bold sm:text-xl">
          برای دسترسی به بخش «{section}» وارد شوید
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {description ?? `${section} به حساب کاربری شما وابسته است. برای مشاهده این بخش وارد حساب خود شوید یا ثبت‌نام کنید.`}
        </p>

        <div className="mt-7 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link to="/login" className={cn(buttonVariants({ size: "lg" }), "rounded-xl px-6")}>
            ورود به حساب
          </Link>
          <Link
            to="/register"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl px-6")}
          >
            ثبت‌نام
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          می‌توانید بدون ورود هم{" "}
          <Link to="/shop" className="font-medium text-primary hover:underline">
            فروشگاه
          </Link>{" "}
          و{" "}
          <Link to="/blog" className="font-medium text-primary hover:underline">
            وبلاگ
          </Link>{" "}
          را ببینید.
        </p>
      </div>
    </div>
  );
}
