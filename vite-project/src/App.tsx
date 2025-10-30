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
import { Toaster } from "@/components/ui/sonner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
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
            {/* <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js"> */}
            <Worker workerUrl="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js">
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

  const showMobileNav = location.pathname.startsWith("/panel");
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
              <ProfileGuard>
                <Navbar />
                <TestInfoPage />
                <Footer />
              </ProfileGuard>
            }
            />
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
              <ProfileGuard>
                <Navbar />
                <div className="pt-24">
                  <ShopPage />
                </div>
                <Footer />
              </ProfileGuard>
            }
          />
          <Route
            path="/shop/:id"
            element={
              <ProfileGuard>
                <Navbar />
                <div className="pt-24">
                  <ProductDetailPage />
                </div>
                <Footer />
              </ProfileGuard>
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
              <ProfileGuard>
                <Navbar />
                <div className="pt-24">
                  <div>صفحه checkout در حال ساخت...</div>
                </div>
                <Footer />
              </ProfileGuard>
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
                <div className="pt-24">
                  <HomePage />
                </div>
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
              </UserProvider>
    </div>
  );
}

export default PreApp;
