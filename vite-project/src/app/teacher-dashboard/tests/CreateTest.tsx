import axiosInstance from "@/lib/axios";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function TeacherTestApp() {
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [courses, setCourses] = useState<{ id: number; title: string }[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [course, setCourse] = useState("");
  const [pdfFile, setPdfFile] = useState("");
  const [startTime, setStartTime] = useState<any>(null);
  const [endTime, setEndTime] = useState<any>(null);
  const [duration, setDuration] = useState<any>(null);
  const [frequency, setFrequency] = useState("once");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<{ id: number; name: string }[]>([]);

  // گرفتن لیست فایل‌ها با ContentType=Test
  useEffect(() => {
    axiosInstance
      .get(baseURL + "/files/?content_type=test")
      .then((res) => {
        const fileList = res.data.map((file: any) => ({
          id: file.id,
          name: file.title || `File ${file.id}`,
        }));
        setFiles(fileList);
      })
      .catch((err) => {
        console.error("Error loading files:", err);
      });
  }, []);

  const options = [
    { value: "1", label: "۱" },
    { value: "2", label: "۲" },
    { value: "3", label: "۳" },
    { value: "4", label: "۴" },
  ];

  useEffect(() => {
    axiosInstance
      .get(baseURL + "/courses/")
      .then((res) => {
        const groupList = res.data.map((course: any) => ({
          id: course.id,
          title: course.title,
        }));
        setCourses(groupList);
      })
      .catch((err) => {
        console.error("Error loading courses:", err);
      });
  }, []);

  const handleAnswer = (questionNumber: number, selectedValue: string) => {
    setAnswers((prev) => {
      const current = prev[questionNumber];
      const newAnswers = { ...prev };
      if (current === selectedValue) {
        delete newAnswers[questionNumber];
      } else {
        newAnswers[questionNumber] = selectedValue;
      }
      return newAnswers;
    });
  };

  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!name || !course || !pdfFile || !startTime || !endTime || !duration) {
      toast.error("لطفا همه فیلدهای ضروری را پر کنید");
      return;
    }

    const keysArray = Object.entries(answers).map(([q, a]) => ({
      question_number: Number(q),
      answer: Number(a),
    }));

    const payload = {
      name,
      description,
      course: Number(course),
      pdf_file: Number(pdfFile),
      start_time: startTime.toDate().toISOString(),
      end_time: endTime.toDate().toISOString(),
      duration: `${String(duration.hour).padStart(2, "0")}:${String(
        duration.minute
      ).padStart(2, "0")}:00`,
      frequency,
      keys: keysArray,
    };

    try {
      setLoading(true);
      const response = await axiosInstance.post(baseURL + "/tests/", payload);
      toast.success("آزمون با موفقیت ثبت شد");
      
      // Redirect to tests list page after successful creation
      navigate("/panel/tests");
    } catch (err) {
      console.error(err);
      toast.error("خطا در ثبت آزمون");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ساخت آزمون جدید</h2>
        <Button variant="outline" onClick={() => navigate("/panel/tests")}>
          بازگشت به لیست آزمون‌ها
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>اطلاعات پایه آزمون</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-name">عنوان آزمون *</Label>
            <Input
              id="test-name"
              placeholder="عنوان آزمون"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-description">توضیحات آزمون</Label>
            <Textarea
              id="test-description"
              placeholder="توضیحات..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-course">انتخاب دوره *</Label>
            <Select value={course} onValueChange={setCourse}>
              <SelectTrigger>
                <SelectValue placeholder="-- انتخاب کنید --" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-pdf">فایل PDF آزمون *</Label>
            <Select value={pdfFile} onValueChange={setPdfFile}>
              <SelectTrigger>
                <SelectValue placeholder="-- انتخاب فایل --" />
              </SelectTrigger>
              <SelectContent>
                {files.map((f) => (
                  <SelectItem key={f.id} value={f.id.toString()}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>زمان‌بندی آزمون</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-start-time">زمان شروع *</Label>
              <DatePicker
                format="YYYY-MM-DD HH:mm"
                render={<Input id="test-start-time" placeholder="زمان شروع" />}
                calendar={persian}
                locale={persian_fa}
                plugins={[<TimePicker position="bottom" />]}
                value={startTime}
                onChange={setStartTime}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-end-time">زمان پایان *</Label>
              <DatePicker
                format="YYYY-MM-DD HH:mm"
                render={<Input id="test-end-time" placeholder="زمان پایان" />}
                calendar={persian}
                locale={persian_fa}
                plugins={[<TimePicker position="bottom" />]}
                value={endTime}
                onChange={setEndTime}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-duration">مدت آزمون *</Label>
              <DatePicker
                disableDayPicker
                format="HH:mm"
                render={<Input id="test-duration" placeholder="مدت آزمون" />}
                plugins={[<TimePicker hideSeconds />]}
                value={duration}
                onChange={setDuration}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-frequency">تکرار آزمون</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger id="test-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">یکبار</SelectItem>
                  <SelectItem value="weekly">هفتگی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>کلید سوالات</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>مشاهده و ویرایش کلید سوالات</AccordionTrigger>
              <AccordionContent>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-wrap-reverse"
                  style={{ direction: "ltr" }}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-2" style={{ direction: "rtl" }}>
                      {Array.from({ length: 10 }).map((_, j) => {
                        const questionNumber = 10 * i + j + 1;
                        return (
                          <div
                            key={questionNumber}
                            className="flex flex-row-reverse items-center gap-2"
                          >
                            <div className="w-7 pr-2">{questionNumber}</div>
                            <RadioGroup.Root
                              value={answers[questionNumber] || null}
                              className="w-full grid grid-cols-4 gap-2"
                            >
                              {options.map((option) => (
                                <RadioGroup.Item
                                  key={option.value}
                                  value={option.value}
                                  onMouseDown={() =>
                                    handleAnswer(questionNumber, option.value)
                                  }
                                  className="ring-[2px] my-1 ring-border rounded-md px-3 data-[state=checked]:bg-black data-[state=checked]:text-white"
                                >
                                  <span className="text-sm tracking-tight">
                                    {option.label}
                                  </span>
                                </RadioGroup.Item>
                              ))}
                            </RadioGroup.Root>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={loading} className="w-full md:w-auto">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              در حال ثبت...
            </>
          ) : (
            "ثبت آزمون"
          )}
        </Button>
      </div>
    </div>
  );
}
