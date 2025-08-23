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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">مدیریت محصولات</h2>
        <div className="flex gap-2">
          {selectedRows.length > 0 && (
            <>
              <Button variant="destructive" onClick={handleDeleteSelected}>
                <Trash2 className="ml-2 h-4 w-4" /> حذف {selectedRows.length} مورد
              </Button>
              <Button variant="outline" onClick={handleExportSelected}>
                <Download className="ml-2 h-4 w-4" /> دانلود {selectedRows.length} مورد
              </Button>
            </>
          )}
          <Button onClick={() => window.location.href = "/panel/products/create"}>
            <Plus className="ml-2 h-4 w-4" /> محصول جدید
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>لیست محصولات</CardTitle>
          <CardDescription>محصولاتی که برای فروش در سایت منتشر کرده‌اید</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={getActiveTab()} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">همه ({products.length})</TabsTrigger>
              <TabsTrigger value="courses">
                دوره‌ها ({filterByType("course").length})
              </TabsTrigger>
              <TabsTrigger value="files">
                فایل‌ها ({filterByType("file").length})
              </TabsTrigger>
              <TabsTrigger value="tests">
                آزمون‌ها ({filterByType("test").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <DataTable 
                columns={columns} 
                data={products} 
                onRowSelectionChange={setSelectedRows}
              />
            </TabsContent>

            <TabsContent value="courses" className="mt-6">
              <DataTable 
                columns={columns} 
                data={filterByType("course")}
                onRowSelectionChange={setSelectedRows} 
              />
            </TabsContent>

            <TabsContent value="files" className="mt-6">
              <DataTable 
                columns={columns} 
                data={filterByType("file")}
                onRowSelectionChange={setSelectedRows} 
              />
            </TabsContent>

            <TabsContent value="tests" className="mt-6">
              <DataTable 
                columns={columns} 
                data={filterByType("test")}
                onRowSelectionChange={setSelectedRows} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}


