import { TvMinimalPlay, FileText } from "lucide-react";

import { SectionShell } from "@/components/layouts/SectionShell";

export default function ClassesSection() {
  return (
    <SectionShell
      title="کلاس‌ها"
      description="دوره‌ها، فایل‌ها و کتاب‌های درسی شما"
      items={[
        {
          title: "کلاس‌های من",
          icon: TvMinimalPlay,
          basePaths: ["/classes/courses"],
          items: [
            // `end` so this isn't also highlighted on /classes/courses/active.
            { title: "لیست همه دوره‌ها", to: "/classes/courses", end: true },
            { title: "دوره‌های فعال", to: "/classes/courses/active" },
            { title: "دوره‌های کامل شده", to: "/classes/courses/completed" },
          ],
        },
        {
          title: "فایل‌های من",
          icon: FileText,
          basePaths: ["/classes/files"],
          items: [
            { title: "فایل‌های دوره", to: "/classes/files", end: true },
            { title: "فایل‌های خریداری شده", to: "/classes/files/downloaded" },
          ],
        },
        {
          title: "کتاب‌های درسی",
          icon: FileText,
          basePaths: ["/classes/books"],
          items: [{ title: "لیست کتاب‌ها", to: "/classes/books" }],
        },
      ]}
    />
  );
}
