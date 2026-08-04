import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Tag, Percent, DollarSign, Calendar } from "lucide-react";
import { couponsApi, type Coupon, type CouponPayload } from "@/api/coupons";
import axiosInstance from "@/lib/axios";
import { DatePicker } from "@/components/ui/date-picker";

interface CourseOption {
  id: number;
  title: string;
}

export default function CouponsList() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CouponPayload>({
    code: "",
    discount_type: "percentage",
    discount_value: 10,
    max_uses: 0,
    min_purchase_amount: 0,
    valid_from: new Date().toISOString(),
    valid_until: null,
    is_active: true,
    courses: [],
  });
  const [validUntilDate, setValidUntilDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchCoupons();
    fetchCourses();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const data = await couponsApi.getCoupons();
      setCoupons(data);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("خطا در دریافت کدهای تخفیف");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axiosInstance.get("/teacher-courses/");
      let courseData: CourseOption[] = [];
      if (Array.isArray(response.data)) {
        courseData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        courseData = response.data.results;
      }
      setCourses(courseData);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: 10,
      max_uses: 0,
      min_purchase_amount: 0,
      valid_from: new Date().toISOString(),
      valid_until: null,
      is_active: true,
      courses: [],
    });
    setValidUntilDate(undefined);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_uses: coupon.max_uses,
      min_purchase_amount: coupon.min_purchase_amount,
      valid_from: coupon.valid_from ? new Date(coupon.valid_from).toISOString() : new Date().toISOString(),
      valid_until: coupon.valid_until ? new Date(coupon.valid_until).toISOString() : null,
      is_active: coupon.is_active,
      courses: coupon.courses || [],
    });
    setValidUntilDate(coupon.valid_until ? new Date(coupon.valid_until) : undefined);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("آیا از حذف این کد تخفیف اطمینان دارید؟")) return;
    try {
      await couponsApi.deleteCoupon(id);
      toast.success("کد تخفیف با موفقیت حذف شد");
      fetchCoupons();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("خطا در حذف کد تخفیف");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error("وارد کردن کد تخفیف الزامی است");
      return;
    }
    if (formData.discount_value <= 0) {
      toast.error("مقدار تخفیف باید بزرگتر از صفر باشد");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCoupon) {
        await couponsApi.updateCoupon(editingCoupon.id, formData);
        toast.success("کد تخفیف با موفقیت ویرایش شد");
      } else {
        await couponsApi.createCoupon(formData);
        toast.success("کد تخفیف با موفقیت ایجاد شد");
      }
      setIsDialogOpen(false);
      fetchCoupons();
    } catch (error: any) {
      console.error("Error saving coupon:", error);
      const errMsg = error.response?.data?.code?.[0] || error.response?.data?.detail || "خطا در ثبت کد تخفیف";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.discount_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fa-IR").format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">در حال بارگذاری کدهای تخفیف...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tag className="w-8 h-8 text-primary" />
            مدیریت کدهای تخفیف
          </h1>
          <p className="text-muted-foreground mt-1">
            تعریف، ویرایش و مدیریت کوپن‌های تخفیف دوره‌ها و محصولات
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          ایجاد کد تخفیف جدید
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="جستجوی کد تخفیف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Coupon List Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست کدهای تخفیف ({filteredCoupons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCoupons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              کد تخفیفی یافت نشد. برای ایجاد، روی «ایجاد کد تخفیف جدید» کلیک کنید.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50 text-sm font-medium">
                    <th className="p-3">کد تخفیف</th>
                    <th className="p-3">نوع و مقدار</th>
                    <th className="p-3">محدودیت استفاده</th>
                    <th className="p-3">حداقل خرید</th>
                    <th className="p-3">تاریخ اعتبار</th>
                    <th className="p-3">وضعیت</th>
                    <th className="p-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {filteredCoupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-muted/20">
                      <td className="p-3 font-mono font-bold text-base text-primary">
                        {coupon.code}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 font-medium">
                          {coupon.discount_type === "percentage" ? (
                            <>
                              <Percent className="w-4 h-4 text-amber-500" />
                              <span>{coupon.discount_value}٪ تخفیف</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 text-emerald-500" />
                              <span>{formatPrice(coupon.discount_value)} تومان</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {coupon.max_uses > 0 ? (
                          <span>
                            {coupon.used_count} از {coupon.max_uses} استفاده
                          </span>
                        ) : (
                          <span className="text-muted-foreground">نامحدود ({coupon.used_count} استفاده)</span>
                        )}
                      </td>
                      <td className="p-3">
                        {coupon.min_purchase_amount > 0 ? (
                          <span>{formatPrice(coupon.min_purchase_amount)} تومان</span>
                        ) : (
                          <span className="text-muted-foreground">بدون حداقل</span>
                        )}
                      </td>
                      <td className="p-3 dir-ltr text-right">
                        {coupon.valid_until ? (
                          <span className="flex items-center gap-1 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(coupon.valid_until).toLocaleDateString("fa-IR")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">همیشگی</span>
                        )}
                      </td>
                      <td className="p-3">
                        {!coupon.is_active ? (
                          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                            غیرفعال
                          </Badge>
                        ) : coupon.is_expired ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                            منقضی شده
                          </Badge>
                        ) : coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses ? (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                            تکمیل شده
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                            فعال
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(coupon)}
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(coupon.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Coupon Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "ویرایش کد تخفیف" : "ایجاد کد تخفیف جدید"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Label>کد تخفیف (یکتا)</Label>
              <Input
                placeholder="مثال: SUMMER1403"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                className="font-mono text-left uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>نوع تخفیف</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(val: "percentage" | "fixed") =>
                    setFormData({ ...formData, discount_type: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">درصدی (٪)</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت (تومان)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  {formData.discount_type === "percentage" ? "درصد تخفیف (۱ تا ۱۰۰)" : "مبلغ تخفیف (تومان)"}
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_value: Number(e.target.value) })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>حداکثر دفعات استفاده (۰ = نامحدود)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.max_uses}
                  onChange={(e) =>
                    setFormData({ ...formData, max_uses: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <Label>حداقل مبلغ خرید (تومان)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.min_purchase_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, min_purchase_amount: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div>
              <Label>تاریخ انقضا (اختیاری)</Label>
              <DatePicker
                date={validUntilDate}
                setDate={(date) => {
                  setValidUntilDate(date);
                  setFormData({
                    ...formData,
                    valid_until: date ? date.toISOString() : null,
                  });
                }}
                placeholder="انتخاب تاریخ انقضا"
              />
            </div>

            <div>
              <Label>دوره مرتبط (اختیاری - خالی برای تمام دوره‌ها)</Label>
              <Select
                value={formData.courses?.[0] ? String(formData.courses[0]) : "all"}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    courses: val === "all" ? [] : [Number(val)],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب دوره" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه دوره‌ها / عمومی</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={String(course.id)}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4 flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                انصراف
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "در حال ثبت..." : editingCoupon ? "ویرایش کد" : "ایجاد کد تخفیف"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
