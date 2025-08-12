import { Navigate } from "react-router-dom"
import { useUser } from "@/context/UserContext"
import Page from '@/app/dashboard/page'
import TeacherPage from '@/app/teacher-dashboard/page'
import { Routes, Route } from "react-router-dom"
import StudentList from "./StudentList"
import GroupList from "./GroupList"
import { useEffect } from "react"
import StudentGroupListPage from "@/app/teacher-dashboard/groups/page"
import ClassDetailsPage from "@/app/teacher-dashboard/groups/detail"
import TeacherProfilePage from "@/app/teacher-dashboard/profile/pages"
import FilesPage from "@/app/teacher-dashboard/files/page"
import VideoPage from "@/app/teacher-dashboard/video/page"
import SessionsPage from "@/app/teacher-dashboard/groups/session/page"
import SessionsDetailPage from "@/app/teacher-dashboard/groups/session/page"
import { useLogout } from "@/hooks/use-logout"
import UploadVideo from "@/app/teacher-dashboard/video/UploadVideo"
import TeacherTestApp from "@/app/teacher-dashboard/tests/CreateTest"

export default function PanelRoute() {
  const { user, loading } = useUser()


  if (loading) return <div>در حال بارگذاریه...</div>

  // if (!user) return <Navigate to="/login" />
  if (!user) {
  // const logout = useLogout()

  // useEffect(() => {
  //   logout()
  // }, []) // run once on mount
    return <div>لطفا لاگین کنید</div>
  }
  if (user.role === "student") return <Page />
  if (user.role === "teacher")return (
    <Routes>
      <Route path="/" element={<TeacherPage />}>
        <Route index element={<div>پنل معلم</div>} />
        <Route path="students" element={<StudentList />} />
        <Route path="courses" element={<StudentGroupListPage />} />
        <Route path="/courses/:id" element={<ClassDetailsPage />} />
        <Route path="/courses/:id/sessions" element={<SessionsPage />} />
        <Route path="/courses/:course_id/sessions/:session_id" element={<SessionsDetailPage />} />
        <Route path="/profile" element={<TeacherProfilePage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/videos" element={<UploadVideo />} />
        <Route path="/tests/create" element={<TeacherTestApp />} />
        {/* <Route path="/videos" element={<VideoPage />} /> */}

      </Route>
    </Routes>
  )
  return <div>نقش نامعتبر است</div>
}
