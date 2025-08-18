import { useLogout } from "@/hooks/use-logout"
import {
  BadgeCheck,
  Bell,
  CreditCard,
  LogOut,
  ChevronDown,
} from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function NavbarUser({
  user,
}: {
  user: {
    username: string
    first_name: string
    last_name: string
    email: string
    avatar: string
  }
}) {
  const logout = useLogout()

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-auto p-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.username} />
            <AvatarFallback className="text-sm">
              {user.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:block text-sm font-medium">{user.first_name} {user.last_name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-sm" >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback className="text-sm">
                {user.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-sm leading-tight">
              <span className="truncate font-medium">{user.first_name} {user.last_name}</span>
              {/* <span className="truncate text-xs text-muted-foreground">{user.email}</span> */}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup dir="ltr">
          <DropdownMenuItem onClick={() => window.location.href = "/panel/profile"}>
            <BadgeCheck className="ml-2 h-4 w-4" />
            حساب کاربری
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="ml-2 h-4 w-4" />
            پرداخت‌ها
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="ml-2 h-4 w-4" />
            پیام‌ها
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem dir="ltr" onClick={logout}>
          <LogOut className="ml-2 h-4 w-4" />
          خروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
