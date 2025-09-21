"use client";

import { motion } from "framer-motion";
// import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlidingNumber } from "../components/motion-primitives/sliding-number";
import { useEffect, useMemo, useState } from "react";
import { LogoSvg } from "./components/LogoSvg";

type ElegantShapeProps = {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
};

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-foreground/[0.08]",
}: ElegantShapeProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -150,
        rotate: rotate - 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{
          y: [0, 15, 0],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{
          width,
          height,
        }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-foreground/[0.15]",
            "shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1),transparent_70%)]",
            "dark:after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
          )}
        />
      </motion.div>
    </motion.div>
  );
}

type HeroGeometricProps = {
  badge?: string;
  title1?: string;
  title2?: string;
  description?: string;
  className?: string;
};

export function HomeHome({
  // badge = "shadcn.io",
  title1 = "Elevate Your Digital Vision",
  title2 = "Crafting Exceptional Websites",
  description = "Crafting exceptional digital experiences through innovative design and cutting-edge technology.",
  className,
}: HeroGeometricProps) {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1] as const,
      },
    }),
  };

  const targetDate = useMemo(() => new Date("2025-10-07T20:00:00"), []);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = Math.max(0, targetDate.getTime() - now.getTime());

      // Calculate days, hours, minutes, seconds
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setDays(days);
      setHours(hours);
      setMinutes(minutes);
      setSeconds(seconds);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div
      className={cn(
        "relative min-h-screen w-full flex items-center justify-center overflow-hidden",
        className
      )}
    >
      {/* Adaptive background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-rose-500/[0.03] dark:from-indigo-500/[0.08] dark:via-transparent dark:to-rose-500/[0.08] blur-3xl" />

      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-indigo-500/[0.08] dark:from-indigo-500/[0.15]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />

        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-rose-500/[0.08] dark:from-rose-500/[0.15]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />

        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-violet-500/[0.08] dark:from-violet-500/[0.15]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />

        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-amber-500/[0.08] dark:from-amber-500/[0.15]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />

        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-cyan-500/[0.08] dark:from-cyan-500/[0.15]"
          className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/[0.03] border border-foreground/[0.08] mb-8 md:mb-12"
          >
            <Circle className="h-2 w-2 fill-rose-500/80" />
            <span className="text-sm text-muted-foreground tracking-wide">
              {badge}
            </span>
          </motion.div> */}

          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            {/* <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 md:mb-8 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/80">
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
              </span>
            </h1> */}
            <div
              className="flex flex-col items-center gap-6 relative z-10"
              dir="ltr"
            >
              <LogoSvg className="h-48 pb-5 w-auto" />

              <div className="flex items-center gap-4 sm:gap-6 font-mono">
                <div className="flex flex-col items-center">
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                    <SlidingNumber value={days} padStart={true} />
                  </div>
                  <span className="font-sans text-xs sm:text-sm mt-2 text-gray-600 dark:text-gray-300">
                    روز
                  </span>
                </div>
                <span className="text-zinc-500 text-4xl sm:text-5xl lg:text-6xl mb-4">
                  :
                </span>
                <div className="flex flex-col items-center">
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                    <SlidingNumber value={hours} padStart={true} />
                  </div>
                  <span className="font-sans text-xs sm:text-sm mt-2 text-gray-600 dark:text-gray-300">
                    ساعت
                  </span>
                </div>
                <span className="text-zinc-500 text-4xl sm:text-5xl lg:text-6xl mb-4">
                  :
                </span>
                <div className="flex flex-col items-center">
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                    <SlidingNumber value={minutes} padStart={true} />
                  </div>
                  <span className="font-sans text-xs sm:text-sm mt-2 text-gray-600 dark:text-gray-300">
                    دقیقه
                  </span>
                </div>
                <span className="text-zinc-500 text-4xl sm:text-5xl lg:text-6xl mb-4">
                  :
                </span>
                <div className="flex flex-col items-center">
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                    <SlidingNumber value={seconds} padStart={true} />
                  </div>
                  <span className="font-sans text-xs sm:text-sm mt-2 text-gray-600 dark:text-gray-300">
                    ثانیه
                  </span>
                </div>
              </div>

              <div
                className="flex flex-col items-center max-w-2xl text-center mt-3"
                dir="rtl"
              >
                <p className="text-lg sm:text-2xl font-bold leading-relaxed">
                  تا شروع سفری تازه در دنیای
                  <br />
                  ریاضیات و هندسه چیزی باقی نمانده
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
              منتظر یک تجربه آموزشی متفاوت باشید
            </p>
          </motion.div>
        </div>
      </div>

      {/* Adaptive gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/80 pointer-events-none" />
    </div>
  );
}

export type { HeroGeometricProps, ElegantShapeProps };
