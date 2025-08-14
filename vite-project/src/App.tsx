import './App.css'
import { Routes, Route } from "react-router-dom"
import { useEffect, useState } from "react"

import LoginPage from './app/login/page'
import LogoutPage from "@/pages/logout"
import RegisterPage from './app/register/page'
import Navbar from './components/navbar'
import { UserProvider } from "@/context/UserContext"
import { CartProvider } from "@/context/CartContext"
import { useUser } from "@/context/UserContext"
import PanelRoute from './pages/PanelRoute'
import VideoPlayer from './components/video-player/vider-plater'
import TestDetailPage from './app/teacher-dashboard/tests/page'
import { Worker } from '@react-pdf-viewer/core';
import packageJson from '../package.json';

const pdfjsVersion = packageJson.dependencies['pdfjs-dist'];
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import TestPage from './app/teacher-dashboard/tests/TestPage'
import ShopPage from './app/shop/page'
import ProductDetailPage from './app/shop/[id]/page'
import { Toaster } from "@/components/ui/sonner"

function PreApp() {
  return (
    <UserProvider>
      <CartProvider>
        {/* <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js"> */}
        <Worker workerUrl="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js">
        <App />
        </Worker>
      </CartProvider>
    </UserProvider>
  );
}

function App() {
    const { user } = useUser();
    if (user) {
    console.log(user);
    }
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path='/test/:id/' element={<TestPage />}  />
        <Route path='/test/:id/detail' element={<TestDetailPage />}  />
        <Route path="/panel/*" element={<PanelRoute />} />
        <Route path="/logout" element={<LogoutPage />} />

        <Route path="/shop" element={<><Navbar /><div className=''><ShopPage /></div></>} />
        <Route path="/shop/:id" element={<><Navbar /><div className=''><ProductDetailPage /></div></>} />
        <Route
          path="/"
          element={
            <>
            <Navbar />
            <div className="p-10 text-xl">
              Welcome! Go to <a href="/login" className="text-blue-600 underline">Login</a>
            </div>
            {/* <VideoPlayer src="http://localhost:8000/media/output/output.m3u8" /> */}
            </>
          }
        />
              <Route
          path="*"
          element={
            <>
            <Navbar />
            <div className="p-10 text-xl">
              صفحه مورد نظر یافت نشد
            </div>
            </>
          }
        />
      </Routes>
      <Toaster />
    </>
  )
}

export default PreApp
