"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { BookOpen, Plus, X, Save, ArrowRight, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CourseSchedule {
  id?: number;
  day: number;
  time: string;
}

interface CourseData {
  title: string;
  description: string;
  is_active: boolean;
  schedules: CourseSchedule[];
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

export default function EditCoursePage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [courseData, setCourseData] = useState<CourseData>({
    title: "",
    description: "",
    is_active: true,
    schedules: [],
  });

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Fetch course details
        const courseResponse = await axiosInstance.get(`/courses/${courseId}/`);
        const course = courseResponse.data;

        // Fetch course schedules
        const schedulesResponse = await axiosInstance.get(
          `/courses/${courseId}/schedules/`
        );
        const schedules = schedulesResponse.data;

        setCourseData({
          title: course.title,
          description: course.description || "",
          is_active: course.is_active,
          schedules: schedules.map((schedule: { id: number; day: number; time: string }) => ({
            id: schedule.id,
            day: schedule.day,
            time: schedule.time,
          })),
        });
      } catch (error) {
        console.error("Error fetching course data:", error);
        const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "خطا در دریافت اطلاعات دوره";
        toast.error(errorMessage);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const handleInputChange = (field: keyof CourseData, value: string | boolean | CourseSchedule[]) => {
    setCourseData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addSchedule = () => {
    setCourseData((prev) => ({
      ...prev,
      schedules: [...prev.schedules, { day: 0, time: "09:00" }],
    }));
  };

  const removeSchedule = (index: number) => {
    setCourseData((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index),
    }));
  };

  const updateSchedule = (
    index: number,
    field: keyof Omit<CourseSchedule, "id">,
    value: string | number
  ) => {
    setCourseData((prev) => ({
      ...prev,
      schedules: prev.schedules.map((schedule, i) =>
        i === index ? { ...schedule, [field]: value } : schedule
      ),
    }));
  };

  const handleDeleteCourse = async () => {
    if (!courseId) return;

    setLoading(true);
    try {
      await axiosInstance.delete(`/courses/${courseId}/`);
      toast.success("دوره با موفقیت حذف شد");
      navigate("/panel/courses");
    } catch (error) {
      console.error("Error deleting course:", error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "خطا در حذف دوره";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseData.title.trim()) {
      toast.error("عنوان دوره الزامی است");
      return;
    }

    setLoading(true);

    try {
      // Update the course
      await axiosInstance.put(`/courses/${courseId}/`, {
        title: courseData.title.trim(),
        description: courseData.description.trim(),
        is_active: courseData.is_active,
      });

      // Update schedules
      // First, delete all existing schedules
      const existingSchedules = await axiosInstance.get(
        `/courses/${courseId}/schedules/`
      );
      for (const schedule of existingSchedules.data) {
        await axiosInstance.delete(`/schedules/${schedule.id}/`);
      }

      // Then create new schedules
      for (const schedule of courseData.schedules) {
        await axiosInstance.post("/schedules/", {
          course: courseId,
          day: schedule.day,
          time: schedule.time,
        });
      }

      toast.success("دوره با موفقیت بروزرسانی شد");
      navigate(`/panel/courses/${courseId}`);
    } catch (error) {
      console.error("Error updating course:", error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "خطا در بروزرسانی دوره";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/panel/courses/${courseId}`)}
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            بازگشت
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={loading}
          >
            <Trash2 className="ml-2 h-4 w-4" />
            حذف دوره
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="ml-2 h-5 w-5" />
              ویرایش دوره
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Course Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان دوره</Label>
                <Input
                  id="title"
                  placeholder="عنوان دوره را وارد کنید"
                  value={courseData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">توضیحات دوره</Label>
                <Textarea
                  id="description"
                  placeholder="توضیحات دوره را وارد کنید"
                  value={courseData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={5}
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="is_active"
                  checked={courseData.is_active}
                  onCheckedChange={(value) =>
                    handleInputChange("is_active", value)
                  }
                />
                <Label htmlFor="is_active">دوره فعال است</Label>
              </div>
            </div>

            {/* Course Schedule */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">برنامه زمانی دوره</h3>
                <Button type="button" variant="outline" onClick={addSchedule}>
                  <Plus className="ml-2 h-4 w-4" />
                  افزودن زمان
                </Button>
              </div>

              <table className="w-full">
                {courseData.schedules.map((schedule, index) => (
                  <tbody key={index} className="items-center">
                    <td className="py-1">
                      <div className="flex flex-row gap-2">
                        {/* <Label>روز:</Label> */}
                        <Select
                          value={schedule.day.toString()}
                          onValueChange={(value) =>
                            updateSchedule(index, "day", parseInt(value))
                          }
                        >
                          <SelectTrigger className="w-full ml-2" dir="rtl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS.map((day) => (
                              <SelectItem
                                key={day.value}
                                value={day.value.toString()}
                              >
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>

                    <td>
                    <div className="flex flex-row gap-2">
                      {/* <Label>ساعت:</Label> */}
                      <Input
                        type="time"
                        
                        value={schedule.time}
                        className="w-full ml-2"
                        onChange={(e) =>
                          updateSchedule(index, "time", e.target.value)
                        }
                      />
                      </div>
                    </td>
                    <td>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeSchedule(index)}
                        className=""
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tbody>
                ))}
              </table>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                <Save className="ml-2 h-4 w-4" />
                ذخیره تغییرات
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف دوره</DialogTitle>
            <DialogDescription>
              آیا مطمئن هستید که می‌خواهید این دوره را حذف کنید؟ این عمل قابل بازگشت نیست و تمام اطلاعات دوره از جمله جلسات، آزمون‌ها و دانشجویان حذف خواهند شد.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={loading}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCourse}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  در حال حذف...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  حذف دوره
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
