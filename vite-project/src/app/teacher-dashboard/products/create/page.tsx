import { useState, useEffect, useCallback } from "react";
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
  ArrowRight,
} from "lucide-react";

interface CreateProductForm {
  title: string;
  description: string;
  price: number;
  product_type: 'file' | 'course' | 'test' | 'book' | 'notebook' | 'pamphlet' | 'stationery';
  is_active: boolean;
  course?: number;
  test?: number;
  file?: number;
  image?: File;
  // Physical product fields
  weight?: number;
  dimensions?: string;
  stock_quantity?: number;
  shipping_cost?: number;
}

const PRODUCT_TYPES = [
  { value: 'file', label: 'فایل', icon: FileText, isPhysical: false },
  { value: 'course', label: 'دوره', icon: BookOpen, isPhysical: false },
  { value: 'test', label: 'آزمون', icon: FileText, isPhysical: false },
  { value: 'book', label: 'کتاب', icon: BookOpen, isPhysical: true },
  { value: 'notebook', label: 'دفتر', icon: FileText, isPhysical: true },
  { value: 'pamphlet', label: 'جزوه', icon: FileText, isPhysical: true },
  { value: 'stationery', label: 'لوازم تحریر', icon: FileText, isPhysical: true },
];

export default function CreateProductPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  interface TestCollection { id: number | string; title?: string; name?: string }
  const [collections, setCollections] = useState<TestCollection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState<boolean>(false);
  const [courses, setCourses] = useState<{id: number; title?: string; name?: string}[]>([]);
  const [coursesLoading, setCoursesLoading] = useState<boolean>(false);
  const [files, setFiles] = useState<{id: number; title?: string; name?: string; filename?: string}[]>([]);
  const [filesLoading, setFilesLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateProductForm>({
    title: "",
    description: "",
    price: 0,
    product_type: 'file',
    is_active: true,
    weight: 0,
    dimensions: "",
    stock_quantity: 0,
    shipping_cost: 0,
  });

  const handleInputChange = <K extends keyof CreateProductForm>(field: K, value: CreateProductForm[K]) => {
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

    // Validate physical product fields
    const isPhysical = ['book', 'notebook', 'pamphlet', 'stationery'].includes(formData.product_type);
    if (isPhysical) {
      if (!formData.weight || formData.weight <= 0) {
        toast.error("وزن محصول فیزیکی الزامی است");
        return;
      }
      if (!formData.dimensions?.trim()) {
        toast.error("ابعاد محصول فیزیکی الزامی است");
        return;
      }
      if (!formData.stock_quantity || formData.stock_quantity < 0) {
        toast.error("موجودی محصول فیزیکی الزامی است");
        return;
      }
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

      // Add physical product fields
      const isPhysical = ['book', 'notebook', 'pamphlet', 'stationery'].includes(formData.product_type);
      if (isPhysical) {
        if (formData.weight) {
          productData.append('weight', formData.weight.toString());
        }
        if (formData.dimensions) {
          productData.append('dimensions', formData.dimensions);
        }
        if (formData.stock_quantity !== undefined) {
          productData.append('stock_quantity', formData.stock_quantity.toString());
        }
        if (formData.shipping_cost !== undefined) {
          productData.append('shipping_cost', formData.shipping_cost.toString());
        }
        productData.append('requires_shipping', 'true');
      }

      await axiosInstance.post("/shop/products/", productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("محصول با موفقیت در فروشگاه ایجاد شد");
      
      // Navigate back to products list
      navigate("/panel/products");

    } catch (error: unknown) {
      console.error("Error creating product:", error);
      let errorMessage = "خطا در ایجاد محصول";
      if (typeof error === 'object' && error !== null) {
        const e = error as { response?: { data?: { message?: string } }; message?: string };
        if (e.response?.data?.message) errorMessage = e.response.data.message;
        else if (e.message) errorMessage = e.message;
      }
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

  const fetchCollections = useCallback(async () => {
    try {
      setCollectionsLoading(true);
      const response = await axiosInstance.get("/test-collections/");
      // Handle both array and pagination format
      let collectionsData: TestCollection[] = [];
      if (Array.isArray(response.data)) {
        collectionsData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        collectionsData = response.data.results;
      } else {
        console.warn("Test collections data is not an array:", response.data);
        collectionsData = [];
      }
      setCollections(collectionsData);
    } catch (error) {
      console.error("Error fetching test collections:", error);
      toast.error("خطا در دریافت مجموعه آزمون‌ها");
      setCollections([]);
    } finally {
      setCollectionsLoading(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      const response = await axiosInstance.get("/courses/");
      // Handle both array and pagination format
      let coursesData: {id: number; title?: string; name?: string}[] = [];
      if (Array.isArray(response.data)) {
        coursesData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        coursesData = response.data.results;
      } else {
        console.warn("Courses data is not an array:", response.data);
        coursesData = [];
      }
      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("خطا در دریافت دوره‌ها");
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  const fetchFiles = useCallback(async () => {
    try {
      setFilesLoading(true);
      const response = await axiosInstance.get("/files/");
      // Handle both array and pagination format
      let filesData: {id: number; title?: string; name?: string; filename?: string}[] = [];
      if (Array.isArray(response.data)) {
        filesData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        filesData = response.data.results;
      } else {
        console.warn("Files data is not an array:", response.data);
        filesData = [];
      }
      setFiles(filesData);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("خطا در دریافت فایل‌ها");
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
    fetchCourses();
    fetchFiles();
  }, [fetchCollections, fetchCourses, fetchFiles]);

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
            <ArrowRight className="w-4 h-4 ml-2" />
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
                  onValueChange={(value: 'file' | 'course' | 'test' | 'book' | 'notebook' | 'pamphlet' | 'stationery') => handleInputChange("product_type", value)}
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
                          {type.isPhysical && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">فیزیکی</span>
                          )}
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
                    {coursesLoading ? (
                      <div className="p-2 text-sm text-muted-foreground">در حال بارگذاری...</div>
                    ) : courses.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">هیچ دوره‌ای یافت نشد</div>
                    ) : (
                      courses.map(course => (
                        <SelectItem key={String(course.id)} value={String(course.id)}>
                          {course.title || course.name || `دوره ${course.id}`}
                        </SelectItem>
                      ))
                    )}
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
                    {collectionsLoading ? (
                      <div className="p-2 text-sm text-muted-foreground">در حال بارگذاری...</div>
                    ) : collections.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">هیچ آزمونی یافت نشد</div>
                    ) : (
                      collections.map(col => (
                        <SelectItem key={String(col.id)} value={String(col.id)}>
                          {col.title || col.name || `آزمون ${col.id}`}
                        </SelectItem>
                      ))
                    )}
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
                    {filesLoading ? (
                      <div className="p-2 text-sm text-muted-foreground">در حال بارگذاری...</div>
                    ) : files.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">هیچ فایلی یافت نشد</div>
                    ) : (
                      files.map(file => (
                        <SelectItem key={String(file.id)} value={String(file.id)}>
                          {file.title || file.name || file.filename || `فایل ${file.id}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Physical Product Fields */}
        {['book', 'notebook', 'pamphlet', 'stationery'].includes(formData.product_type) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                مشخصات محصول فیزیکی
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                اطلاعات مربوط به ارسال و نگهداری محصول فیزیکی
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">وزن (گرم) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.weight || ''}
                    onChange={(e) => handleInputChange("weight", parseFloat(e.target.value) || 0)}
                    placeholder="وزن به گرم"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dimensions">ابعاد (سانتی‌متر) *</Label>
                  <Input
                    id="dimensions"
                    value={formData.dimensions || ''}
                    onChange={(e) => handleInputChange("dimensions", e.target.value)}
                    placeholder="مثال: 20x15x2"
                    required
                  />
                  <p className="text-xs text-muted-foreground">فرمت: طول×عرض×ارتفاع</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">موجودی *</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity || ''}
                    onChange={(e) => handleInputChange("stock_quantity", parseInt(e.target.value) || 0)}
                    placeholder="تعداد موجودی"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping_cost">هزینه ارسال (تومان)</Label>
                  <Input
                    id="shipping_cost"
                    type="number"
                    min="0"
                    value={formData.shipping_cost || ''}
                    onChange={(e) => handleInputChange("shipping_cost", parseInt(e.target.value) || 0)}
                    placeholder="هزینه ارسال (اختیاری)"
                  />
                  <p className="text-xs text-muted-foreground">اگر خالی باشد، 0 تومان محاسبه می‌شود</p>
                </div>
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
                  <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
                    <span className="text-muted-foreground">نوع: {getProductTypeLabel(formData.product_type)}</span>
                    <span className="text-primary font-medium">
                      قیمت: {formData.price.toLocaleString()} تومان
                    </span>
                    {['book', 'notebook', 'pamphlet', 'stationery'].includes(formData.product_type) && (
                      <>
                        {formData.shipping_cost && formData.shipping_cost > 0 && (
                          <span className="text-muted-foreground">
                            ارسال: {formData.shipping_cost.toLocaleString()} تومان
                          </span>
                        )}
                        {formData.stock_quantity !== undefined && (
                          <span className="text-muted-foreground">
                            موجودی: {formData.stock_quantity} عدد
                          </span>
                        )}
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          محصول فیزیکی
                        </span>
                      </>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      formData.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {formData.is_active ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                  {['book', 'notebook', 'pamphlet', 'stationery'].includes(formData.product_type) && formData.weight && formData.dimensions && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      وزن: {formData.weight} گرم | ابعاد: {formData.dimensions} سانتی‌متر
                    </div>
                  )}
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
