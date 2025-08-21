import { useNavigate, useLocation } from "react-router-dom";
import ProfileCompletionForm from "@/components/ProfileCompletionForm";

export default function ProfileCompletePage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const returnUrl = location.state?.returnUrl || "/panel";
  const isRequired = location.state?.isRequired || false;

  const handleSuccess = () => {
    navigate(returnUrl);
  };

  const handleSkip = () => {
    if (!isRequired) {
      navigate(returnUrl);
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <ProfileCompletionForm 
          onSuccess={handleSuccess}
          onSkip={handleSkip}
          isRequired={isRequired}
        />
      </div>
    </div>
  );
}
