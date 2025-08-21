import { Menu } from "lucide-react";
import type { ReactNode } from "react";

// import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button"; // type ButtonProps
import {
  Navbar as NavbarComponent,
  NavbarLeft,
  NavbarRight,
} from "@/components/ui/navbar";
import Navigation from "@/components/ui/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUser } from "@/context/UserContext";
import { NavbarUser } from "@/components/navbar-user";
import { ThemeToggle } from "@/components/theme-toggle";
import { FontToggle } from "@/components/font-toggle";
import { Logo } from "@/components/logo";

interface NavbarLink {
  text: string;
  href: string;
}

interface NavbarActionProps {
  text: string;
  href: string;
//   variant?: ButtonProps["variant"];
  icon?: ReactNode;
  iconRight?: ReactNode;
  isButton?: boolean;
}

interface NavbarProps {
  logo?: ReactNode;
  name?: string;
  homeUrl?: string;
  mobileLinks?: NavbarLink[];
  actions?: NavbarActionProps[];
  showNavigation?: boolean;
  customNavigation?: ReactNode;
  className?: string;
}

export default function Navbar({
//   logo = <LaunchUI />,
  logo = <Logo showText={false} />,
  name = "آرین تفضلی‌زاده",
  homeUrl = "#",
  mobileLinks = [
    { text: "فروشگاه", href: "#" },
    { text: "کلاس‌ها", href: "#" },
    { text: "آزمون‌‌ها", href: "#" },
    { text: "تماس با ما", href: "#" },
  ],
  actions = [
    { text: "ورود", href: "/login", isButton: false },
    {
      text: "ثبت نام",
      href: "/register",
      isButton: true,
    //   variant: "default",
    },
  ],
  showNavigation = true,
  customNavigation,
  className,
}: NavbarProps) {
  const { user, loading, logout } = useUser();

  return (
    <header className={cn("sticky top-0 z-50 -mb-4 px-4 pb-4", className)}>
      <div className="fade-bottom bg-background/15 absolute left-0 h-26 w-full backdrop-blur-lg"></div>
      <div className="max-w-container relative mx-auto">
        <NavbarComponent>
          <NavbarLeft>
            <a
              href={homeUrl}
              className="flex items-center gap-2 text-xl font-bold"
            >
              {logo}
              {name}
            </a>
            {showNavigation && (customNavigation || <Navigation />)}
          </NavbarLeft>
          <NavbarRight>
            {!loading && (
              <>
                {user ? (
                  // Show user profile when logged in
                  <>
                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                      <FontToggle />
                    </div>
                    <NavbarUser
                      user={{
                        username: user.username,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        avatar: "", // User object doesn't have avatar, will use initials fallback
                      }}
                    />
                  </>
                ) : (
                  // Show login/signup buttons when not logged in
                  <>
                    <ThemeToggle />
                    {actions.map((action, index) =>
                      action.isButton ? (
                        <Button
                          key={index}
                          // variant={action.variant || "default"}
                          asChild
                        >
                          <a href={action.href}>
                            {action.icon}
                            {action.text}
                            {action.iconRight}
                          </a>
                        </Button>
                      ) : (
                        <a
                          key={index}
                          href={action.href}
                          className="hidden text-sm md:block"
                        >
                          {action.text}
                        </a>
                      ),
                    )}
                  </>
                )}
              </>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="size-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="grid gap-6 text-lg font-medium">
                  <a
                    href={homeUrl}
                    className="flex items-center gap-2 text-xl font-bold"
                  >
                    <span>{name}</span>
                  </a>
                  
                  {/* Theme Toggle for Mobile */}
                  <div className="flex items-center justify-center py-2">
                    <ThemeToggle />
                  </div>
                  
                  {mobileLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {link.text}
                    </a>
                  ))}
                  {/* Add mobile login/signup or user profile */}
                  {!loading && (
                    <>
                      {user ? (
                        <div className="flex flex-col gap-3 pt-4 border-t">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm">
                              {user.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{user.first_name} {user.last_name}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <a href="/panel" className="text-sm text-primary hover:underline py-2">پنل کاربری</a>
                            <a href="/panel/profile" className="text-sm text-muted-foreground hover:text-foreground py-2">حساب کاربری</a>
                            <button 
                              onClick={logout}
                              className="text-sm text-destructive hover:text-destructive/80 py-2 text-right"
                            >
                              خروج
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 pt-4 border-t">
                          <a href="/login" className="text-sm text-primary hover:underline py-2">ورود</a>
                          <a href="/register" className="text-sm text-primary hover:underline py-2">ثبت نام</a>
                        </div>
                      )}
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </NavbarRight>
        </NavbarComponent>
      </div>
    </header>
  );
}
