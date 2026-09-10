import "./App.css";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import Navbar from "./components/navbar";
import { UserProvider } from "@/context/UserContext";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { FontProvider } from "@/context/FontContext";
import { useUser } from "@/context/UserContext";
import { Worker } from "@react-pdf-viewer/core";
import { Footer } from "@/components/Footer";
import ProfileGuard from "@/components/ProfileGuard";
import AuthGuard from "@/components/AuthGuard";
import { Toaster } from "@/components/ui/sonner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { FloatingGradeCalculator } from "@/components/floating-grade-calculator";
// PDF styles are loaded from index.html
import "@/utils/pdf-styles";

// Lazy load heavy components
const LoginPage = lazy(() => import("./app/login/page"));
const LogoutPage = lazy(() => import("@/pages/logout"));
const RegisterPage = lazy(() => import("./app/register/page"));
const ForgotPasswordPage = lazy(() => import("./app/forgot-password/page"));
const ProfileCompletePage = lazy(() => import("./app/complete-profile/page"));
const PanelRoute = lazy(() => import("./pages/PanelRoute"));
const TeacherKnowledgePanel = lazy(() =>
  import("@/features/knowledge").then((module) => ({
    default: module.TeacherKnowledgePanel,
  }))
);
const TestPage = lazy(
  () => import("./app/teacher-dashboard/tests/TestPageNew")
);
const TestInfoPage = lazy(() => import("./components/TestDetailPage"));
const TestStatisticsPage = lazy(() => import("@/testCollections/TestStatisticsPage"));
const ShopPage = lazy(() => import("./app/shop/page"));
const ProductDetailPage = lazy(() => import("./app/shop/[id]/page"));
const GradeCalculatorPage = lazy(() => import("@/pages/GradeCalculatorPage"));
const MathTestPage = lazy(() => import("@/pages/MathTestPage"));
const PaymentInitiate = lazy(() =>
  import("@/components/PaymentInitiate").then((module) => ({
    default: module.PaymentInitiate,
  }))
);
const PaymentSuccess = lazy(() =>
  import("@/components/PaymentSuccess").then((module) => ({
    default: module.PaymentSuccess,
  }))
);
const PaymentFailed = lazy(() =>
  import("@/components/PaymentFailed").then((module) => ({
    default: module.PaymentFailed,
  }))
);
const PublicBlogPage = lazy(() => import("./app/blog/page"));
const PublicBlogDetailPage = lazy(() => import("./app/blog/[slug]/page"));
const PublicTestPosterPage = lazy(() => import("@/pages/PublicTestPosterPage"));
const HomePage = lazy(() => import("./components/HomePage"));

// Public "آزمون‌ها" section: reuses the dashboard screens behind a side menu.
// Its child paths mirror the panel's exactly so links only swap the base.
const TestsSection = lazy(() => import("@/pages/TestsSection"));
const TestCollectionList = lazy(() => import("@/testCollections/TestCollectionList"));
const TestCollectionDetail = lazy(() => import("@/testCollections/TestCollectionDetail"));
const StudentProgressList = lazy(() => import("@/testCollections/StudentProgressList"));
const TestAnswerSheetPage = lazy(() => import("@/testCollections/TestAnswerSheetPage"));
const TestMakerDashboard = lazy(() => import("@/app/dashboard/test-maker/page"));
const TestMakerCreatePage = lazy(() => import("@/app/dashboard/test-maker/create/page"));
const CustomTestTake = lazy(() => import("@/app/dashboard/test-maker/test/[id]/page"));
const CustomTestResults = lazy(() => import("@/app/dashboard/test-maker/results/[id]/page"));
const ActiveTestsPage = lazy(() => import("@/app/dashboard/tests/active/page"));
const TestHistoryPage = lazy(() => import("@/app/dashboard/tests/history/page"));
const TestResultPage = lazy(() => import("@/app/dashboard/tests/result/[id]"));

// Public "کلاس‌ها" section: same reuse pattern as "آزمون‌ها" above, mirrored
// under /classes instead of /panel.
const ClassesSection = lazy(() => import("@/pages/ClassesSection"));
const StudentCoursesPage = lazy(() => import("@/app/dashboard/courses/page"));
const CompletedCoursesPage = lazy(() => import("@/app/dashboard/courses/completed/page"));
const StudentCourseDetailPage = lazy(() => import("@/app/dashboard/courses/[courseId]/page"));
const StudentFilesPage = lazy(() => import("@/app/dashboard/files/StudentFilesPage"));
const StudentBookListPage = lazy(() => import("@/app/dashboard/books/index.tsx"));

// Public "هوش مصنوعی" section: the panel's AI chat screens behind the same
// side menu, mirrored under /ai so the header link has a page of its own.
const AISection = lazy(() => import("@/pages/AISection"));
const AIConversationList = lazy(() =>
  import("@/features/tickets/AIConversations").then((module) => ({
    default: module.AIConversationList,
  }))
);
const AIConversationDetail = lazy(() =>
  import("@/features/tickets/AIConversations").then((module) => ({
    default: module.AIConversationDetail,
  }))
);
const AIConversationNew = lazy(() =>
  import("@/features/tickets/AIConversations").then((module) => ({
    default: module.AIConversationNew,
  }))
);

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

function PreApp() {
  return (
    <ThemeProvider>
      <FontProvider>
        <UserProvider>
          <CartProvider>
            <Worker workerUrl="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js">
              <App />
            </Worker>
          </CartProvider>
        </UserProvider>
      </FontProvider>
    </ThemeProvider>
  );
}

function App() {
  const { user } = useUser();
  const location = useLocation();
  const isAIChatDetail = location.pathname.startsWith("/panel/support/ask-ai/");
  const showMobileNav = location.pathname.startsWith("/panel") && !isAIChatDetail;
  const showFloatingCalculator =
    location.pathname !== "/grade-calculator" && !location.pathname.startsWith("/panel");
  if (user) {
    console.log(user);
  }
  return (
    <div className={showMobileNav ? "pb-20 md:pb-0" : ""}>
          <UserProvider>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/complete-profile" element={<ProfileCompletePage />} />
          <Route
            path="/tests/:testId/info"
            element={
              <>
                <Navbar />
                {/* ProfileGuard sits inside the padded area: its warning banner
                    would otherwise render above the fixed navbar and be hidden. */}
                <div className="pt-24">
                  <ProfileGuard>
                    <TestInfoPage />
                  </ProfileGuard>
                </div>
                <Footer />
              </>
            }
            />
          {/* Child paths mirror the student panel's test routes one-for-one, so
              screens shared with the dashboard only need their base swapped. */}
          <Route
            path="/exams"
            element={
              <>
                <Navbar />
                {/* ProfileGuard sits inside the padded area: its warning banner
                    would otherwise render above the fixed navbar and be hidden. */}
                <div className="pt-24">
                  <AuthGuard section="آزمون‌ها">
                    <ProfileGuard>
                      <TestsSection />
                    </ProfileGuard>
                  </AuthGuard>
                </div>
                <Footer />
              </>
            }
          >
            <Route index element={<Navigate to="/exams/test-collections" replace />} />
            <Route path="test-collections" element={<TestCollectionList />} />
            <Route path="test-collections/:id" element={<TestCollectionDetail />} />
            <Route path="test-collections/:id/progress" element={<StudentProgressList />} />
            <Route path="tests/:testId/answer-sheet" element={<TestAnswerSheetPage />} />
            <Route path="tests/active" element={<ActiveTestsPage />} />
            <Route path="tests/history" element={<TestHistoryPage />} />
            <Route path="tests/result/:id" element={<TestResultPage />} />
            <Route path="test-maker" element={<TestMakerDashboard />} />
            <Route path="test-maker/create" element={<TestMakerCreatePage />} />
            <Route path="test-maker/test/:id" element={<CustomTestTake />} />
            <Route path="test-maker/results/:id" element={<CustomTestResults />} />
          </Route>
          {/* Child paths mirror the student panel's course routes one-for-one. */}
          <Route
            path="/classes"
            element={
              <>
                <Navbar />
                <div className="pt-24">
                  <AuthGuard section="کلاس‌ها">
                    <ProfileGuard>
                      <ClassesSection />
                    </ProfileGuard>
                  </AuthGuard>
                </div>
                <Footer />
              </>
            }
          >
            <Route index element={<Navigate to="/classes/courses" replace />} />
            <Route path="courses" element={<StudentCoursesPage />} />
            <Route path="courses/active" element={<StudentCoursesPage />} />
            <Route path="courses/completed" element={<CompletedCoursesPage />} />
            <Route path="courses/:courseId" element={<StudentCourseDetailPage />} />
            <Route path="files" element={<StudentFilesPage />} />
            <Route path="files/downloaded" element={<StudentFilesPage />} />
            <Route path="books" element={<StudentBookListPage />} />
          </Route>
          <Route
            path="/ai"
            element={
              <>
                <Navbar />
                <div className="pt-24">
                  <AuthGuard section="هوش مصنوعی">
                    <ProfileGuard>
                      <AISection />
                    </ProfileGuard>
                  </AuthGuard>
                </div>
                <Footer />
              </>
            }
          >
            <Route index element={<Navigate to="/ai/chat" replace />} />
            <Route path="chat" element={<AIConversationList />} />
            {/* Before ":id" so "new" isn't read as a conversation id. */}
            <Route path="chat/new" element={<AIConversationNew />} />
            <Route path="chat/:id" element={<AIConversationDetail />} />
          </Route>
          <Route path="/tests/:id/" element={<TestPage />} />
          <Route path="/tests/:id/detail" element={<TestPage />} />
          <Route path="/panel/*" element={<PanelRoute />} />
           {/* Redirect /dashboard to /panel for dashboard compatibility */}
           <Route path="/dashboard" element={<Navigate to="/panel" replace />} />
          <Route
            path="/teacher/knowledge"
            element={<TeacherKnowledgePanel />}
          />
          <Route path="/logout" element={<LogoutPage />} />

          <Route
            path="/shop"
            element={
              <>
                <Navbar />
                <div className="pt-24">
                  <ProfileGuard>
                    <ShopPage />
                  </ProfileGuard>
                </div>
                <Footer />
              </>
            }
          />
          <Route
            path="/shop/:id"
            element={
              <>
                <Navbar />
                <div className="pt-24">
                  <ProfileGuard>
                    <ProductDetailPage />
                  </ProfileGuard>
                </div>
                <Footer />
              </>
            }
          />
          <Route path="/grade-calculator" element={<div className="pt-24"><GradeCalculatorPage /></div>} />
          <Route path="/math-test" element={<MathTestPage />} />
          <Route path="/payment/initiate" element={<PaymentInitiate />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failed" element={<PaymentFailed />} />
          
          {/* Checkout Route */}
          <Route 
            path="/checkout" 
            element={
              <>
                <Navbar />
                <div className="pt-24">
                  <ProfileGuard>
                    <div>صفحه checkout در حال ساخت...</div>
                  </ProfileGuard>
                </div>
                <Footer />
              </>
            } 
          />

          {/* Public Blog Routes */}
          <Route
            path="/blog"
            element={
              <>
                <Navbar />
                <div className="pt-24">
                  <PublicBlogPage />
                </div>
                <Footer />
              </>
            }
          />
          <Route
            path="/blog/:slug"
            element={
              <>
                <Navbar />
                <div className="pt-24">
                  <PublicBlogDetailPage />
                </div>
                <Footer />
              </>
            }
          />

          {/* Public Test Poster Route */}
          <Route
            path="/test-poster/:testId"
            element={
              <>
                <Navbar />
                <div className="pt-24">
                  <PublicTestPosterPage />
                </div>
                <Footer />
              </>
            }
          />

          <Route
            path="/"
            element={
              <>
                <Navbar />
                {/* No top padding here: the hero is full-bleed and sits under the
                    transparent navbar, so its WebGL canvas reaches the viewport top. */}
                <HomePage />
                <Footer />
                {/* <HomeHome /> */}
              </>
            }
          />
          <Route
            path="*"
            element={
              <>
                <Navbar />
                <div className="p-10 pt-24 text-xl text-center min-h-screen flex flex-col justify-center">
                  <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    صفحه مورد نظر یافت نشد
                  </h1>
                  <p className="text-gray-600 mb-6">
                    متأسفانه صفحه‌ای که دنبال آن هستید وجود ندارد.
                  </p>
                  <a href="/" className="text-blue-600 underline">
                    بازگشت به صفحه اصلی
                  </a>
                </div>
                <Footer />
              </>
            }
          />
        </Routes>
      </Suspense>
      <Toaster />
      {showMobileNav ? <MobileBottomNav /> : null}
      {showFloatingCalculator ? <FloatingGradeCalculator /> : null}
              </UserProvider>
    </div>
  );
}

export default PreApp;
