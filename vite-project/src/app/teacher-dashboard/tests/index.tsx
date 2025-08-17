import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import moment from 'moment-jalaali';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, FileText, Clock, Calendar, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function convertToJalali(isoDate: string): string {
  return moment(isoDate).format('jYYYY/jMM/jDD HH:mm');
}

type Test = {
  id: number;
  name: string;
  description: string;
  duration: string;
  start_time: string;
  end_time: string;
  course_detail: {
    id: number;
    title: string;
  };
  sessions_count?: number;
};

type Course = {
  id: number;
  title: string;
};

const TestsList: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch tests
    axiosInstance
      .get("/tests/")
      .then((res) => {
        setTests(res.data);
      })
      .catch((err) => {
        console.error("Error fetching tests:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    // Fetch courses for filtering
    axiosInstance
      .get("/courses/")
      .then((res) => {
        setCourses(res.data);
      })
      .catch((err) => {
        console.error("Error fetching courses:", err);
      });
  }, []);

  const handleCreateTest = () => {
    navigate("/panel/tests/create");
  };

  const handleViewTest = (testId: number) => {
    navigate(`/panel/tests/${testId}`);
  };

  const handleViewReport = (testId: number) => {
    navigate(`/panel/tests/report/${testId}`);
  };

  // Filter tests based on search term and selected course
  const filteredTests = tests.filter((test) => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (test.description && test.description.toLowerCase().includes(searchTerm.toLowerCase()));
    if (selectedCourse === "all") {
      setSelectedCourse("")
    }
    const matchesCourse = selectedCourse ? test.course_detail.id.toString() === selectedCourse : true;
    
    return matchesSearch && matchesCourse;
  });

  const isTestActive = (test: Test) => {
    const now = new Date();
    const startTime = new Date(test.start_time);
    const endTime = new Date(test.end_time);
    return now >= startTime && now <= endTime;
  };

  const isTestUpcoming = (test: Test) => {
    const now = new Date();
    const startTime = new Date(test.start_time);
    return now < startTime;
  };

  const isTestExpired = (test: Test) => {
    const now = new Date();
    const endTime = new Date(test.end_time);
    return now > endTime;
  };

  const getTestStatusBadge = (test: Test) => {
    if (isTestActive(test)) {
      return <Badge className="bg-green-500">در حال برگزاری</Badge>;
    } else if (isTestUpcoming(test)) {
      return <Badge className="bg-blue-500">آینده</Badge>;
    } else if (isTestExpired(test)) {
      return <Badge className="bg-gray-500">منقضی شده</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">لیست آزمون‌ها</h1>
        <Button onClick={handleCreateTest}>
          <Plus className="mr-2 h-4 w-4" /> ایجاد آزمون جدید
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="جستجو در آزمون‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-1/3">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="فیلتر بر اساس دوره" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه دوره‌ها</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">هیچ آزمونی یافت نشد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <Card key={test.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                  {getTestStatusBadge(test)}
                </div>
                <CardDescription className="line-clamp-2">
                  {test.description || "بدون توضیحات"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 opacity-70" />
                    <span>شروع: {convertToJalali(test.start_time)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 opacity-70" />
                    <span>پایان: {convertToJalali(test.end_time)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 opacity-70" />
                    <span>مدت: {test.duration}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FileText className="h-4 w-4 mr-2 opacity-70" />
                    <span>دوره: {test.course_detail?.title}</span>
                  </div>
                  {test.sessions_count !== undefined && (
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 opacity-70" />
                      <span>تعداد شرکت‌کنندگان: {test.sessions_count}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => handleViewTest(test.id)}>
                  مشاهده
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => handleViewReport(test.id)}
                  disabled={!isTestExpired(test)}
                >
                  گزارش
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestsList;