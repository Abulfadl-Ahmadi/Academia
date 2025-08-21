import axiosInstance from "@/lib/axios";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
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
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-picker";

export default function CreateTestInCollection() {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const { id: collectionId } = useParams(); // collection ID از URL
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTimeStr, setStartTimeStr] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTimeStr, setEndTimeStr] = useState("");
  const [durationHour, setDurationHour] = useState("");
  const [durationMinute, setDurationMinute] = useState("");
  const [frequency, setFrequency] = useState("once");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<{ id: number; name: string }[]>([]);

  // گرفتن لیست فایل‌ها با ContentType=Test
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await axiosInstance.get(`${baseURL}/files/?content_type=test`);
        const fileList = res.data.map((file: { id: number; title?: string }) => ({
          id: file.id,
          name: file.title || `File ${file.id}`,
        }));
        setFiles(fileList);
      } catch (err) {
        console.error("Error loading files:", err);
      }
    };
    
    fetchFiles();
  }, [baseURL]);

  const options = [
    { value: "1", label: "۱" },
    { value: "2", label: "۲" },
    { value: "3", label: "۳" },
    { value: "4", label: "۴" },
  ];

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
    if (!name || !pdfFile || !startDate || !endDate || !durationHour || !durationMinute) {
      toast.error("لطفا همه فیلدهای ضروری را پر کنید");
      return;
    }

    const keysArray = Object.entries(answers).map(([q, a]) => ({
      question_number: Number(q),
      answer: Number(a),
    }));
    
    // Combine date and time for start and end times
    const startDateTime = new Date(startDate);
    if (startTimeStr) {
      const [hours, minutes] = startTimeStr.split(":").map(Number);
      startDateTime.setHours(hours, minutes);
    }
    
    const endDateTime = new Date(endDate);
    if (endTimeStr) {
      const [hours, minutes] = endTimeStr.split(":").map(Number);
      endDateTime.setHours(hours, minutes);
    }

    const payload = {
      name,
      description,
      test_collection: Number(collectionId), // اضافه کردن مجموعه آزمون
      pdf_file: Number(pdfFile),
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      duration: `${durationHour.padStart(2, "0")}:${durationMinute.padStart(2, "0")}:00`,
      frequency,
      keys: keysArray,
    };

    try {
      setLoading(true);
      await axiosInstance.post(baseURL + "/tests/", payload);
      toast.success("آزمون با موفقیت ثبت شد");

      // Redirect back to test collection detail page
      navigate(`/panel/test-collections/${collectionId}`);
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
        <Button variant="outline" onClick={() => navigate(`/panel/test-collections/${collectionId}`)}>
          بازگشت به مجموعه آزمون
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
              <DateTimePicker
                date={startDate}
                setDate={setStartDate}
                time={startTimeStr}
                setTime={setStartTimeStr}
                placeholder="انتخاب زمان شروع"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-end-time">زمان پایان *</Label>
              <DateTimePicker
                date={endDate}
                setDate={setEndDate}
                time={endTimeStr}
                setTime={setEndTimeStr}
                placeholder="انتخاب زمان پایان"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-duration">مدت آزمون *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="test-duration-hour"
                    type="number"
                    min="0"
                    max="23"
                    placeholder="ساعت"
                    value={durationHour}
                    onChange={(e) => setDurationHour(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    id="test-duration-minute"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="دقیقه"
                    value={durationMinute}
                    onChange={(e) => setDurationMinute(e.target.value)}
                  />
                </div>
              </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-wrap-reverse" dir="ltr">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-2" dir="rtl">
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
