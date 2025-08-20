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
  ShoppingCart,
  DollarSign,
  Image as ImageIcon,
  FileText,
  BookOpen,
  Save,
  ArrowLeft,
} from "lucide-react";

interface CreateProductForm {
  title: string;
  description: string;
  price: number;
  product_type: 'file' | 'course' | 'test';
  is_active: boolean;
  course?: number;
  test?: number;
  file?: number;
  image?: File;
}

const PRODUCT_TYPES = [
  { value: 'file', label: 'فایل', icon: FileText },
  { value: 'course', label: 'دوره', icon: BookOpen },
  { value: 'test', label: 'آزمون', icon: FileText },
];

export default function CreateProductPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProductForm>({
    title: "",
    description: "",
    price: 0,
    product_type: 'file',
    is_active: true,
  });

  const handleInputChange = (field: keyof CreateProductForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("عنوان محصول الزامی است");
      return;
    }

    if (formData.price <= 0) {
      toast.error("قیمت محصول باید بیشتر از صفر باشد");
      return;
    }

    // Validate required fields based on product type
    if (formData.product_type === 'course' && !formData.course) {
      toast.error("برای محصول دوره، انتخاب دوره الزامی است");
      return;
    }

    if (formData.product_type === 'test' && !formData.test) {
      toast.error("برای محصول آزمون، انتخاب آزمون الزامی است");
      return;
    }

    if (formData.product_type === 'file' && !formData.file) {
      toast.error("برای محصول فایل، انتخاب فایل الزامی است");
      return;
    }

    setLoading(true);

    try {
      const productData = new FormData();
      productData.append('title', formData.title.trim());
      productData.append('description', formData.description.trim());
      productData.append('price', formData.price.toString());
      productData.append('product_type', formData.product_type);
      productData.append('is_active', formData.is_active.toString());
      
      if (formData.course) {
        productData.append('course', formData.course.toString());
      }
      if (formData.test) {
        productData.append('test', formData.test.toString());
      }
      if (formData.file) {
        productData.append('file', formData.file.toString());
      }
      if (formData.image) {
        productData.append('image', formData.image);
      }

      await axiosInstance.post("/shop/products/", productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("محصول با موفقیت در فروشگاه ایجاد شد");
      
      // Navigate back to products list
      navigate("/panel/products");

    } catch (error: any) {
      console.error("Error creating product:", error);
      const errorMessage = error.response?.data?.message || "خطا در ایجاد محصول";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getProductTypeIcon = (type: string) => {
    const productType = PRODUCT_TYPES.find(pt => pt.value === type);
    return productType ? productType.icon : FileText;
  };

  const getProductTypeLabel = (type: string) => {
    const productType = PRODUCT_TYPES.find(pt => pt.value === type);
    return productType ? productType.label : 'نامشخص';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/panel/products")}
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            بازگشت
          </Button>
          <div>
            <h1 className="text-2xl font-bold">ایجاد محصول جدید</h1>
            <p className="text-muted-foreground">اطلاعات محصول جدید را برای فروشگاه وارد کنید</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              اطلاعات پایه محصول
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان محصول *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="عنوان محصول"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">قیمت (تومان) *</Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", parseInt(e.target.value) || 0)}
                    placeholder="قیمت به تومان"
                    required
                    className="pr-8"
                  />
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground " />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات محصول</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="توضیحات کامل محصول..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">تصویر محصول</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleInputChange("image", file);
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('image')?.click()}
                >
                  <ImageIcon className="w-4 h-4 ml-2" />
                  انتخاب تصویر
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                فرمت‌های پشتیبانی شده: JPG, PNG, GIF (حداکثر 5MB)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_type">نوع محصول *</Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(value: 'file' | 'course' | 'test') => handleInputChange("product_type", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب نوع محصول" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active">وضعیت محصول</Label>
                <div className="flex items-center space-x-2 space-x-reverse pt-2">
                  <Switch
                    dir="ltr"
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                  />
                  <Label htmlFor="is_active">محصول فعال باشد</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Type Specific Fields */}
        {formData.product_type === 'course' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                انتخاب دوره
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                دوره‌ای که می‌خواهید به عنوان محصول فروخته شود را انتخاب کنید
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="course">دوره *</Label>
                <Select
                  value={String(formData.course || '')}
                  onValueChange={(value) => handleInputChange("course", parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب دوره" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* This would need to fetch courses from API */}
                    <SelectItem value="1">ریاضی ۳</SelectItem>
                    <SelectItem value="2">فیزیک ۲</SelectItem>
                    <SelectItem value="3">شیمی ۱</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {formData.product_type === 'test' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                انتخاب آزمون
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                آزمونی که می‌خواهید به عنوان محصول فروخته شود را انتخاب کنید
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="test">آزمون *</Label>
                <Select
                  value={String(formData.test || '')}
                  onValueChange={(value) => handleInputChange("test", parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب آزمون" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* This would need to fetch tests from API */}
                    <SelectItem value="1">آزمون میان‌ترم ریاضی</SelectItem>
                    <SelectItem value="2">آزمون نهایی فیزیک</SelectItem>
                    <SelectItem value="3">آزمون هفتگی شیمی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {formData.product_type === 'file' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                انتخاب فایل
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                فایلی که می‌خواهید به عنوان محصول فروخته شود را انتخاب کنید
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="file">فایل *</Label>
                <Select
                  value={String(formData.file || '')}
                  onValueChange={(value) => handleInputChange("file", parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب فایل" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* This would need to fetch files from API */}
                    <SelectItem value="1">جزوه ریاضی پیش‌دانشگاهی</SelectItem>
                    <SelectItem value="2">نمونه سوالات فیزیک</SelectItem>
                    <SelectItem value="3">کتاب کمک درسی شیمی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              پیش‌نمایش محصول
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {(() => {
                    const IconComponent = getProductTypeIcon(formData.product_type);
                    return <IconComponent className="w-6 h-6 text-primary" />;
                  })()}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{formData.title || 'عنوان محصول'}</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {formData.description || 'توضیحات محصول'}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-muted-foreground">نوع: {getProductTypeLabel(formData.product_type)}</span>
                    <span className="text-primary font-medium">
                      قیمت: {formData.price.toLocaleString()} تومان
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      formData.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {formData.is_active ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/panel/products")}
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
                ایجاد محصول
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
