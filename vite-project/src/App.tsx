import './App.css'
import { Routes, Route, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"

import LoginPage from './app/login/page'
import LogoutPage from "@/pages/logout"
import RegisterPage from './app/register/page'
import Navbar from './components/navbar'
import { UserProvider } from "@/context/UserContext"
import { useUser } from "@/context/UserContext"
import PanelRoute from './pages/PanelRoute'
import VideoPlayer from './components/video-player/vider-plater'


function PreApp() {
  return (
    <UserProvider>
      <App />
    </UserProvider>
  );
}

function App() {
    const { user } = useUser();
    if (user) {
    console.log(user);
    }
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/panel/*" element={<PanelRoute />} />
      <Route path="/logout" element={<LogoutPage />} />

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
  )
}

export default PreApp
