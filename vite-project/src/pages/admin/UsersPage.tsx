import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { User, Shield, Search, MoreHorizontal, Ban, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserType {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  date_joined: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  // Edit modal state
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (roleFilter !== "all") params.append("role", roleFilter);
      
      const response = await axiosInstance.get(`/admin/users/?${params.toString()}`);
      
      if (response.data.results) {
        setUsers(response.data.results);
      } else if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      toast.error("خطا در دریافت لیست کاربران");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter]);

  const toggleUserStatus = async (user: UserType) => {
    try {
      await axiosInstance.patch(`/admin/users/${user.id}/`, {
        is_active: !user.is_active
      });
      toast.success(`کاربر با موفقیت ${user.is_active ? 'غیرفعال' : 'فعال'} شد`);
      
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, is_active: !u.is_active } : u
      ));
    } catch (error) {
      toast.error("عملیات با خطا مواجه شد");
    }
  };

  const saveUserRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      await axiosInstance.patch(`/admin/users/${editingUser.id}/`, {
        role: editingUser.role
      });
      toast.success("نقش کاربر با موفقیت بروزرسانی شد");
      
      setUsers(users.map(u => 
        u.id === editingUser.id ? { ...u, role: editingUser.role } : u
      ));
      setEditingUser(null);
    } catch (error) {
      toast.error("خطا در بروزرسانی نقش کاربر");
    }
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      student: 'دانش‌آموز',
      teacher: 'استاد',
      admin: 'مدیر کل',
      support: 'پشتیبان',
      content_creator: 'تولید محتوا',
      finance: 'مالی'
    };
    return roles[role] || role;
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">مدیریت کاربران</h1>
          <p className="mt-1 text-sm text-muted-foreground">مشاهده و مدیریت سطح دسترسی تمام کاربران سیستم</p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
            <div className="relative max-w-sm w-full">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در نام، ایمیل، موبایل..."
                className="pr-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-[200px]">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="فیلتر بر اساس نقش" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه نقش‌ها</SelectItem>
                  <SelectItem value="student">دانش‌آموز</SelectItem>
                  <SelectItem value="teacher">استاد</SelectItem>
                  <SelectItem value="admin">مدیر کل</SelectItem>
                  <SelectItem value="support">پشتیبانی</SelectItem>
                  <SelectItem value="content_creator">تولید محتوا</SelectItem>
                  <SelectItem value="finance">مالی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">کاربر</th>
                  <th className="px-6 py-3 font-medium">ایمیل</th>
                  <th className="px-6 py-3 font-medium">نقش</th>
                  <th className="px-6 py-3 font-medium">وضعیت</th>
                  <th className="px-6 py-3 font-medium">تاریخ عضویت</th>
                  <th className="px-6 py-3 font-medium w-16">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      در حال بارگذاری...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      هیچ کاربری یافت نشد
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full text-primary">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.first_name || user.last_name 
                                ? `${user.first_name} ${user.last_name}` 
                                : 'بدون نام'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5" dir="ltr">{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground dir-ltr text-left">
                        {user.email || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`font-normal ${
                          user.role === 'admin' ? 'border-red-200 text-red-600 bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:bg-red-500/10' :
                          user.role === 'teacher' ? 'border-blue-200 text-blue-600 bg-blue-50 dark:border-blue-500/30 dark:text-blue-400 dark:bg-blue-500/10' :
                          user.role === 'student' ? 'border-green-200 text-green-600 bg-green-50 dark:border-green-500/30 dark:text-green-400 dark:bg-green-500/10' :
                          'border-orange-200 text-orange-600 bg-orange-50 dark:border-orange-500/30 dark:text-orange-400 dark:bg-orange-500/10'
                        }`}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-green-600 text-xs font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span> فعال
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground"></span> غیرفعال
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(user.date_joined).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>عملیات</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setEditingUser(user)}>
                              <Shield className="h-4 w-4 ml-2" />
                              تغییر نقش
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => toggleUserStatus(user)}
                              className={user.is_active ? "text-red-600 focus:text-red-600" : "text-green-600 focus:text-green-600"}
                            >
                              {user.is_active ? (
                                <><Ban className="h-4 w-4 ml-2" /> مسدود کردن</>
                              ) : (
                                <><CheckCircle className="h-4 w-4 ml-2" /> فعال کردن</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <h2 className="text-lg font-semibold">ویرایش نقش کاربر</h2>
              <p className="text-sm text-muted-foreground">
                تغییر سطح دسترسی برای {editingUser.first_name} {editingUser.last_name}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveUserRole} className="space-y-4">
                <div className="space-y-2">
                  <Label>نقش در سیستم</Label>
                  <Select 
                    value={editingUser.role} 
                    onValueChange={(val) => setEditingUser({...editingUser, role: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">دانش‌آموز</SelectItem>
                      <SelectItem value="teacher">استاد</SelectItem>
                      <SelectItem value="admin">مدیر کل</SelectItem>
                      <SelectItem value="support">پشتیبانی</SelectItem>
                      <SelectItem value="content_creator">تولید محتوا</SelectItem>
                      <SelectItem value="finance">مالی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-3 justify-end pt-4 mt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                    انصراف
                  </Button>
                  <Button type="submit">
                    ذخیره تغییرات
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
