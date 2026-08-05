import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser } from "@/context/UserContext"

export default function GenericStaffHome() {
  const { user } = useUser();

  const roleLabels: Record<string, string> = {
    admin: 'ادمین',
    support: 'پشتیبان',
    content_creator: 'تولید محتوا',
    finance: 'مدیریت مالی',
  };

  const roleLabel = user?.role ? roleLabels[user.role] || user.role : 'کاربر';

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>
            خوش آمدید، {user?.first_name} {user?.last_name}!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            به پنل {roleLabel} خوش آمدید. شما می‌توانید از طریق منوی کناری به بخش‌های مربوط به خود دسترسی داشته باشید.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
