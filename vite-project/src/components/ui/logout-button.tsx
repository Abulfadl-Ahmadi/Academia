// src/components/logout-button.tsx
import { Button } from "@/components/ui/button"
import { useLogout } from "@/hooks/use-logout"

export function LogoutButton() {
  const handleLogout = async () => {
     useLogout()
  }

  return <Button onClick={handleLogout}>Logout</Button>
}
