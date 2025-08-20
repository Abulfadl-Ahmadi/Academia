export const BRAND = {
  name: "آرین تفضلی‌زاده",
  shortName: "آرین تفضلی‌زاده",
  description: "آکادمی آنلاین آرین تفضلی‌زاده - آموزش‌های تخصصی و کیفیت بالا",
  copyright: "© 2025 آرین تفضلی‌زاده. تمامی حقوق محفوظ است.",
  domain: "arian-academy.com", // Update with actual domain
  email: "info@ArianTafazolizadeh.ir", // Update with actual email
  phone: "+98 21 1234 5678", // Update with actual phone
} as const;

export const URLS = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/panel",
  teacherDashboard: "/panel/teacher",
  shop: "/shop",
  support: "/support",
} as const;

export const NAVIGATION = {
  main: [
    { text: "خانه", href: URLS.home },
    { text: "فروشگاه", href: URLS.shop },
    { text: "کلاس‌ها", href: "#courses" },
    { text: "آزمون‌ها", href: "#tests" },
    { text: "تماس با ما", href: "#contact" },
  ],
  footer: [
    { text: "درباره ما", href: "#about" },
    { text: "قوانین و مقررات", href: "#terms" },
    { text: "حریم خصوصی", href: "#privacy" },
    { text: "پشتیبانی", href: URLS.support },
  ],
} as const;
