import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Trash2, Edit, Eye, Filter, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getQuestionCollections, deleteQuestionCollection, type QuestionCollection } from "@/api/questionCollections";

export default function QuestionCollectionsPage() {
  const [collections, setCollections] = useState<QuestionCollection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<QuestionCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<QuestionCollection | null>(null);

  const filterAndSortCollections = useCallback(() => {
    // Ensure collections is an array before processing
    const collectionsArray = Array.isArray(collections) ? collections : [];
    let filtered = [...collectionsArray];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (collection) =>
          collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (collection.description && collection.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((collection) => {
        if (statusFilter === "active") return collection.is_active;
        if (statusFilter === "inactive") return !collection.is_active;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "total_questions":
          aValue = a.total_questions;
          bValue = b.total_questions;
          break;
        case "created_at":
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" 
          ? aValue.localeCompare(bValue, "fa") 
          : bValue.localeCompare(aValue, "fa");
      } else {
        return sortOrder === "asc" 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    setFilteredCollections(filtered);
  }, [collections, searchTerm, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    filterAndSortCollections();
  }, [filterAndSortCollections]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const data = await getQuestionCollections();
      // Ensure data is always an array
      setCollections(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching question collections:", err);
      setError("خطا در بارگذاری مجموعه‌های سوال");
      // Set empty array on error
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!collectionToDelete) return;

    try {
      await deleteQuestionCollection(collectionToDelete.id);
      toast.success("مجموعه سوال با موفقیت حذف شد");
      fetchCollections();
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("خطا در حذف مجموعه سوال");
    } finally {
      setDeleteDialogOpen(false);
      setCollectionToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getStats = () => {
    // Ensure collections is an array before processing
    const collectionsArray = Array.isArray(collections) ? collections : [];
    
    return {
      total: collectionsArray.length,
      active: collectionsArray.filter(c => c.is_active).length,
      totalQuestions: collectionsArray.reduce((sum, c) => sum + c.total_questions, 0),
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchCollections} className="mt-4">
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">مجموعه‌های سوال</h1>
          <p className="text-muted-foreground mt-2">
            مدیریت و سازماندهی سوالات در مجموعه‌های مختلف
          </p>
        </div>
        <Link to="/panel/question-collections/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            ایجاد مجموعه جدید
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل مجموعه‌ها</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مجموعه‌های فعال</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل سوالات</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="جستجو در نام یا توضیحات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="inactive">غیرفعال</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="مرتب‌سازی بر اساس" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">تاریخ ایجاد</SelectItem>
                <SelectItem value="name">نام</SelectItem>
                <SelectItem value="total_questions">تعداد سوالات</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="ترتیب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">نزولی</SelectItem>
                <SelectItem value="asc">صعودی</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Collections Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست مجموعه‌های سوال</CardTitle>
          <CardDescription>
            {filteredCollections.length} مجموعه از کل {collections.length} مجموعه
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCollections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">هیچ مجموعه‌ای یافت نشد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام مجموعه</TableHead>
                  <TableHead>توضیحات</TableHead>
                  <TableHead className="text-center">تعداد سوالات</TableHead>
                  <TableHead className="text-center">وضعیت</TableHead>
                  <TableHead>تاریخ ایجاد</TableHead>
                  <TableHead className="text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCollections.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/panel/question-collections/${collection.id}`}
                        className="hover:underline"
                      >
                        {collection.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {collection.description || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {collection.total_questions}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={collection.is_active ? "default" : "secondary"}>
                        {collection.is_active ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(collection.created_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">باز کردن منو</span>
                            ⋮
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>عملیات</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link to={`/panel/question-collections/${collection.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              مشاهده جزئیات
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/panel/question-collections/${collection.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              ویرایش
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setCollectionToDelete(collection);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأیید حذف</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف مجموعه سوال "{collectionToDelete?.name}" اطمینان دارید؟
              این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCollection}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}