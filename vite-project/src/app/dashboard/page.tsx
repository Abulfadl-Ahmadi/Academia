import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUser } from "@/context/UserContext"
import { BookOpen, FileText, Play, User, Mail, GraduationCap } from "lucide-react"
import { Outlet } from "react-router-dom"


export default function Page() {
  const { user } = useUser();

  return <Outlet />;
}
