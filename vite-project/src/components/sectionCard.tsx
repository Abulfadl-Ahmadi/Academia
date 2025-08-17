import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "./ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { TvMinimalPlay, FileText, CalendarDays } from "lucide-react"

export function SectionCards() {
  return (
    <div className=" grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>جلسات</CardDescription>
          <CardTitle className="flex text-2xl gap-2 font-semibold tabular-nums @[250px]/card:text-3xl">
            <TvMinimalPlay size={32} />
            ۱۲ جلسه 
          </CardTitle>
          <CardAction>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex items-start gap-1.5 text-sm">
            <Button variant={"outline"}>لیست جلسات</Button>
            <Button>شروع جلسه </Button>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>فایل‌ها</CardDescription>
          <CardTitle className="flex text-2xl gap-2 font-semibold tabular-nums @[250px]/card:text-3xl">
            <FileText size={32} />
            ۳۴ فایل
          </CardTitle>
          <CardAction>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex items-start gap-1.5 text-sm">
            <Button variant={"outline"}>لیست فایل‌ها</Button>
            <Button>فایل جدید</Button>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>تقویم کلاسی</CardDescription>
          <CardTitle className="flex gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          <CalendarDays size={32} />
            برنامه هفتگی
          </CardTitle>
          <CardAction>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            کلاس: 
            <Badge variant="outline">شنبه ۱۴:۳۰</Badge>
            <Badge variant="outline">دوشنبه ۱۴:۳۰</Badge>
          </div>
          <div className="line-clamp-1 flex gap-2 font-medium">
            آزمون: 
            <Badge variant="outline">پنج‌شنبه ۱۸:۰۰</Badge>
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>دانش‌آموزان</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ۱۲۰ دانش‌آموز
          </CardTitle>
          <CardAction>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex items-start gap-1.5 text-sm">
<div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="https://github.com/leerob.png" alt="@leerob" />
          <AvatarFallback>LR</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage
            src="https://github.com/evilrabbit.png"
            alt="@evilrabbit"
          />
          <AvatarFallback>ER</AvatarFallback>
        </Avatar>
      </div>
        <Button variant={"outline"}>لیست دانش‌آموزان</Button>

        </CardFooter>
      </Card>
    </div>
  )
}
