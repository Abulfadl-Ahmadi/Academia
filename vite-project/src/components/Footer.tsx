import { LogoSvg } from "./LogoSvg";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Instagram, Send, Youtube, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="2xl:px-[10%]">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* Brand & Description */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-3">
              <LogoSvg className="h-24 w-auto" />
            </div>
              {/* <div>
                <div className="text-xl font-bold">{BRAND.name}</div>
                <div className="text-sm text-muted-foreground">آکادمی آنلاین</div>
              </div> */}
            <p className="text-muted-foreground leading-relaxed">
                آموزش تخصصی ریاضی، آمار و احتمال و ریاضیات گسسته.
                همراه شما در مسیر موفقیت تحصیلی و کنکور.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-blue-400" />
                <span>{BRAND.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-blue-400" />
                <span dir="ltr">{BRAND.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>تهران، ایران</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold">دسترسی سریع</h3>
            <div className="space-y-3">
              {[
                { label: "صفحه اصلی", href: "/" },
                { label: "دوره‌ها", href: "/courses" },
                { label: "درباره ما", href: "/about" },
                { label: "تماس با ما", href: "/contact" },
                { label: "بلاگ", href: "/blog" },
                { label: "سوالات متداول", href: "/faq" }
              ].map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="block text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Course Categories */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold">دسته‌بندی کلاس‌ها و دوره‌ها</h3>
            <div className="space-y-3">
              {[
                "سالیانه",
                "حضوری",
                "امتحان نهایی",
                "جمع‌بندی",
                "نکته و تست",
              ].map((category, index) => (
                <a
                  key={index}
                  href="#"
                  className="block text-muted-foreground hover:text-foreground  transition-colors duration-200"
                >
                  {category}
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter & Social */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold ">عضویت در خبرنامه</h3>
            <p className="text-muted-foreground text-sm">
              برای دریافت آخرین اخبار و تخفیف‌های ویژه در خبرنامه ما عضو شوید
            </p>
            
            {/* Newsletter Signup */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="ایمیل خود را وارد کنید"
                  className=""
                />
                <Button size="sm">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="space-y-4">
              <h4 className="font-semibold">شبکه‌های اجتماعی</h4>
              <div className="flex gap-4">
                {[
                  { 
                    icon: Instagram, 
                    href: "https://instagram.com/arian_tafazzolizadeh", 
                    label: "Instagram",
                    color: "hover:text-pink-400"
                  },
                  { 
                    icon: Send, 
                    href: "https://t.me/arian_tafazzolizadeh", 
                    label: "Telegram",
                    color: "hover:text-blue-400"
                  },
                  { 
                    icon: Youtube, 
                    href: "https://youtube.com/@arian_tafazzolizadeh", 
                    label: "YouTube",
                    color: "hover:text-red-400"
                  }
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground  transition-all duration-200 ${social.color} hover:scale-110`}
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-right">
              <p className="text-muted-foreground text-sm">
                {BRAND.copyright}
              </p>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground  transition-colors">
                حریم خصوصی
              </a>
              <a href="/terms" className="hover:text-foreground transition-colors">
                قوانین و مقررات
              </a>
              <a href="/support" className="hover:text-foreground transition-colors">
                پشتیبانی
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      {/* <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div> */}
    </footer>
  );
}
