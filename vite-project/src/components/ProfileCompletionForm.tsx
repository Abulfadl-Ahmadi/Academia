import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "@/lib/utils";
import { validateIranianNationalId, formatNationalId } from "@/lib/nationalIdValidator";
import axiosInstance from "@/lib/axios";
import { useUser } from "@/context/UserContext";
import { DateWheelPicker } from "@/components/ui/date-wheel-picker";
import { formatDate, fromParts } from "@/lib/persian-date";

const DEFAULT_BIRTH_DATE = fromParts({ year: 1378, month: 4, day: 22 }, "shamsi");

interface ProfileData {
  national_id: string;
  phone_number: string;
  birth_date: string;
  grade: string;
  school: string;
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
  const { user } = useUser();
  const [formData, setFormData] = useState<ProfileData>({
    national_id: "",
    phone_number: "",
    birth_date: "",
    grade: "",
    school: "",
  });
  const [birthDateValue, setBirthDateValue] = useState<Date>(DEFAULT_BIRTH_DATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    loadCurrentProfile();
  }, []);

  useEffect(() => {
    if (user?.username && /^09\d{9}$/.test(user.username)) {
      setFormData(prev => {
        if (!prev.phone_number) {
          return { ...prev, phone_number: user.username };
        }
        return prev;
      });
    }
  }, [user]);

  const loadCurrentProfile = async () => {
    try {
      let profileData: any = null;
      try {
        const userResponse = await axiosInstance.get('/profiles/me/');
        profileData = userResponse.data;
      } catch {
        const userResponse = await axiosInstance.get('/profiles/');
        const profiles = userResponse.data?.results || userResponse.data || [];
        if (profiles.length > 0) {
          profileData = profiles[0];
        }
      }
      
      const usernamePhone = (profileData?.user?.username && /^09\d{9}$/.test(profileData.user.username))
        ? profileData.user.username
        : (user?.username && /^09\d{9}$/.test(user.username) ? user.username : "");

      const resolvedPhone = profileData?.phone_number || usernamePhone || "";

      if (profileData) {
        if (profileData.birth_date) {
          const parsed = new Date(profileData.birth_date);
          if (!isNaN(parsed.getTime())) {
            setBirthDateValue(parsed);
          }
        }

        setFormData({
          national_id: profileData.national_id || "",
          phone_number: resolvedPhone,
          birth_date: profileData.birth_date || "",
          grade: profileData.grade || "",
          school: profileData.school || "",
        });
        
        setIsCompleted(Boolean(profileData.national_id && resolvedPhone));
      } else if (resolvedPhone) {
        setFormData(prev => ({
          ...prev,
          phone_number: resolvedPhone,
        }));
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

  const handleBirthDateChange = (newDate: Date) => {
    setBirthDateValue(newDate);
    const formatted = formatDate(newDate, "yyyy-MM-dd", { calendarType: "miladi", digits: "en" });
    setFormData(prev => ({
      ...prev,
      birth_date: formatted
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
    const dateToCheck = formData.birth_date || (birthDateValue ? formatDate(birthDateValue, "yyyy-MM-dd", { calendarType: "miladi", digits: "en" }) : "");
    if (dateToCheck) {
      const birthDate = new Date(dateToCheck);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 5 || age > 90) {
        setError("تاریخ تولد نامعتبر است");
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

    const submitData = {
      ...formData,
      birth_date: formData.birth_date || formatDate(birthDateValue, "yyyy-MM-dd", { calendarType: "miladi", digits: "en" }),
    };

    try {
      let response;
      try {
        response = await axiosInstance.patch('/profiles/me/', submitData);
      } catch (patchErr: any) {
        if (patchErr.response?.status === 404 || patchErr.response?.status === 405) {
          const profilesResponse = await axiosInstance.get('/profiles/');
          const profiles = profilesResponse.data?.results || profilesResponse.data || [];
          if (profiles.length > 0) {
            const profileId = profiles[0].id;
            response = await axiosInstance.patch(`/profiles/${profileId}/`, submitData);
          } else {
            throw patchErr;
          }
        } else {
          throw patchErr;
        }
      }

      if (response && (response.status === 200 || response.status === 201)) {
        setIsCompleted(true);
        onSuccess?.(response.data);
      }
    } catch (err: any) {
      console.error("Error submitting profile:", err);
      if (err.response?.status === 401) {
        setError('لطفاً ابتدا وارد شوید');
      } else {
        const errorData = err.response?.data;
        let errorMessage = 'خطایی در تکمیل پروفایل رخ داد';
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData?.detail) {
          errorMessage = errorData.detail;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData && typeof errorData === 'object') {
          const values = Object.values(errorData).flat();
          if (values.length > 0) {
            errorMessage = values.join(' - ');
          }
        }
        setError(errorMessage);
      }
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
                    <Label>تاریخ تولد</Label>
                    <div className="flex flex-col items-center gap-3 p-3 rounded-xl border bg-muted/30">
                      <DateWheelPicker 
                        value={birthDateValue} 
                        onValueChange={handleBirthDateChange} 
                      />
                      <p className="text-sm font-medium text-muted-foreground">
                        {formatDate(birthDateValue, "yyyy MMMM d")}
                      </p>
                    </div>
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

                  <div className="grid gap-3">
                    <Label htmlFor="school">مرکز آموزشی / مدرسه</Label>
                    <Input
                      id="school"
                      type="text"
                      value={formData.school}
                      onChange={(e) => handleInputChange('school', e.target.value)}
                      placeholder="نام مرکز آموزشی یا مدرسه خود را وارد کنید"
                      maxLength={200}
                    />
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
