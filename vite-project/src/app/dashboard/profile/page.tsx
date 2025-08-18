import { useState, useEffect } from "react";
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
import { User, Mail, Phone, Calendar, GraduationCap, CreditCard, Save, Edit } from "lucide-react";

interface UserProfile {
  national_id: string;
  phone_number: string;
  birth_date: string;
  grade: string;
}

export default function ProfilePage() {
  const { user, fetchUser } = useUser();
  // const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    national_id: "",
    phone_number: "",
    birth_date: "",
    grade: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await axiosInstance.get("/profiles/");
      if (response.data && response.data.length > 0) {
        const profileData = response.data[0];
        setProfile({
          national_id: profileData.national_id || "",
          phone_number: profileData.phone_number || "",
          birth_date: profileData.birth_date || "",
          grade: profileData.grade || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("خطا در دریافت اطلاعات پروفایل"
        //   {
        //   title: "خطا",
        //   description: "خطا در دریافت اطلاعات پروفایل",
        //   variant: "destructive",
        // }
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const profileData = {
        national_id: profile.national_id,
        phone_number: profile.phone_number,
        birth_date: profile.birth_date,
        grade: profile.grade,
      };

      await axiosInstance.put("/profiles/", profileData);

      toast.success("پروفایل با موفقیت به‌روزرسانی شد");

      setIsEditing(false);
      await fetchProfile(); // Refresh profile data
      await fetchUser(); // Refresh user context

    } catch (error: any) {
      console.error("Error updating profile:", error);
      // toast({
      //   title: "خطا",
      //   description: error.response?.data?.message || "خطا در به‌روزرسانی پروفایل",
      //   variant: "destructive",
      // });
      toast.error(error.response?.data?.message || "خطا در به‌روزرسانی پروفایل");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "تعیین نشده";
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  const getGradeLabel = (grade: string) => {
    const grades: Record<string, string> = {
      "10": "دهم",
      "11": "یازدهم",
      "12": "دوازدهم",
    };
    return grades[grade] || grade;
  };

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
                  <User className="w-4 h-4" />
                  نام کاربری
                </Label>
                <Input value={user?.username || ""} disabled />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  ایمیل
                </Label>
                <Input value={user?.email || ""} disabled />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  نام
                </Label>
                <Input value={user?.first_name || ""} disabled />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  نام‌خانوادگی
                </Label>
                <Input value={user?.last_name || ""} disabled />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  نقش
                </Label>
                <Input
                  value={user?.role === "student" ? "دانش‌آموز" : user?.role === "teacher" ? "معلم" : "ادمین"}
                  disabled
                />
              </div>
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
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      شماره تلفن
                    </Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      value={profile.phone_number}
                      onChange={(e) => handleInputChange("phone_number", e.target.value)}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      maxLength={11}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birth_date" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      تاریخ تولد
                    </Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={profile.birth_date}
                      onChange={(e) => handleInputChange("birth_date", e.target.value)}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
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
                      <SelectTrigger className={!isEditing ? "bg-gray-50" : ""}>
                        <SelectValue placeholder="پایه را انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">دهم</SelectItem>
                        <SelectItem value="11">یازدهم</SelectItem>
                        <SelectItem value="12">دوازدهم</SelectItem>
                      </SelectContent>
                    </Select>
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
