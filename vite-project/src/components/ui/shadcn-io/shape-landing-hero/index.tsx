"use client";

import {
  Bot,
  ClipboardList,
  MonitorPlay,
  ShoppingBag,
  Video,
  Wand2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import Prism from "@/components/backgrounds/Prism";
import { FeatureCarousel, type FeatureCard } from "@/components/ui/feature-carousel";

/**
 * Hues step evenly from indigo to rose, matching the Prism backdrop, so the
 * deck reads as that same light dispersed into cards.
 */
const heroFeatures: FeatureCard[] = [
  {
    title: "کلاس آنلاین زنده",
    description: "کلاس‌های تعاملی با ارتباط مستقیم استاد و دانش‌آموز.",
    icon: Video,
    href: "/classes",
    hue: 268,
  },
  {
    title: "دوره‌های آفلاین",
    description: "دسترسی همیشگی به ویدیوهای ضبط‌شده هر جلسه.",
    icon: MonitorPlay,
    href: "/classes/courses",
    hue: 286,
  },
  {
    title: "آزمون آنلاین سراسری",
    description: "آزمون‌های استاندارد همراه با کارنامه و تحلیل نتیجه.",
    icon: ClipboardList,
    href: "/exams/test-collections",
    hue: 304,
  },
  {
    title: "آزمون‌ساز دانش‌آموزی",
    description: "ساخت آزمون اختصاصی از بانک سوال، متناسب با نیاز خودت.",
    icon: Wand2,
    href: "/exams/test-maker",
    hue: 322,
  },
  {
    title: "هوش مصنوعی آموزشی",
    description: "پاسخ لحظه‌ای به سوال‌های درسی، هر ساعتی از شبانه‌روز.",
    icon: Bot,
    href: "/panel/support/ask-ai",
    hue: 340,
  },
  {
    title: "فروشگاه اینترنتی",
    description: "تهیه دوره‌ها، جزوه‌ها و مجموعه آزمون‌ها در یک جا.",
    icon: ShoppingBag,
    href: "/shop",
    hue: 358,
  },
];

type HeroGeometricProps = {
  title1?: string;
  title2?: string;
  title3?: string;
  description?: string;
  className?: string;
};

export function HeroGeometric({
  title1 = "به آکادمی ",
  title2 = "آرین تفضلی‌زاده",
  title3 = "خوش آمدید",
  description = "آموزش حرفه‌ای ریاضیات برای رشته‌های ریاضی و تجربی.",
  className,
}: HeroGeometricProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full flex-col overflow-hidden",
        className
      )}
    >
      {/* Prism background, confined to this section */}
      <div className="absolute inset-0">
        <Prism
          height={3.5}
          baseWidth={5.5}
          animationType="3drotate"
          glow={1}
          noise={0.2}
          transparent
          scale={1.9}
          // At scale 1.9 the pyramid's apex maps to almost exactly the top edge of
          // the canvas (apex 2.625 vs. edge 5/scale = 2.632), so its glow would be
          // hard-clipped by the canvas bounds. Shift the render down to leave
          // headroom above the apex and let the glow fade out naturally.
          offset={{ x: 0, y: -110 }}
          hueShift={0}
          colorFrequency={1.6}
          bloom={0.9}
          // Drives the tumble speed in 3drotate mode. hoverStrength/inertia are
          // deliberately absent — they only apply to animationType="hover".
          timeScale={0.35}
        />
      </div>

      {/* Fade the section into the page background at the bottom, so scrolling past it
          transitions smoothly instead of the effect appearing to persist. */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      {/* Headline takes the space above the deck and centres in whatever is
          left, so it stays put as the viewport height changes. */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pt-24">
        <div className="max-w-3xl text-center">
          <h1 className="mb-5 text-[2rem] font-bold leading-[1.15] tracking-tight sm:text-[2.625rem] md:mb-7 md:text-[4.2rem]">
            <span className="bg-gradient-to-b from-foreground to-foreground/80 bg-clip-text text-transparent">
              {title1}
            </span>
            <br />
            <span
              className={cn(
                "bg-clip-text text-transparent bg-gradient-to-r",
                "from-indigo-500 via-foreground/90 to-rose-500",
                "dark:from-indigo-300 dark:via-white/90 dark:to-rose-300"
              )}
            >
              {title2}
              <br />
              {title3}
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-[0.85rem] font-light leading-relaxed tracking-wide text-muted-foreground sm:text-[0.79rem] md:text-[0.875rem]">
            {description}
          </p>
        </div>
      </div>

      {/* No entrance animation gating visibility here: an animation that stalls
          would leave the deck invisible. Its own transitions carry the motion. */}
      <div className="relative z-10 w-full shrink-0 pb-24 sm:pb-12">
        <FeatureCarousel items={heroFeatures} />
      </div>
    </div>
  );
}

export type { HeroGeometricProps };
