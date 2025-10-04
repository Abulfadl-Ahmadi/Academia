import { useUser } from "@/context/UserContext"
import { Routes, Route } from "react-router-dom"
import StudentList from "./StudentList"
import TeacherProfilePage from "@/app/teacher-dashboard/profile/pages"
import FilesPage from "@/app/teacher-dashboard/files/page"
import SessionsPage from "@/app/teacher-dashboard/groups/session/page"
import SessionsDetailPage from "@/app/teacher-dashboard/groups/session/page"
import UploadVideo from "@/app/teacher-dashboard/video/UploadVideo1"
// import TestPage from '@/app/teacher-dashboard/tests/TestPage'

// Support Tickets Components
import TicketsList from "@/features/tickets/TicketsList"
import NewTicket from "@/features/tickets/NewTicket"
import TicketDetail from "@/features/tickets/TicketDetail"
import AskAI from "@/features/tickets/AskAI"
import { AIConversationList, AIConversationDetail } from "@/features/tickets/AIConversations"
import ProfilePage from "@/app/dashboard/profile/page"
import Home from "@/app/dashboard/home/page"
import TransactionsPage from "@/app/teacher-dashboard/transactions/page"
import NewTransactionPage from "@/app/teacher-dashboard/transactions/new/page"
import UploadFilePage from "@/app/teacher-dashboard/files/upload/page"
import CalendarPage from "@/app/shared/calendar/page"
import CompletedCoursesPage from "@/app/dashboard/courses/completed/page"
import ActiveTestsPage from "@/app/dashboard/tests/active/page"
import TestHistoryPage from "@/app/dashboard/tests/history/page"
import TestResult from "@/app/dashboard/tests/result/[id]"
import StudentTestTakingPage from "@/pages/student/StudentTestTakingPage"
import MyProducts from "@/app/dashboard/MyProducts"
import TeacherProducts from "@/app/teacher-dashboard/products/page"
import CourseDetailPage from "@/app/teacher-dashboard/courses/[courseId]/page"
import StudentCourseDetailPage from "@/app/dashboard/courses/[courseId]/page"
import StudentCoursesPage from "@/app/dashboard/courses/page"
import CoursesList from "@/app/teacher-dashboard/courses/CoursesList"
import CreateCoursePage from "@/app/teacher-dashboard/courses/create/page"
import CreateProductPage from "@/app/teacher-dashboard/products/create/page"
import VideoPage from "@/app/dashboard/video/page"
import LiveStreamPage from "@/app/dashboard/live/[courseId]/page"

// Topic Tests Components
import TopicTestsPage from "@/pages/teacher/TopicTestsPage"
import CreateTopicTestPage from "@/pages/teacher/CreateTopicTestPage"
import FolderManagerPage from "@/pages/teacher/FolderManagerPage"

// Question Test Components
import CreateQuestionTestPage from "@/pages/teacher/CreateQuestionTestPage"
import QuestionTestsPage from "@/pages/teacher/QuestionTestsPage"
import QuestionTestDetailPage from "@/pages/teacher/QuestionTestDetailPage"
import TestPosterPage from "@/pages/teacher/TestPosterPage"
import TestReport from "@/app/teacher-dashboard/tests/report/[id]"
import TopPerformersLeaderboard from "@/app/teacher-dashboard/tests/report/leaderboard"

// Question Components
import CreateQuestionPage from "@/app/teacher-dashboard/questions/create"
import EditQuestionPage from "@/app/teacher-dashboard/questions/edit"

// Test Collection Components
import TestCollectionList from "@/testCollections/TestCollectionList"
import TestCollectionDetail from "@/testCollections/TestCollectionDetail"
import TestCollectionStatistics from "@/testCollections/TestCollectionStatistics"
import StudentProgressList from "@/testCollections/StudentProgressList"
// Explicitly import the TypeScript version with extension
import TestCollectionForm from "@/testCollections/TestCollectionForm.tsx"
import CreateTestInCollection from "@/testCollections/CreateTestInCollection"
import EditTestInCollection from "@/testCollections/EditTestInCollection"

// Layout components
import { StudentLayout } from "@/components/layouts/StudentLayout"
import { TeacherLayout } from "@/components/layouts/TeacherLayout"
import EditCoursePage from "@/app/teacher-dashboard/courses/[courseId]/edit/page"
import { TeacherKnowledgePanel } from "@/features/knowledge"
import QuestionsListPage from "@/app/teacher-dashboard/questions/page"
import LiveStream from "./livestream"
// Blog pages
import TeacherBlogListPage from '@/app/teacher-dashboard/blog/page'
import TeacherBlogCreatePage from '@/app/teacher-dashboard/blog/create/page'
import TeacherBlogDetailPage from '@/app/teacher-dashboard/blog/[slug]/page'
import TeacherBlogEditPage from '@/app/teacher-dashboard/blog/[slug]/edit/page'

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
        <Route path="/files" element={<div>فایل‌های من</div>} />
        <Route path="/files/downloaded" element={<div>فایل‌های دانلود شده</div>} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/courses" element={<StudentCoursesPage />} />
        <Route path="/courses/active" element={<StudentCoursesPage />} />
        <Route path="/courses/completed" element={<CompletedCoursesPage />} />
        <Route path="/courses/:courseId" element={<StudentCourseDetailPage />} />
        <Route path="/live/:courseId" element={<LiveStreamPage />} />
        <Route path="/video/:sessionId?" element={<VideoPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        {/* Test Collections routes for students */}
        <Route path="/test-collections" element={<TestCollectionList />} />
        <Route path="/test-collections/:id" element={<TestCollectionDetail />} />
        <Route path="/test-collections/:id/progress" element={<StudentProgressList />} />
        <Route path="/tests/active" element={<ActiveTestsPage />} />
        <Route path="/tests/history" element={<TestHistoryPage />} />
        <Route path="/tests/result/:id" element={<TestResult />} />
        <Route path="/tests/:testId/detail" element={<StudentTestTakingPage />} />
        {/* Support Tickets routes for students */}
        <Route path="/support" element={<TicketsList />} />
        <Route path="/support/new" element={<NewTicket />} />
        <Route path="/support/ask-ai/new" element={<AskAI />} />
        <Route path="/support/ask-ai/:id" element={<AIConversationDetail />} />
        <Route path="/support/ask-ai" element={<AIConversationList />} />
        <Route path="/support/:id" element={<TicketDetail />} />
      </Route>
    </Routes>
  )
  if (user.role === "teacher") return (
    <Routes>
      <Route path="/" element={<TeacherLayout />}>
        {/* <Route index element={<div>پنل معلم</div>} /> */}
        <Route index element={<LiveStream />} />
        <Route path="students" element={<StudentList />} />
        <Route path="courses" element={<CoursesList />} />
        <Route path="courses/create" element={<CreateCoursePage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/courses/:courseId/edit" element={<EditCoursePage />} />
        <Route path="/courses/:id/sessions" element={<SessionsPage />} />
        <Route path="/courses/:course_id/sessions/:session_id" element={<SessionsDetailPage />} />
        <Route path="/profile" element={<TeacherProfilePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/files/upload" element={<UploadFilePage />} />
        <Route path="/videos" element={<UploadVideo />} />
        {/* Test Collections routes - order is important */}
        <Route path="/test-collections" element={<TestCollectionList />} />
        <Route path="/test-collections/new" element={<TestCollectionForm />} />
        <Route path="/test-collections/:id" element={<TestCollectionDetail />} />
        <Route path="/test-collections/:id/edit" element={<TestCollectionForm />} />
        <Route path="/test-collections/:id/create-test" element={<CreateTestInCollection />} />
        <Route path="/test-collections/:id/tests/:testId/edit" element={<EditTestInCollection />} />
        <Route path="/test-collections/:id/progress" element={<StudentProgressList />} />
        <Route path="/test-collections/:id/statistics" element={<TestCollectionStatistics />} />
        <Route path="/tests/result/:id" element={<TestResult />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/transactions/new" element={<NewTransactionPage />} />
        <Route path="/products" element={<TeacherProducts />} />
        <Route path="/products/create" element={<CreateProductPage />} />
        {/* Topic Tests Routes */}
        <Route path="/topic-tests" element={<TopicTestsPage />} />
  <Route path="/topic-tests/create" element={<CreateTopicTestPage />} />
  <Route path="/topic-tests/:testId/edit" element={<CreateTopicTestPage />} />
  <Route path="/folders" element={<FolderManagerPage />} />
        {/* Question Tests Routes */}
        <Route path="/question-tests" element={<QuestionTestsPage />} />
        <Route path="/question-tests/create" element={<CreateQuestionTestPage />} />
        <Route path="/question-tests/:id" element={<QuestionTestDetailPage />} />
        <Route path="/question-tests/:id/edit" element={<CreateQuestionTestPage />} />
        <Route path="/question-tests/:id/poster" element={<TestPosterPage />} />
        <Route path="/question-tests/:id/results" element={<TestReport />} />
        <Route path="/question-tests/:id/leaderboard" element={<TopPerformersLeaderboard />} />
        {/* Question Routes */}
        <Route path="/questions" element={<QuestionsListPage />} />
        <Route path="/questions/create" element={<CreateQuestionPage />} />
        <Route path="/questions/edit/:id" element={<EditQuestionPage />} />
        {/* Support Tickets routes for teachers */}
        <Route path="/support" element={<TicketsList />} />
        <Route path="/support/new" element={<NewTicket />} />
        <Route path="/support/ask-ai/new" element={<AskAI />} />
        <Route path="/support/ask-ai/:id" element={<AIConversationDetail />} />
        <Route path="/support/ask-ai" element={<AIConversationList />} />
        <Route path="/support/:id" element={<TicketDetail />} />
        {/* <Route path="/videos" element={<VideoPage />} */}
        <Route path="/knowledge" element={<TeacherKnowledgePanel />} />
        {/* Blog Management */}
        <Route path="/blog" element={<TeacherBlogListPage />} />
        <Route path="/blog/create" element={<TeacherBlogCreatePage />} />
        <Route path="/blog/:slug" element={<TeacherBlogDetailPage />} />
        <Route path="/blog/:slug/edit" element={<TeacherBlogEditPage />} />
      </Route>
    </Routes>
  )
  return <div>نقش نامعتبر است</div>
}
