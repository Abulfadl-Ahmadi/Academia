import { useUser } from "@/context/UserContext"
import { Routes, Route } from "react-router-dom"
import StudentList from "./StudentList"
import TeacherProfilePage from "@/app/teacher-dashboard/profile/pages"
import FilesPage from "@/app/teacher-dashboard/files/page"
import SessionsPage from "@/app/teacher-dashboard/groups/session/page"
import SessionsDetailPage from "@/app/teacher-dashboard/groups/session/page"
import UploadVideo from "@/app/teacher-dashboard/video/UploadVideo1"
import TeacherTestApp from "@/app/teacher-dashboard/tests/CreateTest"
import TeacherTestsList from "@/app/teacher-dashboard/tests"
import StudentTestsList from "@/app/dashboard/tests"
import TestReport from "@/app/teacher-dashboard/tests/report/[id]"
import StudentTestResult from "@/app/dashboard/tests/result/[id]"
// import TestPage from '@/app/teacher-dashboard/tests/TestPage'
import ProfilePage from "@/app/dashboard/profile/page"
import Home from "@/app/dashboard/home/page"
import TransactionsPage from "@/app/teacher-dashboard/transactions/page"
import MyProducts from "@/app/dashboard/MyProducts"
import CourseDetailPage from "@/app/teacher-dashboard/courses/[courseId]/page"
import StudentCourseDetailPage from "@/app/dashboard/courses/[courseId]/page"
import StudentCoursesPage from "@/app/dashboard/courses/page"
import CoursesList from "@/app/teacher-dashboard/courses/CoursesList"
import CreateCoursePage from "@/app/teacher-dashboard/courses/create/page"
import CreateProductPage from "@/app/teacher-dashboard/products/create/page"
import VideoPage from "@/app/dashboard/video/page"

// Layout components
import { StudentLayout } from "@/components/layouts/StudentLayout"
import { TeacherLayout } from "@/components/layouts/TeacherLayout"
import EditCoursePage from "@/app/teacher-dashboard/courses/[courseId]/edit/page"

// import TestDetailPage from "@/app/teacher-dashboard/tests/TestPage"

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
  if (user.role === "student") return  (
    <Routes>
      <Route path="/" element={<StudentLayout />}>
        <Route index element={<Home />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/products" element={<MyProducts />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/courses" element={<StudentCoursesPage />} />
        <Route path="/courses/:courseId" element={<StudentCourseDetailPage />} />
        <Route path="/video/:sessionId?" element={<VideoPage />} />
        <Route path="/tests" element={<StudentTestsList />} />
        {/* <Route path='/tests/:id/detail' element={<TestDetailPage />}  /> */}
        <Route path="/tests/result/:id" element={<StudentTestResult />} />
      </Route>
    </Routes>
  )
  if (user.role === "teacher") return (
    <Routes>
      <Route path="/" element={<TeacherLayout />}>
        <Route index element={<div>پنل معلم</div>} />
        <Route path="students" element={<StudentList />} />
        <Route path="courses" element={<CoursesList />} />
        <Route path="courses/create" element={<CreateCoursePage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/courses/:courseId/edit" element={<EditCoursePage />} />
        <Route path="/courses/:id/sessions" element={<SessionsPage />} />
        <Route path="/courses/:course_id/sessions/:session_id" element={<SessionsDetailPage />} />
        <Route path="/profile" element={<TeacherProfilePage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/videos" element={<UploadVideo />} />
        <Route path="/tests" element={<TeacherTestsList />} />
        <Route path="/tests/create" element={<TeacherTestApp />} />
        <Route path="/tests/:id" element={<div>مشاهده آزمون</div>} />
        <Route path="/tests/report/:id" element={<TestReport />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/products/create" element={<CreateProductPage />} />
        {/* <Route path="/videos" element={<VideoPage />} */}
      </Route>
    </Routes>
  )
  return <div>نقش نامعتبر است</div>
}
