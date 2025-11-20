import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import axiosInstance from "@/lib/axios";
import { School, User, Mail, Calendar as CalendarIcon, GraduationCap, CreditCard, Save, Edit, ChevronDownIcon, Phone } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { validateIranianNationalId } from "@/lib/nationalIdValidator";

interface UserProfile {
  national_id: string;
  phone_number: string;
  birth_date: string;
  school: string;
  grade: string;
}

interface UserData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface FormErrors {
  national_id?: string;
  phone_number?: string;
  birth_date?: string;
  school?: string;
  grade?: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

export default function ProfilePage() {
  const { user, fetchUser } = useUser();
  // const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [profile, setProfile] = useState<UserProfile>({
    national_id: "",
    phone_number: "",
    birth_date: "",
    school: "",
    grade: "",
  });
  const [userData, setUserData] = useState<UserData>({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
  });
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const translateBackendError = (error: string): string => {
    const errorTranslations: Record<string, string> = {
      "invalid national ID": "کد ملی وارد شده معتبر نیست",
      "Date has wrong format. Use one of these formats instead: YYYY-MM-DD.": "فرمت تاریخ باید به صورت YYYY-MM-DD باشد",
      "Enter a valid phone number.": "شماره تلفن وارد شده معتبر نیست",
      "Enter a valid email address.": "آدرس ایمیل وارد شده معتبر نیست",
      "A user with that username already exists.": "نام کاربری وارد شده قبلاً استفاده شده است",
      "This field is required.": "این فیلد الزامی است",
      "Ensure this field has at most 10 characters.": "این فیلد حداکثر ۱۰ کاراکتر مجاز است",
      "Ensure this field has at most 11 characters.": "این فیلد حداکثر ۱۱ کاراکتر مجاز است",
      "Ensure this field has at most 150 characters.": "این فیلد حداکثر ۱۵۰ کاراکتر مجاز است",
      "Ensure this field has at most 30 characters.": "این فیلد حداکثر ۳۰ کاراکتر مجاز است",
      "Ensure this field has at most 200 characters.": "این فیلد حداکثر ۲۰۰ کاراکتر مجاز است",
    };
    
    return errorTranslations[error] || error;
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // Validate username
    if (userData.username) {
      if (userData.username.length < 3) {
        newErrors.username = "نام کاربری باید حداقل ۳ کاراکتر باشد";
      } else if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
        newErrors.username = "نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و _ باشد";
      }
    }

    // Validate email
    if (userData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        newErrors.email = "فرمت ایمیل صحیح نیست";
      }
    }

    // Validate first_name
    if (userData.first_name) {
      if (userData.first_name.length < 2) {
        newErrors.first_name = "نام باید حداقل ۲ کاراکتر باشد";
      }
    }

    // Validate last_name
    if (userData.last_name) {
      if (userData.last_name.length < 2) {
        newErrors.last_name = "نام خانوادگی باید حداقل ۲ کاراکتر باشد";
      }
    }

    // Validate national_id
    if (profile.national_id) {
      if (profile.national_id.length !== 10) {
        newErrors.national_id = "کد ملی باید ۱۰ رقم باشد";
      } else if (!validateIranianNationalId(profile.national_id)) {
        newErrors.national_id = "کد ملی وارد شده معتبر نیست";
      }
    }

    // Validate phone number  
    if (profile.phone_number) {
      const phoneRegex = /^09\d{9}$/;
      if (!phoneRegex.test(profile.phone_number)) {
        newErrors.phone_number = "شماره تلفن باید با ۰۹ شروع شده و ۱۱ رقم باشد";
      }
    }

    // Validate birth_date
    if (profile.birth_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(profile.birth_date)) {
        newErrors.birth_date = "فرمت تاریخ تولد نادرست است";
      } else {
        const date = new Date(profile.birth_date);
        if (isNaN(date.getTime())) {
          newErrors.birth_date = "تاریخ تولد وارد شده معتبر نیست";
        }
      }
    }

    return newErrors;
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleUserInputChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      
      // Fetch profile data
      const response = await axiosInstance.get("/profiles/");
      
      // Handle both array and pagination format
      let profilesData = [];
      if (Array.isArray(response.data)) {
        profilesData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        profilesData = response.data.results;
      } else {
        console.warn("Profiles data is not an array:", response.data);
        profilesData = [];
      }
      
      if (profilesData.length > 0) {
        const profileData = profilesData[0];
        setProfile({
          national_id: profileData.national_id || "",
          phone_number: profileData.phone_number || "",
          birth_date: profileData.birth_date || "",
          school: profileData.school || "",
          grade: profileData.grade || "",
        });
        
        // Initialize birth date if available
        if (profileData.birth_date) {
          setBirthDate(new Date(profileData.birth_date));
        }
      }
      
      // Fetch user data from user context or API
      if (user) {
        setUserData({
          username: user.username || "",
          email: user.email || "",
          first_name: user.first_name || "",
          last_name: user.last_name || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("خطا در دریافت اطلاعات پروفایل");
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      toast.error("لطفاً خطاهای فرم را برطرف کنید");
      return;
    }

    try {
      setLoading(true);

      // Prepare user data for update
      const userUpdateData: Partial<UserData> = {};
      
      if (userData.username.trim()) {
        userUpdateData.username = userData.username.trim();
      }
      if (userData.email.trim()) {
        userUpdateData.email = userData.email.trim();
      }
      if (userData.first_name.trim()) {
        userUpdateData.first_name = userData.first_name.trim();
      }
      if (userData.last_name.trim()) {
        userUpdateData.last_name = userData.last_name.trim();
      }

      // Prepare profile data for update
      const profileData: Partial<UserProfile> = {};
      
      if (profile.national_id.trim()) {
        profileData.national_id = profile.national_id.trim();
      }
      if (profile.phone_number.trim()) {
        profileData.phone_number = profile.phone_number.trim();
      }
      if (profile.birth_date.trim()) {
        profileData.birth_date = profile.birth_date.trim();
      }
      if (profile.school.trim()) {
        profileData.school = profile.school.trim();
      }
      if (profile.grade.trim()) {
        profileData.grade = profile.grade.trim();
      }

      // Update user data if there are changes
      if (Object.keys(userUpdateData).length > 0) {
        await axiosInstance.patch("/user/", userUpdateData);
      }

      // Update profile data if there are changes
      if (Object.keys(profileData).length > 0) {
        // Get current profile to find the ID
        const profileResponse = await axiosInstance.get("/profiles/");
        const profiles = profileResponse.data?.results || profileResponse.data || [];
        
        if (profiles.length > 0) {
          const profileId = profiles[0].id;
          
          // Update using PATCH method with profile ID
          await axiosInstance.patch(`/profiles/${profileId}/`, profileData);
        } else {
          throw new Error("پروفایل یافت نشد");
        }
      }
      
      toast.success("پروفایل با موفقیت به‌روزرسانی شد");
      
      setIsEditing(false);
      await fetchProfile(); // Refresh profile data
      await fetchUser(); // Refresh user context

    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      
      // Handle validation errors from backend
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: Record<string, string | string[]>, status?: number } };
        
        // If it's a 400 error with field-specific validation errors
        if (axiosError.response?.status === 400 && axiosError.response?.data) {
          const backendErrors: FormErrors = {};
          const errorData = axiosError.response.data;
          
          // Map backend field errors to frontend errors
          if (errorData.username) {
            const errorMsg = Array.isArray(errorData.username) 
              ? errorData.username[0] 
              : errorData.username;
            backendErrors.username = translateBackendError(errorMsg);
          }
          if (errorData.email) {
            const errorMsg = Array.isArray(errorData.email)
              ? errorData.email[0]
              : errorData.email;
            backendErrors.email = translateBackendError(errorMsg);
          }
          if (errorData.first_name) {
            const errorMsg = Array.isArray(errorData.first_name)
              ? errorData.first_name[0]
              : errorData.first_name;
            backendErrors.first_name = translateBackendError(errorMsg);
          }
          if (errorData.last_name) {
            const errorMsg = Array.isArray(errorData.last_name)
              ? errorData.last_name[0]
              : errorData.last_name;
            backendErrors.last_name = translateBackendError(errorMsg);
          }
          if (errorData.national_id) {
            const errorMsg = Array.isArray(errorData.national_id) 
              ? errorData.national_id[0] 
              : errorData.national_id;
            backendErrors.national_id = translateBackendError(errorMsg);
          }
          if (errorData.phone_number) {
            const errorMsg = Array.isArray(errorData.phone_number)
              ? errorData.phone_number[0]
              : errorData.phone_number;
            backendErrors.phone_number = translateBackendError(errorMsg);
          }
          if (errorData.birth_date) {
            const errorMsg = Array.isArray(errorData.birth_date)
              ? errorData.birth_date[0]
              : errorData.birth_date;
            backendErrors.birth_date = translateBackendError(errorMsg);
          }
          if (errorData.school) {
            const errorMsg = Array.isArray(errorData.school)
              ? errorData.school[0]
              : errorData.school;
            backendErrors.school = translateBackendError(errorMsg);
          }
          if (errorData.grade) {
            const errorMsg = Array.isArray(errorData.grade)
              ? errorData.grade[0]
              : errorData.grade;
            backendErrors.grade = translateBackendError(errorMsg);
          }
          
          // Set the errors to display in the form
          setErrors(backendErrors);
          toast.error("لطفاً خطاهای فرم را برطرف کنید");
          return;
        }
      }
      
      let errorMessage = "خطا در به‌روزرسانی پروفایل";
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // const formatDate = (dateString: string) => {
  //   if (!dateString) return "تعیین نشده";
  //   return new Date(dateString).toLocaleDateString("fa-IR");
  // };

  // const getGradeLabel = (grade: string) => {
  //   const grades: Record<string, string> = {
  //     "10": "دهم",
  //     "11": "یازدهم",
  //     "12": "دوازدهم",
  //   };
  //   return grades[grade] || grade;
  // };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            پروفایل کاربری
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic User Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">اطلاعات پایه</h3>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  شماره تلفن
                </Label>
                <Input 
                  value={userData.username} 
                  onChange={(e) => handleUserInputChange("username", e.target.value)}
                  disabled={true}
                  className={`${!isEditing ? "bg-gray-50" : ""} ${errors.username ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.username && (
                  <p className="text-sm text-red-500 mt-1">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  ایمیل
                </Label>
                <Input 
                  value={userData.email} 
                  onChange={(e) => handleUserInputChange("email", e.target.value)}
                  disabled={!isEditing}
                  className={`${!isEditing ? "bg-gray-50" : ""} ${errors.email ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  نام
                </Label>
                <Input 
                  value={userData.first_name} 
                  onChange={(e) => handleUserInputChange("first_name", e.target.value)}
                  disabled={!isEditing}
                  className={`${!isEditing ? "bg-gray-50" : ""} ${errors.first_name ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.first_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  نام‌خانوادگی
                </Label>
                <Input 
                  value={userData.last_name} 
                  onChange={(e) => handleUserInputChange("last_name", e.target.value)}
                  disabled={!isEditing}
                  className={`${!isEditing ? "bg-gray-50" : ""} ${errors.last_name ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.last_name}</p>
                )}
              </div>

              {/* <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  نقش
                </Label>
                <Input
                  value={user?.role === "student" ? "دانش‌آموز" : user?.role === "teacher" ? "معلم" : "ادمین"}
                  disabled
                />
              </div> */}
            </div>

            {/* Profile Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">عملیات</h3>

              <div className="flex gap-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} className="flex-1">
                    <Edit className="w-4 h-4 ml-2" />
                    ویرایش پروفایل
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">
                      انصراف
                    </Button>
                    <Button type="submit" form="profile-form" disabled={loading} className="flex-1">
                      {loading ? "در حال ذخیره..." : (
                        <>
                          <Save className="w-4 h-4 ml-2" />
                          ذخیره تغییرات
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>

              {profile.national_id && (
                <div className="p-3 bg-green-500/5 border border-green-500/50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm font-medium">کد ملی تأیید شده</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>اطلاعات تکمیلی</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
            {/* {!isEditing && ( */}
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="national_id" className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      کد ملی
                    </Label>
                    <Input
                      id="national_id"
                      type="text"
                      value={profile.national_id}
                      onChange={(e) => handleInputChange("national_id", e.target.value)}
                      placeholder="کد ملی ۱۰ رقمی"
                      maxLength={10}
                      disabled={!isEditing}
                      className={`${!isEditing ? "bg-gray-50" : ""} ${errors.national_id ? "border-red-500 focus:border-red-500" : ""}`}
                    />
                    {errors.national_id && (
                      <p className="text-sm text-red-500 mt-1">{errors.national_id}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school" className="flex items-center gap-2">
                      <School className="w-4 h-4" />
                      مرکز آموزشی
                    </Label>
                    <Input
                      id="school"
                      value={profile.school}
                      onChange={(e) => handleInputChange("school", e.target.value)}
                      placeholder="نام مدرسه یا مرکز آموزشی"
                      maxLength={200}
                      disabled={!isEditing}
                      className={`${!isEditing ? "bg-gray-50" : ""} ${errors.school ? "border-red-500 focus:border-red-500" : ""}`}
                    />
                    {errors.school && (
                      <p className="text-sm text-red-500 mt-1">{errors.school}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birth_date" className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      تاریخ تولد
                    </Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="birth_date"
                          className={`w-full justify-between font-normal ${!isEditing ? "bg-gray-50" : ""} ${errors.birth_date ? "border-red-500" : ""}`}
                          disabled={!isEditing}
                        >
                          {birthDate ? birthDate.toLocaleDateString('fa-IR') : "انتخاب تاریخ تولد"}
                          <ChevronDownIcon className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={birthDate}
                          captionLayout="dropdown"
                          onSelect={(date) => {
                            setBirthDate(date);
                            if (date) {
                              handleInputChange("birth_date", date.toISOString().split('T')[0]);
                            }
                            setCalendarOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.birth_date && (
                      <p className="text-sm text-red-500 mt-1">{errors.birth_date}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade" className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      پایه تحصیلی
                    </Label>
                    <Select
                      value={profile.grade}
                      onValueChange={(value) => handleInputChange("grade", value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className={`${!isEditing ? "bg-gray-50" : ""} ${errors.grade ? "border-red-500" : ""}`}>
                        <SelectValue placeholder="پایه را انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">دهم</SelectItem>
                        <SelectItem value="11">یازدهم</SelectItem>
                        <SelectItem value="12">دوازدهم</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.grade && (
                      <p className="text-sm text-red-500 mt-1">{errors.grade}</p>
                    )}
                  </div>
                </div>
              </>
            {/* )} */}
          </form>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle>امنیت حساب کاربری</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">تغییر رمز عبور</h4>
                <p className="text-sm text-muted-foreground">رمز عبور خود را به‌روزرسانی کنید</p>
              </div>
              <Button variant="outline" size="sm">
                تغییر رمز
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">تغییر شماره تلفن</h4>
                <p className="text-sm text-muted-foreground">شماره تلفن خود را به‌روزرسانی کنید</p>
              </div>
              <Button variant="outline" size="sm">
                تغییر شماره
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">احراز هویت دو مرحله‌ای</h4>
                <p className="text-sm text-muted-foreground">امنیت بیشتر برای حساب کاربری</p>
              </div>
              <Button variant="outline" size="sm">
                فعال‌سازی
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
