import { NavLink } from "react-router-dom";
import { Home, GraduationCap, ClipboardList, Bot, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "خانه", path: "/panel", icon: Home, exact: true },
  { label: "کلاس‌ها", path: "/panel/courses", icon: GraduationCap },
  { label: "آزمون‌ها", path: "/panel/test-collections", icon: ClipboardList },
  { label: "AI", path: "/panel/support/ask-ai", icon: Bot },
  { label: "پروفایل", path: "/panel/profile", icon: User },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 m-5 rounded-full border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="mx-auto flex max-w-md justify-between">
        {navItems.map(({ label, path, icon: Icon, exact }) => (
          <NavLink
            key={path}
            to={path}
            end={exact}
            className={({ isActive }) =>
              cn(
                "relative flex flex-1 justify-center rounded-full px-1 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <div className="relative flex w-full flex-col items-center gap-1 rounded-full px-2 py-1 pt-2">
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      key="active"
                      layoutId="mobile-nav-active"
                      className="absolute inset-0 -z-10 rounded-full bg-primary/10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                <motion.span
                  className="relative flex h-6 w-6 items-center justify-center"
                  animate={{ scale: isActive ? 1.05 : 1, opacity: isActive ? 1 : 0.85 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={isActive ? 2.4 : 1.6} />
                </motion.span>

                <motion.span
                  className={cn(
                    "relative text-[11px]",
                    isActive ? "font-bold" : "font-medium"
                  )}
                  animate={{ opacity: isActive ? 1 : 0.75, y: isActive ? 0 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {label}
                </motion.span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
