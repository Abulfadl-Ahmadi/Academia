import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Search, Check, X, Users, Phone, Mail, GraduationCap } from "lucide-react";
import axiosInstance from "@/lib/axios";

export interface AvailableStudent {
  id: number;
  username: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  school?: string;
  grade?: string;
}

interface CourseStudentSelectorProps {
  selectedStudentIds: number[];
  onChange: (ids: number[]) => void;
  title?: string;
  description?: string;
}

export default function CourseStudentSelector({
  selectedStudentIds,
  onChange,
  title = "انتخاب دانش‌آموزان دارای دسترسی اختصاصی",
  description = "می‌توانید دانش‌آموزان مشخصی را برای دسترسی دستی به این دوره انتخاب کنید."
}: CourseStudentSelectorProps) {
  const [students, setStudents] = useState<AvailableStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      let res;
      try {
        res = await axiosInstance.get("/courses/available_students/");
      } catch {
        res = await axiosInstance.get("/test-collections/available_students/");
      }
      if (Array.isArray(res.data)) {
        setStudents(res.data);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Error fetching available students:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const toggleStudent = (studentId: number) => {
    if (selectedStudentIds.includes(studentId)) {
      onChange(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      onChange([...selectedStudentIds, studentId]);
    }
  };

  const removeStudent = (studentId: number) => {
    onChange(selectedStudentIds.filter((id) => id !== studentId));
  };

  const filteredStudents = students.filter((s) => {
    if (!studentSearch.trim()) return true;
    const term = studentSearch.toLowerCase();
    return (
      (s.full_name && s.full_name.toLowerCase().includes(term)) ||
      (s.username && s.username.toLowerCase().includes(term)) ||
      (s.phone && s.phone.includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.school && s.school.toLowerCase().includes(term))
    );
  });

  const selectAllFiltered = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    const merged = Array.from(new Set([...selectedStudentIds, ...filteredIds]));
    onChange(merged);
  };

  const deselectAllFiltered = () => {
    const filteredIds = new Set(filteredStudents.map((s) => s.id));
    onChange(selectedStudentIds.filter((id) => !filteredIds.has(id)));
  };

  return (
    <div className="space-y-4 p-4 sm:p-5 border rounded-xl bg-card">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" />
          <Label className="font-bold text-base">{title}</Label>
        </div>
        <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {selectedStudentIds.length} دانش‌آموز انتخاب شده
        </span>
      </div>

      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
      )}

      {/* Search & Bulk Select Controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو بر اساس نام، نام کاربری یا شماره همراه..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="pr-9 text-sm"
          />
        </div>
        {filteredStudents.length > 0 && (
          <div className="flex gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAllFiltered}
              className="text-xs h-9"
            >
              انتخاب همه نتایج
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={deselectAllFiltered}
              className="text-xs h-9 text-destructive hover:bg-destructive/10"
            >
              لغو انتخاب
            </Button>
          </div>
        )}
      </div>

      {/* Students List Box */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="space-y-1.5 max-h-60 overflow-y-auto border rounded-lg p-2.5 bg-muted/20">
          {filteredStudents.map((student) => {
            const isSelected = selectedStudentIds.includes(student.id);
            return (
              <div
                key={student.id}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? "bg-primary/15 border border-primary/30 font-medium"
                    : "hover:bg-muted/70 border border-transparent"
                }`}
                onClick={() => toggleStudent(student.id)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/40 bg-background"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm truncate font-medium">{student.full_name}</span>
                  <span className="text-xs text-muted-foreground font-mono truncate" dir="ltr">
                    (@{student.username})
                  </span>
                  {student.school ? (
                    <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 dark:bg-muted/40 px-1.5 py-0.5 rounded truncate max-w-36" title={student.school}>
                      <GraduationCap className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">{student.school}</span>
                    </span>
                  ) : null}
                </div>
                
                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  {student.phone ? (
                    <span className="font-mono flex items-center gap-1" dir="ltr">
                      <span>{student.phone}</span>
                      <Phone className="w-3 h-3 text-muted-foreground/70" />
                    </span>
                  ) : student.email ? (
                    <span className="font-mono hidden sm:flex items-center gap-1" dir="ltr">
                      <span className="truncate max-w-40">{student.email}</span>
                      <Mail className="w-3 h-3 text-muted-foreground/70" />
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg border-dashed">
          دانش‌آموزی با این مشخصات یافت نشد.
        </div>
      )}

      {/* Selected Students Badges */}
      {selectedStudentIds.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs text-muted-foreground">
            دانش‌آموزان انتخاب شده ({selectedStudentIds.length} نفر):
          </Label>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 border rounded-lg bg-muted/10">
            {selectedStudentIds.map((studentId) => {
              const student = students.find((s) => s.id === studentId);
              return (
                <Badge
                  key={studentId}
                  variant="secondary"
                  className="flex items-center gap-1.5 py-1 px-2.5 text-xs bg-background border shadow-sm"
                >
                  <span className="font-medium">
                    {student ? student.full_name || student.username : `کاربر #${studentId}`}
                  </span>
                  <X
                    className="w-3.5 h-3.5 cursor-pointer text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStudent(studentId);
                    }}
                  />
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
