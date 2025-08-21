import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { Loader2 } from "lucide-react";

interface ProfileGuardProps {
  children: React.ReactNode;
  requireProfile?: boolean;
}

interface ProfileStatus {
  profile_completed: boolean;
  profile: {
    national_id: string | null;
    phone_number: string | null;
    birth_date: string | null;
    grade: string | null;
  };
}

export default function ProfileGuard({ 
  children, 
  requireProfile = false 
}: ProfileGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const response = await axiosInstance.get("/accounts/profile/complete/");
        const status = response.data;
        setProfileStatus(status);
        
        // If profile is required but not completed, redirect to completion page
        if (requireProfile && !status.profile_completed) {
          navigate("/complete-profile", { 
            state: { 
              returnUrl: window.location.pathname,
              isRequired: true 
            } 
          });
          return;
        }
        
      } catch (error) {
        console.error("Error checking profile status:", error);
        
        // If there's an error and profile is required, redirect to completion page
        if (requireProfile) {
          navigate("/complete-profile", { 
            state: { 
              returnUrl: window.location.pathname,
              isRequired: true 
            } 
          });
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkProfileStatus();
  }, [navigate, requireProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>در حال بررسی پروفایل...</p>
        </div>
      </div>
    );
  }

  // Show profile completion warning for non-required routes
  if (!requireProfile && profileStatus && !profileStatus.profile_completed) {
    return (
      <div>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="mr-3">
              <p className="text-sm text-yellow-700">
                برای استفاده از تمام امکانات (مانند خرید دوره‌ها) لطفاً{" "}
                <button
                  onClick={() => navigate("/complete-profile")}
                  className="font-medium underline hover:text-yellow-800"
                >
                  پروفایل خود را تکمیل کنید
                </button>
              </p>
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
