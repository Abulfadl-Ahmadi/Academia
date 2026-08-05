import { useState, useEffect } from "react"
import axiosInstance from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import TeacherProfileEdit from "./TeacherProfileEdit"
import { useUser } from "@/context/UserContext"

export default function TeacherProfilePage() {
  const [teacher, setTeacher] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const { user } = useUser()
  
  // Password Change State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("لطفاً تمامی فیلدها را پر کنید");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("رمز عبور جدید و تکرار آن یکسان نیستند");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("رمز عبور جدید باید حداقل ۶ کاراکتر باشد");
      return;
    }
    
    try {
      setPasswordLoading(true);
      await axiosInstance.post('/accounts/change-password/', {
        old_password: passwordForm.oldPassword,
        new_password: passwordForm.newPassword,
        new_password_confirm: passwordForm.confirmPassword
      });
      toast.success("رمز عبور با موفقیت تغییر کرد");
      setIsPasswordModalOpen(false);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.data?.new_password) {
        toast.error(error.response.data.new_password[0]);
      } else {
        toast.error("خطا در تغییر رمز عبور");
      }
    } finally {
      setPasswordLoading(false);
    }
  };
  
  useEffect(() => {
    const fetchTeacherProfile = async () => {
      if (!user) {
        console.log('No user available, waiting...');
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching teacher profile for user:', user);
        const response = await axiosInstance.get(`/profiles/`);
        console.log('Profile API response:', response.data);
        
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
          const profile = profilesData[0];
          console.log('Found profile data:', profile);
          // Combine user data with profile data
          const teacherData = {
            ...profile,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            email: user.email
          };
          console.log('Setting teacher data:', teacherData);
          setTeacher(teacherData);
        } else {
          console.log('No profile found, using user data');
          // If no profile found, use user data
          const fallbackData = {
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            email: user.email,
            national_id: '',
            phone_number: ''
          };
          console.log('Setting fallback data:', fallbackData);
          setTeacher(fallbackData);
        }
      } catch (error) {
        console.error('Error fetching teacher profile:', error);
        // Fallback to user data
        const errorFallbackData = {
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          email: user.email,
          national_id: '',
          phone_number: ''
        };
        console.log('Setting error fallback data:', errorFallbackData);
        setTeacher(errorFallbackData);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    if (user) {
      fetchTeacherProfile();
    } else {
      console.log('User not loaded yet, setting loading to false');
      setLoading(false);
    }
  }, [user, open]);

  if (!user) return <div>در حال بارگذاری اطلاعات کاربر...</div>
  if (loading) return <div>در حال بارگذاری اطلاعات...</div>

  console.log('Render - user:', user, 'loading:', loading, 'teacher:', teacher);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-4">پروفایل</h2>
      {teacher ? (
        <div className="sm:max-w-[650px] space-y-2 rounded-xl p-4 border">
          <div className="flex space-x-4">
            <div className="flex flex-col space-y-2">
              <span className="font-semibold">نام:</span>
              <span>{teacher.first_name || 'نامشخص'}</span>
            </div>
            <div className="flex flex-col space-y-2">
              <span className="font-semibold">نام خانوادگی:</span>
              <span>{teacher.last_name || 'نامشخص'}</span>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <span className="font-semibold">کد ملی:</span>
            <span>{teacher.national_id || 'وارد نشده'}</span>
          </div>
          <div className="flex flex-col space-y-2">
            <span className="font-semibold">شماره تلفن:</span>
            <span>{teacher.phone_number || 'وارد نشده'}</span>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">ویرایش پروفایل</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ویرایش پروفایل</DialogTitle>
              </DialogHeader>
              <TeacherProfileEdit
                teacherId={parseInt(user.username)}
                initialData={teacher}
                onUpdated={data => { setTeacher(data); setOpen(false); }}
              />
            </DialogContent>
          </Dialog>
          <div className="flex flex-col space-y-4 pt-4 border-t mt-4">
            <h3 className="font-bold">امنیت حساب کاربری</h3>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">تغییر رمز عبور</h4>
                <p className="text-sm text-muted-foreground">رمز عبور خود را به‌روزرسانی کنید</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsPasswordModalOpen(true)}>
                تغییر رمز
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div>اطلاعات پروفایل یافت نشد</div>
      )}

      {/* Password Change Dialog */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تغییر رمز عبور</DialogTitle>
            <DialogDescription>
              رمز عبور جدید خود را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="old-password">رمز عبور فعلی</Label>
              <Input
                id="old-password"
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">رمز عبور جدید</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">تکرار رمز عبور جدید</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
              انصراف
            </Button>
            <Button onClick={handleChangePassword} disabled={passwordLoading}>
              {passwordLoading ? "در حال ثبت..." : "ثبت رمز جدید"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
