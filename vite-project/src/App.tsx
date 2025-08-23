import './App.css'
import { Routes, Route } from "react-router-dom"
import LoginPage from './app/login/page'
import LogoutPage from "@/pages/logout"
import RegisterPage from './app/register/page'
import ProfileCompletePage from './app/complete-profile/page'
import Navbar from './components/navbar'
import { UserProvider } from "@/context/UserContext"
import { CartProvider } from "@/context/CartContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { FontProvider } from "@/context/FontContext"
import { useUser } from "@/context/UserContext"
import PanelRoute from './pages/PanelRoute'
import TestPage from './app/teacher-dashboard/tests/page'
import { Worker } from '@react-pdf-viewer/core';
import HomePage from '@/components/HomePage'
import { Footer } from '@/components/Footer'
import ProfileGuard from '@/components/ProfileGuard'

import { HomeHome } from './homehome'
// PDF styles are loaded from index.html
import '@/utils/pdf-styles';
import TestDetailPage from './app/teacher-dashboard/tests/TestPageRedesigned'
import ShopPage from './app/shop/page'
import ProductDetailPage from './app/shop/[id]/page'
import { Toaster } from "@/components/ui/sonner"

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
    if (user) {
    console.log(user);
    }
  return (
    <div>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/complete-profile" element={<ProfileCompletePage />} />
        <Route path='/tests/:id/' element={<TestPage />}  />
        <Route path='/tests/:id/detail' element={<TestDetailPage />}  />
        <Route path="/panel/*" element={<PanelRoute />} />
        <Route path="/logout" element={<LogoutPage />} />

        <Route path="/shop" element={
          <ProfileGuard>
            <Navbar />
            <div className=''>
              <ShopPage />
            </div>
            <Footer />
          </ProfileGuard>
        } />
        <Route path="/shop/:id" element={
          <ProfileGuard requireProfile={true}>
            <Navbar />
            <div className=''>
              <ProductDetailPage />
            </div>
            <Footer />
          </ProfileGuard>
        } />
        <Route
          path="/"
          element={
            <>
            {/* <Navbar />
            <HomePage />
            <Footer /> */}
            <HomeHome />
            </>
          }
        />
              <Route
          path="*"
          element={
            <>
            <Navbar />
            <div className="p-10 text-xl text-center min-h-screen flex flex-col justify-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">صفحه مورد نظر یافت نشد</h1>
              <p className="text-gray-600 mb-6">متأسفانه صفحه‌ای که دنبال آن هستید وجود ندارد.</p>
              <a href="/" className="text-blue-600 underline">بازگشت به صفحه اصلی</a>
            </div>
            <Footer />
            </>
          }
        />
      </Routes>
      <Toaster />
    </div>
  )
}

export default PreApp
