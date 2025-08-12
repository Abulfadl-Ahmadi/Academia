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

  const handleSubmit = async () => {
    if (!name || !course || !pdfFile || !startTime || !endTime || !duration) {
      alert("لطفا همه فیلدهای ضروری را پر کنید");
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
      await axiosInstance.post(baseURL + "/tests/", payload);
      alert("✅ آزمون با موفقیت ثبت شد");
      setName("");
      setDescription("");
      setCourse("");
      setPdfFile("");
      setStartTime(null);
      setEndTime(null);
      setDuration(null);
      setAnswers({});
    } catch (err) {
      console.error(err);
      alert("❌ خطا در ثبت آزمون");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">ساخت آزمون جدید</h2>

      <Label>عنوان آزمون</Label>
      <Input
        placeholder="عنوان آزمون"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Label className="mt-4">توضیحات آزمون</Label>
      <Textarea
        placeholder="توضیحات..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Label className="mt-4">انتخاب دوره</Label>
      <select
        className="border p-2 rounded w-full"
        value={course}
        onChange={(e) => setCourse(e.target.value)}
      >
        <option value="">-- انتخاب کنید --</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>

      <Label className="mt-4">ID فایل PDF</Label>
      <select
        className="border p-2 rounded w-full"
        value={pdfFile}
        onChange={(e) => setPdfFile(e.target.value)}
      >
        <option value="">-- انتخاب فایل --</option>
        {files.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>

      <Label className="mt-4">زمان شروع</Label>
      <DatePicker
        format="YYYY-MM-DD HH:mm"
        render={<Input placeholder="زمان شروع" />}
        calendar={persian}
        locale={persian_fa}
        plugins={[<TimePicker position="bottom" />]}
        value={startTime}
        onChange={setStartTime}
      />

      <Label className="mt-4">زمان پایان</Label>
      <DatePicker
        format="YYYY-MM-DD HH:mm"
        render={<Input placeholder="زمان پایان" />}
        calendar={persian}
        locale={persian_fa}
        plugins={[<TimePicker position="bottom" />]}
        value={endTime}
        onChange={setEndTime}
      />

      <Label className="mt-4">مدت آزمون</Label>
      <DatePicker
        disableDayPicker
        format="HH:mm"
        render={<Input placeholder="مدت آزمون" />}
        plugins={[<TimePicker hideSeconds />]}
        value={duration}
        onChange={setDuration}
      />

      <Label className="mt-4">تکرار آزمون</Label>
      <select
        className="border p-2 rounded w-full"
        value={frequency}
        onChange={(e) => setFrequency(e.target.value)}
      >
        <option value="once">یکبار</option>
        <option value="weekly">هفتگی</option>
      </select>

      <Accordion type="single" collapsible className="mt-4">
        <AccordionItem value="item-1">
          <AccordionTrigger>کلید سوالات</AccordionTrigger>
          <AccordionContent>
            <div
              className="grid grid-cols-4 gap-4 flex-wrap-reverse"
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

      <Button className="mt-6" onClick={handleSubmit} disabled={loading}>
        {loading ? "در حال ثبت..." : "ثبت آزمون"}
      </Button>
    </div>
  );
}
