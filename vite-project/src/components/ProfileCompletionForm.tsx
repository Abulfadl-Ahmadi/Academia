import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "@/lib/utils";
import { validateIranianNationalId, formatNationalId } from "@/lib/nationalIdValidator";
const baseURL = import.meta.env.VITE_API_BASE_URL;

interface ProfileData {
  national_id: string;
  phone_number: string;
  birth_date: string;
  grade: string;
}

interface ProfileCompletionFormProps {
  onSuccess?: (profile: ProfileData) => void;
  onSkip?: () => void;
  isRequired?: boolean;
  className?: string;
}

export default function ProfileCompletionForm({ 
  onSuccess, 
  onSkip,
  isRequired = false,
  className,
  ...props 
}: ProfileCompletionFormProps) {
  const [formData, setFormData] = useState<ProfileData>({
    national_id: "",
    phone_number: "",
    birth_date: "",
    grade: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    loadCurrentProfile();
  }, []);

  const loadCurrentProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      // Get user info first to get the profile ID
      const userResponse = await fetch(baseURL+'/accounts/profiles/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (userResponse.ok) {
        const profiles = await userResponse.json();
        if (profiles.length > 0) {
          const profileData = profiles[0]; // Get the current user's profile
          
          setFormData({
            national_id: profileData.national_id || "",
            phone_number: profileData.phone_number || "",
            birth_date: profileData.birth_date || "",
            grade: profileData.grade || "",
          });
          
          setIsCompleted(Boolean(profileData.national_id && profileData.phone_number));
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    let processedValue = value;
    
    // Format national ID
    if (field === "national_id") {
      processedValue = formatNationalId(value);
    }
    
    // Format phone number
    if (field === "phone_number") {
      processedValue = value.replace(/\D/g, '').slice(0, 11);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  const validateForm = () => {
    // Validate national ID
    if (!formData.national_id.trim()) {
      setError("کد ملی الزامی است");
      return false;
    }
    
    const nationalIdValidation = validateIranianNationalId(formData.national_id);
    if (!nationalIdValidation.isValid) {
      setError(nationalIdValidation.error || "کد ملی نامعتبر است");
      return false;
    }

    // Validate phone number
    if (!formData.phone_number.trim()) {
      setError("شماره تلفن الزامی است");
      return false;
    }
    if (!/^09\d{9}$/.test(formData.phone_number)) {
      setError("شماره تلفن باید ۱۱ رقم و با ۰۹ شروع شود");
      return false;
    }

    // Birth date validation if provided
    if (formData.birth_date) {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 10 || age > 25) {
        setError("سن باید بین ۱۰ تا ۲۵ سال باشد");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('لطفاً ابتدا وارد شوید');
        return;
      }

      // Get the current user's profile ID first
      const profilesResponse = await fetch(baseURL+'/accounts/profiles/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!profilesResponse.ok) {
        setError('خطا در دریافت اطلاعات پروفایل');
        return;
      }

      const profiles = await profilesResponse.json();
      if (profiles.length === 0) {
        setError('پروفایل پیدا نشد');
        return;
      }

      const profileId = profiles[0].id;

      // Update the profile using PATCH
      const response = await fetch(`${baseURL}/profiles/${profileId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setIsCompleted(true);
        onSuccess?.(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || errorData.message || 'خطایی در تکمیل پروفایل رخ داد');
      }
    } catch {
      setError('خطایی در ارتباط با سرور رخ داد');
    } finally {
      setLoading(false);
    }
  };

  if (isCompleted && !isRequired) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">پروفایل تکمیل شده</h1>
                  <p className="text-muted-foreground text-balance">
                    اطلاعات پروفایل شما با موفقیت تکمیل شده است
                  </p>
                </div>
                
                <div className="grid gap-4">
                  <Button onClick={onSuccess ? () => onSuccess(formData) : undefined}>
                    ادامه
                  </Button>
                </div>
              </div>
            </div>
            <div className="bg-muted relative hidden md:block">
              <img
                src="http://localhost:8000/media/login.jpg"
                alt="Image"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">تکمیل پروفایل</h1>
                  <p className="text-muted-foreground text-balance">
                    {isRequired 
                      ? "برای ادامه لطفاً اطلاعات خود را تکمیل کنید"
                      : "اطلاعات خود را تکمیل کنید تا بتوانید از تمام امکانات استفاده کنید"
                    }
                  </p>
                </div>

                {error && (
                  <p className="text-red-500 text-center text-sm">{error}</p>
                )}

                <div className="grid gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="national_id">کد ملی *</Label>
                    <Input
                      id="national_id"
                      type="text"
                      value={formData.national_id}
                      onChange={(e) => handleInputChange('national_id', e.target.value)}
                      placeholder="1234567890"
                      maxLength={10}
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="phone_number">شماره تلفن همراه *</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      placeholder="09123456789"
                      maxLength={11}
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="birth_date">تاریخ تولد</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => handleInputChange('birth_date', e.target.value)}
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="grade">پایه تحصیلی</Label>
                    <Select 
                      value={formData.grade} 
                      onValueChange={(value) => handleInputChange('grade', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="پایه تحصیلی خود را انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">دهم</SelectItem>
                        <SelectItem value="11">یازدهم</SelectItem>
                        <SelectItem value="12">دوازدهم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? "در حال ذخیره..." : "ذخیره اطلاعات"}
                    </Button>
                    
                    {!isRequired && onSkip && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onSkip}
                        disabled={loading}
                      >
                        رد کردن
                      </Button>
                    )}
                  </div>

                  {!isRequired && (
                    <div className="text-center text-xs text-muted-foreground">
                      * فیلدهای اجباری برای خرید دوره‌ها
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
          <div className="bg-muted relative hidden md:block">
            <img
              src="http://localhost:8000/media/login.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
