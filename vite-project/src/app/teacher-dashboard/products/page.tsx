import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { 
  BookOpen,
  Plus,
  Download,
  Trash2
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table-with-selection";
import { columns, type Product } from "./columns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TeacherProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/shop/products/");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("خطا در دریافت محصولات");
    } finally {
      setLoading(false);
    }
  };

  const filterByType = (type: string) => {
    return products.filter(product => product.product_type === type);
  };

  const getActiveTab = () => {
    if (filterByType("course").length > 0) return "courses";
    if (filterByType("file").length > 0) return "files";
    if (filterByType("test").length > 0) return "tests";
    return "all";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">در حال بارگذاری...</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">هنوز محصولی ایجاد نکرده‌اید</h3>
            <p className="text-muted-foreground mb-6">
              برای فروش محتوای آموزشی، ابتدا باید محصولی ایجاد کنید.
            </p>
            <Button onClick={() => window.location.href = "/panel/products/create"}>
              <Plus className="ml-2 h-4 w-4" /> ایجاد محصول جدید
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) {
      toast.error("هیچ محصولی انتخاب نشده است");
      return;
    }
    
    toast.info(`${selectedRows.length} محصول انتخاب شده حذف خواهند شد`);
    // Implementation for bulk delete would go here
  };
  
  const handleExportSelected = () => {
    if (selectedRows.length === 0) {
      toast.error("هیچ محصولی انتخاب نشده است");
      return;
    }
    
    toast.success(`دانلود اطلاعات ${selectedRows.length} محصول انتخاب شده`);
    // Implementation for export would go here
    
    // Example creating CSV
    const headers = ["عنوان", "نوع", "قیمت", "وضعیت", "تعداد فروش"];
    const csvContent = [
      headers.join(","),
      ...selectedRows.map(product => [
        product.title,
        product.product_type,
        product.price,
        product.is_active ? "فعال" : "غیرفعال",
        product.sales_count || 0
      ].join(","))
    ].join("\\n");
    
    console.log("CSV data:", csvContent);
    // In a real implementation, you would create a download link
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:justify-between lg:items-center min-w-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">مدیریت محصولات</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
          {selectedRows.length > 0 && (
            <>
              <Button variant="destructive" onClick={handleDeleteSelected} className="flex items-center justify-center gap-2" size="sm">
                <Trash2 className="h-4 w-4" /> 
                <span className="hidden sm:inline">حذف {selectedRows.length} مورد</span>
                <span className="sm:hidden">حذف ({selectedRows.length})</span>
              </Button>
              <Button variant="outline" onClick={handleExportSelected} className="flex items-center justify-center gap-2" size="sm">
                <Download className="h-4 w-4" /> 
                <span className="hidden sm:inline">دانلود {selectedRows.length} مورد</span>
                <span className="sm:hidden">دانلود ({selectedRows.length})</span>
              </Button>
            </>
          )}
          <Button onClick={() => window.location.href = "/panel/products/create"} className="flex items-center justify-center gap-2" size="sm">
            <Plus className="h-4 w-4" /> 
            <span className="hidden sm:inline">محصول جدید</span>
            <span className="sm:hidden">جدید</span>
          </Button>
        </div>
      </div>
      
      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle>لیست محصولات</CardTitle>
          <CardDescription>محصولاتی که برای فروش در سایت منتشر کرده‌اید</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <Tabs defaultValue={getActiveTab()} className="w-full">
            <div className="overflow-x-auto mb-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 min-w-fit">
                <TabsTrigger value="all" className="text-xs sm:text-sm whitespace-nowrap">همه ({products.length})</TabsTrigger>
                <TabsTrigger value="courses" className="text-xs sm:text-sm whitespace-nowrap">
                  دوره‌ها ({filterByType("course").length})
                </TabsTrigger>
                <TabsTrigger value="files" className="text-xs sm:text-sm whitespace-nowrap">
                  فایل‌ها ({filterByType("file").length})
                </TabsTrigger>
                <TabsTrigger value="tests" className="text-xs sm:text-sm whitespace-nowrap">
                  آزمون‌ها ({filterByType("test").length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-0">
              <div className="w-full min-w-0">
                <DataTable 
                  columns={columns} 
                  data={products} 
                  onRowSelectionChange={setSelectedRows}
                />
              </div>
            </TabsContent>

            <TabsContent value="courses" className="mt-0">
              <div className="w-full min-w-0">
                <DataTable 
                  columns={columns} 
                  data={filterByType("course")}
                  onRowSelectionChange={setSelectedRows} 
                />
              </div>
            </TabsContent>

            <TabsContent value="files" className="mt-0">
              <div className="w-full min-w-0">
                <DataTable 
                  columns={columns} 
                  data={filterByType("file")}
                  onRowSelectionChange={setSelectedRows} 
                />
              </div>
            </TabsContent>

            <TabsContent value="tests" className="mt-0">
              <div className="w-full min-w-0">
                <DataTable 
                  columns={columns} 
                  data={filterByType("test")}
                  onRowSelectionChange={setSelectedRows} 
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}


