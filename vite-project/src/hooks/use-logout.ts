// src/hooks/use-logout.ts
import { useUser } from "@/context/UserContext"
import axiosInstance from "@/lib/axios"


export function useLogout() {
  const { logout } = useUser()

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/logout/') // clear HttpOnly refresh cookie on backend
    } catch (error) {
      console.error("Logout API call failed", error)
    }
    logout(); // Centralized logout logic
  }

  return handleLogout
}
