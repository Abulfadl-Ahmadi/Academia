// src/pages/logout.tsx
import { useEffect } from "react"
// import { useUser } from "@/context/UserContext"
import { useLogout } from "@/hooks/use-logout"

export default function LogoutPage() {
  const logout = useLogout()

  useEffect(() => {
    logout()
  }, []) // run once on mount

  return <p>در حال خروج...</p> // optional message while logging out
}
