import { Box, Sparkles } from "lucide-react";

import { SectionShell } from "@/components/layouts/SectionShell";

export default function TestsSection() {
  return (
    <SectionShell
      title="آزمون‌ها"
      description="مجموعه آزمون‌ها و آزمون‌ساز اختصاصی شما"
      items={[
        {
          title: "مجموعه آزمون‌ها",
          icon: Box,
          basePaths: [
            "/exams/test-collections",
            "/exams/tests/active",
            "/exams/tests/history",
            "/exams/tests",
          ],
          items: [
            { title: "مجموعه‌های من", to: "/exams/test-collections" },
            { title: "آزمون‌های فعال", to: "/exams/tests/active" },
            { title: "تاریخچه آزمون‌ها", to: "/exams/tests/history" },
          ],
        },
        {
          title: "آزمون‌ساز",
          icon: Sparkles,
          basePaths: ["/exams/test-maker"],
          items: [
            // `end` so "داشبورد" isn't also highlighted on its child routes.
            { title: "داشبورد", to: "/exams/test-maker", end: true },
            { title: "ایجاد آزمون", to: "/exams/test-maker/create" },
          ],
        },
      ]}
    />
  );
}
