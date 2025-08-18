import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { 
  BookOpen, 
  FileText, 
  Play, 
  Download, 
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

interface ProductAccess {
  id: number;
  product: {
    id: number;
    title: string;
    description: string;
    product_type: string;
    image?: string;
    file?: {
      file: string;
      file_name: string;
    };
    course?: {
      id: number;
      title: string;
      description: string;
    };
    test?: {
      id: number;
      title: string;
      description: string;
    };
  };
  order: {
    id: number;
    status: string;
    created_at: string;
  };
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
}

export default function MyProducts() {
  const [productAccess, setProductAccess] = useState<ProductAccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductAccess();
  }, []);

  const fetchProductAccess = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/finance/user-access/");
      setProductAccess(response.data);
    } catch (error) {
      console.error("Error fetching product access:", error);
      toast.error("خطا در دریافت محصولات قابل دسترس");
    } finally {
      setLoading(false);
    }
  };


  const filterByType = (type: string) => {
    return productAccess.filter(access => access.product.product_type === type);
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

  if (productAccess.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">هنوز محصولی خریداری نکرده‌اید</h3>
            <p className="text-muted-foreground mb-6">
              برای دسترسی به دوره‌ها، فایل‌ها و آزمون‌ها، ابتدا آنها را از فروشگاه خریداری کنید.
            </p>
            <Button onClick={() => window.location.href = "/shop"}>
              رفتن به فروشگاه
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>محصولات قابل دسترس</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={getActiveTab()} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">همه ({productAccess.length})</TabsTrigger>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productAccess.map((access) => (
                  <ProductCard key={access.id} access={access} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="courses" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterByType("course").map((access) => (
                  <ProductCard key={access.id} access={access} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="files" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterByType("file").map((access) => (
                  <ProductCard key={access.id} access={access} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tests" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterByType("test").map((access) => (
                  <ProductCard key={access.id} access={access} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface ProductCardProps {
  access: ProductAccess;
}

function ProductCard({ access }: ProductCardProps) {
  const { product, order, granted_at, expires_at, is_active } = access;

  const getProductTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      file: "فایل",
      course: "دوره",
      test: "آزمون",
    };
    return labels[type] || type;
  };

  const getProductTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      file: <FileText className="w-5 h-5" />,
      course: <BookOpen className="w-5 h-5" />,
      test: <Play className="w-5 h-5" />,
    };
    return icons[type] || <FileText className="w-5 h-5" />;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "در انتظار",
      confirmed: "تأیید شده",
      paid: "پرداخت شده",
      cancelled: "لغو شده",
      refunded: "بازپرداخت شده",
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      confirmed: "secondary",
      paid: "default",
      cancelled: "destructive",
      refunded: "secondary",
    };
    return variants[status] || "default";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartTest = (testId: number) => {
    window.location.href = `/test/${testId}/`;
  };

  const handleViewCourse = (courseId: number) => {
    window.location.href = `/panel/courses/${courseId}/`;
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-gray-100 flex items-center justify-center">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400">
            {getProductTypeIcon(product.product_type)}
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            {getProductTypeLabel(product.product_type)}
          </Badge>
          <Badge variant={getStatusVariant(order.status)} className="text-xs">
            {getStatusLabel(order.status)}
          </Badge>
        </div>

        <h3 className="font-medium text-lg mb-2 line-clamp-2">{product.title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{product.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>دسترسی: {formatDate(granted_at)}</span>
          </div>
          {expires_at && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>انقضا: {formatDate(expires_at)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs">
            {is_active ? (
              <>
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-green-600">فعال</span>
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 text-red-500" />
                <span className="text-red-600">غیرفعال</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {product.product_type === "file" && product.file && (
            <Button 
              onClick={() => handleDownload(product.file!.file, product.file!.file_name)}
              className="w-full"
              size="sm"
            >
              <Download className="w-4 h-4 ml-2" />
              دانلود فایل
            </Button>
          )}

          {product.product_type === "course" && product.course && (
            <Button 
              onClick={() => handleViewCourse(product.course!.id)}
              className="w-full"
              size="sm"
            >
              <ExternalLink className="w-4 h-4 ml-2" />
              مشاهده دوره
            </Button>
          )}

          {product.product_type === "test" && product.test && (
            <Button 
              onClick={() => handleStartTest(product.test!.id)}
              className="w-full"
              size="sm"
            >
              <Play className="w-4 h-4 ml-2" />
              شروع آزمون
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
