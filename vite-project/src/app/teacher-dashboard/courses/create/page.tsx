import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import {
  BookOpen,
  Calendar,
  Plus,
  X,
  Save,
  ArrowRight,
  ShoppingCart,
  DollarSign,
  Image as ImageIcon
} from "lucide-react";

interface CourseSchedule {
  day: number;
  time: string;
}

interface CreateCourseForm {
  title: string;
  description: string;
  is_active: boolean;
  schedules: CourseSchedule[];
}

interface CreateProductForm {
  title: string;
  description: string;
  price: number;
  is_active: boolean;
  create_product: boolean;
  image?: File;
}

const DAYS = [
  { value: 0, label: "شنبه" },
  { value: 1, label: "یکشنبه" },
  { value: 2, label: "دوشنبه" },
  { value: 3, label: "سه‌شنبه" },
  { value: 4, label: "چهارشنبه" },
  { value: 5, label: "پنج‌شنبه" },
  { value: 6, label: "جمعه" },
];

export default function CreateCoursePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    course?: { title?: string };
    product?: { title?: string; description?: string; price?: string };
  }>({});

  const [courseForm, setCourseForm] = useState<CreateCourseForm>({
    title: "",
    description: "",
    is_active: true,
    schedules: [],
  });

  const [productForm, setProductForm] = useState<CreateProductForm>({
    title: "",
    description: "",
    price: 0,
    is_active: true,
    create_product: true,
  });

  const handleCourseInputChange = (field: keyof CreateCourseForm, value: string | boolean | CourseSchedule[]) => {
    setCourseForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error for this field
    if (field === 'title' && validationErrors.course?.title) {
      setValidationErrors(prev => ({
        ...prev,
        course: { ...prev.course, title: undefined }
      }));
    }
  };

  const handleProductInputChange = (field: keyof CreateProductForm, value: string | number | boolean | File | undefined) => {
    setProductForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error for this field
    if (validationErrors.product) {
      const newProductErrors = { ...validationErrors.product };
      if (field === 'title' && newProductErrors.title) {
        newProductErrors.title = undefined;
      }
      if (field === 'description' && newProductErrors.description) {
        newProductErrors.description = undefined;
      }
      if (field === 'price' && newProductErrors.price) {
        newProductErrors.price = undefined;
      }

      setValidationErrors(prev => ({
        ...prev,
        product: newProductErrors
      }));
    }
  };

  const addSchedule = () => {
    setCourseForm(prev => ({
      ...prev,
      schedules: [...prev.schedules, { day: 0, time: "09:00" }]
    }));
  };

  const removeSchedule = (index: number) => {
    setCourseForm(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index)
    }));
  };

  const updateSchedule = (index: number, field: keyof CourseSchedule, value: string | number) => {
    setCourseForm(prev => ({
      ...prev,
      schedules: prev.schedules.map((schedule, i) =>
        i === index ? { ...schedule, [field]: value } : schedule
      )
    }));
  };

  const validateForm = () => {
    const errors: {
      course?: { title?: string };
      product?: { title?: string; description?: string; price?: string };
    } = {};

    // Validate course fields
    if (!courseForm.title.trim()) {
      errors.course = { ...errors.course, title: "عنوان دوره الزامی است" };
    }

    // Validate product fields if creating product
    if (productForm.create_product) {
      if (!productForm.title.trim()) {
        errors.product = { ...errors.product, title: "عنوان محصول الزامی است" };
      }
      if (!productForm.description.trim()) {
        errors.product = { ...errors.product, description: "توضیحات محصول الزامی است" };
      }
      if (productForm.price < 0) {
        errors.product = { ...errors.product, price: "قیمت نمی‌تواند منفی باشد" };
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submitting
    if (!validateForm()) {
      toast.error("لطفاً فیلدهای الزامی را تکمیل کنید");
      return;
    }

    setLoading(true);

    try {
      // Create the course
      const courseResponse = await axiosInstance.post("/courses/", {
        title: courseForm.title.trim(),
        description: courseForm.description.trim(),
        is_active: courseForm.is_active,
      });

      const courseId = courseResponse.data.id;
      
      // Check VOD channel and stream status
      if (courseResponse.data.vod_channel_created === false) {
        toast.warning(courseResponse.data.vod_warning || "امکان آپلود ویدیو فعال نیست");
      }
      
      if (courseResponse.data.stream_created === false) {
        toast.warning(courseResponse.data.stream_warning || "امکان پخش زنده فعال نیست");
      }
      
      if (courseResponse.data.vod_channel_created && courseResponse.data.stream_created) {
        toast.success("دوره با تمام امکانات (ویدیو و پخش زنده) ایجاد شد");
      } else if (courseResponse.data.vod_channel_created || courseResponse.data.stream_created) {
        toast.success("دوره ایجاد شد");
      } else {
        toast.success("دوره ایجاد شد (بدون امکانات پیشرفته)");
      }

      // Create schedules if any
      if (courseForm.schedules.length > 0) {
        for (const schedule of courseForm.schedules) {
          await axiosInstance.post("/schedules/", {
            course: courseId,
            day: schedule.day,
            time: schedule.time,
          });
        }
        toast.success("برنامه زمانی دوره نیز ثبت شد");
      }

      // Create product if requested
      if (productForm.create_product) {
        const productData = new FormData();
        productData.append('title', productForm.title.trim());
        productData.append('description', productForm.description.trim());
        productData.append('price', productForm.price.toString());
        productData.append('product_type', 'course');
        productData.append('course', courseId.toString());
        productData.append('is_active', productForm.is_active.toString());
        
        if (productForm.image) {
          productData.append('image', productForm.image);
        }

        await axiosInstance.post("/shop/products/", productData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success("محصول دوره نیز در فروشگاه ایجاد شد");
      }

      // Navigate to the course detail page
      navigate(`/panel/courses/${courseId}`);

    } catch (error) {
      console.error("Error creating course:", error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "خطا در ایجاد دوره";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // const getDayLabel = (dayValue: number) => {
  //   return DAYS.find(day => day.value === dayValue)?.label || "نامشخص";
  // };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/panel/courses")}
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            بازگشت
          </Button>
          <div>
            <h1 className="text-2xl font-bold">ایجاد دوره جدید</h1>
            <p className="text-muted-foreground">اطلاعات دوره جدید و محصول فروشگاه را وارد کنید</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Course Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              اطلاعات پایه دوره
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className={validationErrors.course?.title ? "text-red-500" : ""}>
                  عنوان دوره *
                </Label>
                <Input
                  id="title"
                  value={courseForm.title}
                  onChange={(e) => handleCourseInputChange("title", e.target.value)}
                  placeholder="مثال: ریاضی ۳"
                  className={validationErrors.course?.title ? "border-red-500 focus:border-red-500" : ""}
                  required
                />
                {validationErrors.course?.title && (
                  <p className="text-sm text-red-500">{validationErrors.course.title}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات دوره</Label>
              <Textarea
                id="description"
                value={courseForm.description}
                onChange={(e) => handleCourseInputChange("description", e.target.value)}
                placeholder="توضیحات کامل دوره، اهداف یادگیری و محتوای آموزشی..."
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                dir="ltr"
                id="is_active"
                checked={courseForm.is_active}
                onCheckedChange={(checked) => handleCourseInputChange("is_active", checked)}
              />
              <Label htmlFor="is_active">دوره فعال باشد</Label>
            </div>
          </CardContent>
        </Card>

        {/* Course Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              برنامه زمانی دوره
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              زمان‌های برگزاری جلسات دوره را مشخص کنید
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {courseForm.schedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p>هنوز برنامه زمانی تعریف نشده است</p>
                <p className="text-sm">برای اضافه کردن برنامه زمانی کلیک کنید</p>
              </div>
            ) : (
              <div className="space-y-3">
                {courseForm.schedules.map((schedule, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <Select
                          value={String(schedule.day)}
                          onValueChange={(value) => updateSchedule(index, "day", parseInt(value))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="انتخاب روز" />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS.map(day => (
                              <SelectItem key={day.value} value={String(day.value)}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Input
                          type="time"
                          value={schedule.time}
                          onChange={(e) => updateSchedule(index, "time", e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSchedule(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={addSchedule}
              className="w-full"
            >
              <Plus className="w-4 h-4 ml-2" />
              اضافه کردن برنامه زمانی
            </Button>
          </CardContent>
        </Card>

        {/* Product Creation Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              ایجاد محصول در فروشگاه
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              آیا می‌خواهید این دوره را به عنوان محصول در فروشگاه قرار دهید؟
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                dir="ltr"
                id="create_product"
                checked={productForm.create_product}
                onCheckedChange={(checked) => handleProductInputChange("create_product", checked)}
              />
              <Label htmlFor="create_product">ایجاد محصول در فروشگاه</Label>
            </div>

            {productForm.create_product && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product_title" className={validationErrors.product?.title ? "text-red-500" : ""}>
                      عنوان محصول *
                    </Label>
                    <Input
                      id="product_title"
                      value={productForm.title}
                      onChange={(e) => handleProductInputChange("title", e.target.value)}
                      placeholder="عنوان محصول برای فروشگاه"
                      className={validationErrors.product?.title ? "border-red-500 focus:border-red-500" : ""}
                      required={productForm.create_product}
                    />
                    {validationErrors.product?.title && (
                      <p className="text-sm text-red-500">{validationErrors.product.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product_price" className={validationErrors.product?.price ? "text-red-500" : ""}>
                      قیمت (تومان) *
                    </Label>
                    <div className="relative">
                      <Input
                        id="product_price"
                        type="number"
                        min="0"
                        value={productForm.price}
                        onChange={(e) => handleProductInputChange("price", parseInt(e.target.value) || 0)}
                        placeholder="۰ برای رایگان"
                        className={validationErrors.product?.price ? "border-red-500 focus:border-red-500 pr-8" : "pr-8"}
                        required={productForm.create_product}
                      />
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground " />
                    </div>
                    {validationErrors.product?.price && (
                      <p className="text-sm text-red-500">{validationErrors.product.price}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      برای محصول رایگان عدد ۰ را وارد کنید
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product_description" className={validationErrors.product?.description ? "text-red-500" : ""}>
                    توضیحات محصول *
                  </Label>
                  <Textarea
                    id="product_description"
                    value={productForm.description}
                    onChange={(e) => handleProductInputChange("description", e.target.value)}
                    placeholder="توضیحات محصول برای فروشگاه (می‌تواند متفاوت از توضیحات دوره باشد)"
                    rows={3}
                    className={validationErrors.product?.description ? "border-red-500 focus:border-red-500" : ""}
                    required={productForm.create_product}
                  />
                  {validationErrors.product?.description && (
                    <p className="text-sm text-red-500">{validationErrors.product.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product_image">تصویر محصول</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="product_image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleProductInputChange("image", file);
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('product_image')?.click()}
                    >
                      <ImageIcon className="w-4 h-4 ml-2" />
                      انتخاب تصویر
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    فرمت‌های پشتیبانی شده: JPG, PNG, GIF (حداکثر 5MB)
                  </p>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    dir="ltr"
                    id="product_is_active"
                    checked={productForm.is_active}
                    onCheckedChange={(checked) => handleProductInputChange("is_active", checked)}
                  />
                  <Label htmlFor="product_is_active">محصول فعال باشد</Label>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <ShoppingCart className="w-5 h-5 text-primary mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">اطلاعات محصول:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• نوع محصول: دوره آموزشی</li>
                        <li>• پس از ایجاد، دانشجویان می‌توانند این دوره را خریداری کنند</li>
                        <li>• قیمت: {productForm.price.toLocaleString()} تومان</li>
                        <li>• محصول به صورت خودکار به دوره ایجاد شده متصل می‌شود</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/panel/courses")}
            disabled={loading}
          >
            انصراف
          </Button>

          <Button
            type="submit"
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                در حال ایجاد...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                ایجاد دوره و محصول
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
