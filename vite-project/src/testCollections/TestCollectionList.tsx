import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { useUser } from "@/context/UserContext";
import { 
  BookOpen, 
  Users, 
  Plus,
  Search,
  Eye,
  BarChart3,
  ShoppingBag
} from "lucide-react";
import { Link } from "react-router-dom";

interface TestCollection {
  id: number;
  name: string;
  description: string;
  total_tests: number;
  student_count: number;
  created_by_name: string;
  created_at: string;
  is_active: boolean;
}

export default function TestCollectionList() {
  const [collections, setCollections] = useState<TestCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useUser();

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/test-collections/");
      setCollections(response.data);
    } catch (error) {
      console.error("Error fetching test collections:", error);
      toast.error("خطا در دریافت مجموعه آزمون‌ها");
    } finally {
      setLoading(false);
    }
  };

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">مجموعه آزمون‌ها</h1>
        {user?.role === "teacher" && (
          <Link to="/panel/test-collections/new">
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              ایجاد مجموعه آزمون جدید
            </Button>
          </Link>
        )}
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="جستجو در مجموعه آزمون‌ها..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCollections.map((collection) => (
          <Card key={collection.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {collection.name}
                </CardTitle>
                <Badge variant={collection.is_active ? "default" : "secondary"}>
                  {collection.is_active ? "فعال" : "غیرفعال"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {collection.description || "توضیحی ارائه نشده"}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span>{collection.total_tests} آزمون</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span>{collection.student_count} دانش‌آموز</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <span className="text-xs text-muted-foreground">
                  ایجاد: {collection.created_by_name}
                </span>
                
                <div className="flex gap-2">
                  <Link to={`/panel/test-collections/${collection.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 ml-1" />
                      جزئیات
                    </Button>
                  </Link>
                  {user?.role === "teacher" && (
                    <Link to={`/panel/test-collections/${collection.id}/statistics`}>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 ml-1" />
                        آمار
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCollections.length === 0 && (
        <div className="text-center py-12">
          {user?.role === "student" ? (
            <>
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">هنوز مجموعه آزمونی فعال ندارید</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                برای دسترسی به آزمون‌ها، از فروشگاه مجموعه آزمون تهیه کنید.
              </p>
              <Link to="/shop">
                <Button className="mt-4">
                  <ShoppingBag className="ml-2 h-4 w-4" />
                  مراجعه به فروشگاه
                </Button>
              </Link>
            </>
          ) : (
            <>
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">هیچ مجموعه آزمونی یافت نشد</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                برای شروع، یک مجموعه آزمون جدید ایجاد کنید.
              </p>
              <Link to="/panel/test-collections/new">
                <Button className="mt-4">
                  <Plus className="ml-2 h-4 w-4" />
                  ایجاد مجموعه آزمون
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
