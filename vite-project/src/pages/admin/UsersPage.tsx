import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  User, 
  Shield, 
  Search, 
  MoreHorizontal, 
  Ban, 
  CheckCircle, 
  School, 
  GraduationCap, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw,
  SlidersHorizontal
} from "lucide-react";
import { Pagination } from "@/components/Pagination";
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
  school?: string;
  phone_number?: string;
  grade?: string;
}

interface PaginationInfo {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sorting
  const [sortField, setSortField] = useState<string>("date_joined");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    count: 0,
    total_pages: 1,
    current_page: 1,
    page_size: 20,
    next: null,
    previous: null,
  });
  
  // Edit modal state
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (gradeFilter !== "all") params.append("grade", gradeFilter);
      if (statusFilter === "active") params.append("is_active", "true");
      if (statusFilter === "inactive") params.append("is_active", "false");
      
      const orderingParam = sortOrder === "desc" ? `-${sortField}` : sortField;
      params.append("ordering", orderingParam);
      params.append("page", page.toString());
      params.append("page_size", pageSize.toString());
      
      const response = await axiosInstance.get(`/admin/users/?${params.toString()}`);
      
      if (response.data && response.data.results) {
        setUsers(response.data.results);
        setPaginationInfo({
          count: response.data.count ?? 0,
          total_pages: response.data.total_pages ?? Math.max(1, Math.ceil((response.data.count ?? 0) / pageSize)),
          current_page: response.data.current_page ?? page,
          page_size: response.data.page_size ?? pageSize,
          next: response.data.next ?? null,
          previous: response.data.previous ?? null,
        });
      } else if (Array.isArray(response.data)) {
        setUsers(response.data);
        setPaginationInfo({
          count: response.data.length,
          total_pages: 1,
          current_page: 1,
          page_size: response.data.length || pageSize,
          next: null,
          previous: null,
        });
      } else {
        setUsers([]);
        setPaginationInfo({
          count: 0,
          total_pages: 1,
          current_page: 1,
          page_size: pageSize,
          next: null,
          previous: null,
        });
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
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter, gradeFilter, statusFilter, sortField, sortOrder, page, pageSize]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "date_joined" ? "desc" : "asc");
    }
    setPage(1);
  };

  const handleQuickSortChange = (value: string) => {
    if (value.startsWith("-")) {
      setSortField(value.substring(1));
      setSortOrder("desc");
    } else {
      setSortField(value);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const currentSortValue = `${sortOrder === "desc" ? "-" : ""}${sortField}`;

  const hasActiveFilters = 
    searchQuery.trim() !== "" || 
    roleFilter !== "all" || 
    gradeFilter !== "all" || 
    statusFilter !== "all" || 
    sortField !== "date_joined" || 
    sortOrder !== "desc";

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setGradeFilter("all");
    setStatusFilter("all");
    setSortField("date_joined");
    setSortOrder("desc");
    setPage(1);
  };

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

  const getGradeLabel = (grade?: string) => {
    if (!grade) return null;
    const grades: Record<string, string> = {
      '10': 'پایه دهم',
      '11': 'پایه یازدهم',
      '12': 'پایه دوازدهم',
    };
    return grades[grade] || `پایه ${grade}`;
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary ml-1" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary ml-1" />
    );
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">مدیریت کاربران</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مشاهده، فیلتر، مرتب‌سازی و مدیریت دسترسی کاربران ({paginationInfo.count.toLocaleString('fa-IR')} کاربر)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b px-6 py-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 justify-between lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در نام، نام کاربری، ایمیل، موبایل، مدرسه..."
                className="pr-9 h-9"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Quick Sort dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                مرتب‌سازی:
              </span>
              <Select value={currentSortValue} onValueChange={handleQuickSortChange}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-date_joined">جدیدترین کاربران</SelectItem>
                  <SelectItem value="date_joined">قدیمی‌ترین کاربران</SelectItem>
                  <SelectItem value="first_name">نام (الف - ی)</SelectItem>
                  <SelectItem value="-first_name">نام (ی - الف)</SelectItem>
                  <SelectItem value="profile__school">مرکز آموزشی (الف - ی)</SelectItem>
                  <SelectItem value="-profile__grade">مقطع تحصیلی (نزولی)</SelectItem>
                  <SelectItem value="profile__grade">مقطع تحصیلی (صعودی)</SelectItem>
                  <SelectItem value="role">نقش کاربری</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Role Filter */}
            <div className="w-[140px] sm:w-[150px]">
              <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="نقش" />
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

            {/* Grade Filter */}
            <div className="w-[140px] sm:w-[150px]">
              <Select value={gradeFilter} onValueChange={(val) => { setGradeFilter(val); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="مقطع تحصیلی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه مقاطع</SelectItem>
                  <SelectItem value="10">پایه دهم</SelectItem>
                  <SelectItem value="11">پایه یازدهم</SelectItem>
                  <SelectItem value="12">پایه دوازدهم</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-[130px] sm:w-[140px]">
              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">فقط فعال</SelectItem>
                  <SelectItem value="inactive">فقط غیرفعال</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                پاک کردن فیلترها
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-b select-none">
                <tr>
                  <th 
                    className="px-6 py-3 font-medium cursor-pointer group hover:text-foreground transition-colors"
                    onClick={() => handleSort("first_name")}
                  >
                    <div className="flex items-center">
                      <span>کاربر</span>
                      {renderSortIcon("first_name")}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 font-medium cursor-pointer group hover:text-foreground transition-colors"
                    onClick={() => handleSort("profile__school")}
                  >
                    <div className="flex items-center">
                      <span>مرکز آموزشی / مدرسه</span>
                      {renderSortIcon("profile__school")}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 font-medium cursor-pointer group hover:text-foreground transition-colors"
                    onClick={() => handleSort("profile__grade")}
                  >
                    <div className="flex items-center">
                      <span>مقطع تحصیلی</span>
                      {renderSortIcon("profile__grade")}
                    </div>
                  </th>
                  <th className="px-6 py-3 font-medium">اطلاعات تماس</th>
                  <th 
                    className="px-6 py-3 font-medium cursor-pointer group hover:text-foreground transition-colors"
                    onClick={() => handleSort("role")}
                  >
                    <div className="flex items-center">
                      <span>نقش</span>
                      {renderSortIcon("role")}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 font-medium cursor-pointer group hover:text-foreground transition-colors"
                    onClick={() => handleSort("is_active")}
                  >
                    <div className="flex items-center">
                      <span>وضعیت</span>
                      {renderSortIcon("is_active")}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 font-medium cursor-pointer group hover:text-foreground transition-colors"
                    onClick={() => handleSort("date_joined")}
                  >
                    <div className="flex items-center">
                      <span>تاریخ عضویت</span>
                      {renderSortIcon("date_joined")}
                    </div>
                  </th>
                  <th className="px-6 py-3 font-medium w-16">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                      در حال بارگذاری...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                      هیچ کاربری با این مشخصات یافت نشد
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.first_name || user.last_name 
                                ? `${user.first_name} ${user.last_name}` 
                                : 'بدون نام'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 font-mono" dir="ltr">{user.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* School / Center Column */}
                      <td className="px-6 py-4">
                        {user.school ? (
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <School className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{user.school}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40 text-xs">—</span>
                        )}
                      </td>

                      {/* Grade Column */}
                      <td className="px-6 py-4">
                        {user.grade ? (
                          <Badge variant="secondary" className="font-normal text-xs bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40 flex items-center gap-1 w-fit">
                            <GraduationCap className="h-3 w-3" />
                            {getGradeLabel(user.grade)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/40 text-xs">—</span>
                        )}
                      </td>

                      {/* Contact Column */}
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="flex flex-col gap-0.5">
                          {user.email && (
                            <span className="dir-ltr text-right text-xs">{user.email}</span>
                          )}
                          {user.phone_number && (
                            <span className="dir-ltr text-right text-xs font-mono text-muted-foreground">{user.phone_number}</span>
                          )}
                          {!user.email && !user.phone_number && (
                            <span className="text-muted-foreground/40 text-xs">—</span>
                          )}
                        </div>
                      </td>

                      {/* Role Column */}
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

                      {/* Status Column */}
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

                      {/* Date Joined Column */}
                      <td className="px-6 py-4 text-muted-foreground text-xs font-mono">
                        {new Date(user.date_joined).toLocaleDateString('fa-IR')}
                      </td>

                      {/* Actions Column */}
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

          {/* Pagination */}
          {paginationInfo.count > 0 && (
            <div className="px-6 border-t">
              <Pagination
                paginationInfo={paginationInfo}
                onPageChange={(newPage) => setPage(newPage)}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
                disabled={loading}
              />
            </div>
          )}
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
