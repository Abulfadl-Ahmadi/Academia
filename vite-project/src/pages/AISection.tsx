import { Bot } from "lucide-react";

import { SectionShell } from "@/components/layouts/SectionShell";

export default function AISection() {
  return (
    <SectionShell
      title="هوش مصنوعی"
      description="دستیار هوشمند آکادمی؛ سوال‌های درسی و تحلیلی خود را بپرسید"
      items={[
        {
          title: "هوش مصنوعی",
          icon: Bot,
          basePaths: ["/ai/chat"],
          items: [
            // `end` so this isn't also highlighted on /ai/chat/new or a chat.
            { title: "گفتگوهای من", to: "/ai/chat", end: true },
            { title: "گفتگوی جدید", to: "/ai/chat/new" },
          ],
        },
      ]}
    />
  );
}
