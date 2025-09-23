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

export default function EditTestInCollection() {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const { testId, collectionId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState("");
  const [answersFile, setAnswersFile] = useState<string | null>(null);
  const [selectedTestFile, setSelectedTestFile] = useState<File | null>(null);
  const [selectedAnswersFile, setSelectedAnswersFile] = useState<File | null>(null);
  const [uploadingTestFile, setUploadingTestFile] = useState(false);
  const [uploadingAnswersFile, setUploadingAnswersFile] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTimeStr, setStartTimeStr] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTimeStr, setEndTimeStr] = useState("");
  const [durationHour, setDurationHour] = useState("");
  const [durationMinute, setDurationMinute] = useState("");
  const [frequency, setFrequency] = useState("once");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [files, setFiles] = useState<{ id: number; name: string }[]>([]);

  // گرفتن لیست فایل‌ها با ContentType=Test
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await axiosInstance.get(`${baseURL}/files/?content_type=test`);
        
        // Handle both array and pagination format
        let filesData = [];
        if (Array.isArray(res.data)) {
          filesData = res.data;
        } else if (res.data && Array.isArray(res.data.results)) {
          filesData = res.data.results;
        } else {
          console.warn("Files data is not an array:", res.data);
          filesData = [];
        }
        
        const fileList = filesData.map((file: { id: number; title?: string }) => ({
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

  // بارگذاری اطلاعات آزمون
  useEffect(() => {
    const loadTestData = async () => {
      if (!testId) return;
      
      try {
        setInitialLoading(true);
        const response = await axiosInstance.get(`${baseURL}/tests/${testId}/`);
        const testData = response.data;
        
        console.log("Loaded test data:", testData);
        
        setName(testData.name || "");
        setDescription(testData.description || "");
        setPdfFile(testData.pdf_file?.toString() || "");
        setAnswersFile(testData.answers_file ? testData.answers_file.toString() : null);
        
        // تبدیل start_time و end_time
        if (testData.start_time) {
          const startDateTime = new Date(testData.start_time);
          setStartDate(startDateTime);
          const startHours = startDateTime.getHours().toString().padStart(2, '0');
          const startMinutes = startDateTime.getMinutes().toString().padStart(2, '0');
          setStartTimeStr(`${startHours}:${startMinutes}`);
        }
        
        if (testData.end_time) {
          const endDateTime = new Date(testData.end_time);
          setEndDate(endDateTime);
          const endHours = endDateTime.getHours().toString().padStart(2, '0');
          const endMinutes = endDateTime.getMinutes().toString().padStart(2, '0');
          setEndTimeStr(`${endHours}:${endMinutes}`);
        }
        
        // مدت زمان
        if (testData.duration) {
          console.log("Raw duration from API:", testData.duration);
          
          if (typeof testData.duration === 'string') {
            const [hours, minutes] = testData.duration.split(':');
            setDurationHour(hours || '0');
            setDurationMinute(minutes || '0');
          } else if (typeof testData.duration === 'number') {
            const hours = Math.floor(testData.duration / 60);
            const minutes = testData.duration % 60;
            setDurationHour(hours.toString());
            setDurationMinute(minutes.toString());
          }
        }
        
        setFrequency(testData.frequency || "once");
        
        // کلید جواب‌ها
        if (testData.keys && Array.isArray(testData.keys)) {
          const answersObject: Record<number, string> = {};
          testData.keys.forEach((key: { question_number: number; answer: number }) => {
            answersObject[key.question_number] = key.answer.toString();
          });
          setAnswers(answersObject);
        }
        
      } catch (error) {
        console.error("Error loading test data:", error);
        toast.error("خطا در بارگذاری اطلاعات آزمون");
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadTestData();
  }, [testId, baseURL]);

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

  // Function to handle file uploads
  const handleFileUpload = async (file: File, _contentType: string, setUploading: React.Dispatch<React.SetStateAction<boolean>>): Promise<number | null> => {
    if (!file) return null;
    
    // Get the course ID from the collection
    let courseId = null;
    try {
      const response = await axiosInstance.get(`${baseURL}/test-collections/${collectionId}/`);
      console.log('Test collection response:', response.data);
      
      // Debug extra information about the response
      console.log('Collection courses data type:', typeof response.data.courses);
      console.log('Course details data type:', typeof response.data.course_details);
      
      if (response.data.courses) {
        console.log('Courses array:', JSON.stringify(response.data.courses));
      }
      
      if (response.data.course_details) {
        console.log('Course details array:', JSON.stringify(response.data.course_details));
      }
      
      // Try to get course ID from course_details
      if (response.data.course_details && response.data.course_details.length > 0) {
        courseId = response.data.course_details[0].id;
        console.log('Found course ID from course_details:', courseId);
      } 
      // Try to get from courses field if course_details is not available
      else if (response.data.courses && response.data.courses.length > 0) {
        // If courses is an array of IDs
        if (typeof response.data.courses[0] === 'number') {
          courseId = response.data.courses[0];
        } 
        // If courses is an array of objects
        else if (response.data.courses[0] && response.data.courses[0].id) {
          courseId = response.data.courses[0].id;
        }
        console.log('Found course ID from courses:', courseId);
      }
    } catch (error) {
      console.error('Error fetching collection course:', error);
      toast.error('خطا در دریافت اطلاعات دوره');
      return null;
    }

    // If we still don't have a courseId, try to get it directly from the courses field
    // This is a fallback in case neither course_details nor courses properly structured are available
    if (!courseId && response?.data?.courses && Array.isArray(response?.data?.courses)) {
      console.log('Trying to extract course ID directly from courses array');
      // Try to get the first course ID from the array
      const firstCourse = response?.data?.courses[0];
      
      // Try multiple formats that might be returned by the API
      if (typeof firstCourse === 'number') {
        courseId = firstCourse;
        console.log('Found course ID as direct number:', courseId);
      } else if (typeof firstCourse === 'string' && !isNaN(Number(firstCourse))) {
        courseId = Number(firstCourse);
        console.log('Found course ID as string number:', courseId);
      } else if (firstCourse && typeof firstCourse === 'object') {
        // If it's an object with an id field
        if (firstCourse.id !== undefined) {
          courseId = firstCourse.id;
          console.log('Found course ID from object.id:', courseId);
        }
      }
    }
    
    if (!courseId) {
      console.error('No course ID found in test collection response');
      toast.error('این مجموعه آزمون به هیچ دوره‌ای متصل نیست. لطفاً ابتدا یک دوره به مجموعه آزمون اضافه کنید.');
      return null;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('description', '');
    formData.append('content_type', 'test');  // Always set content_type to 'test'
    formData.append('file_type', 'application/pdf');  // Set file_type for PDF files
    formData.append('course', courseId.toString());  // Add the course ID
    
    try {
      setUploading(true);
      const response = await axiosInstance.post(`${baseURL}/files/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update files list
      setFiles(prevFiles => [...prevFiles, { id: response.data.id, name: response.data.title || file.name }]);
      
      return response.data.id;
    } catch (error) {
      console.error(`Error uploading file:`, error);
      toast.error(`خطا در آپلود فایل ${file.name}`);
      return null;
    } finally {
      setUploading(false);
    }
  };
  
  const handleTestFileUpload = async () => {
    if (!selectedTestFile) {
      toast.error("لطفا ابتدا یک فایل انتخاب کنید");
      return;
    }
    
    const fileId = await handleFileUpload(selectedTestFile, 'test', setUploadingTestFile);
    if (fileId) {
      setPdfFile(fileId.toString());
      setSelectedTestFile(null); // Clear selected file after successful upload
      toast.success(`فایل آزمون با موفقیت آپلود شد`);
    }
  };
  
  const handleAnswersFileUpload = async () => {
    if (!selectedAnswersFile) {
      toast.error("لطفا ابتدا یک فایل انتخاب کنید");
      return;
    }
    
    const fileId = await handleFileUpload(selectedAnswersFile, 'test', setUploadingAnswersFile);
    if (fileId) {
      setAnswersFile(fileId.toString());
      setSelectedAnswersFile(null); // Clear selected file after successful upload
      toast.success(`فایل پاسخنامه با موفقیت آپلود شد`);
    }
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
      test_collection: Number(collectionId),
      pdf_file: Number(pdfFile),
      answers_file: answersFile && answersFile !== "none" ? Number(answersFile) : null,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      duration: `${durationHour.padStart(2, "0")}:${durationMinute.padStart(2, "0")}:00`,
      frequency,
      keys: keysArray,
    };

    try {
      setLoading(true);
      await axiosInstance.put(`${baseURL}/tests/${testId}/update`, payload);
      toast.success("آزمون با موفقیت ویرایش شد");

      // Redirect back to test collection detail page
      navigate(`/panel/test-collections/${collectionId}`);
    } catch (err) {
      console.error(err);
      toast.error("خطا در ویرایش آزمون");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="mr-2">در حال بارگذاری...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ویرایش آزمون</h2>
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
            <div className="space-y-3">
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
              
              <div className="pt-2">
                <Label htmlFor="upload-test-file">یا آپلود فایل PDF جدید:</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="upload-test-file"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setSelectedTestFile(e.target.files?.[0] || null)}
                        className="flex-1 pr-28 rtl"
                      />
                      <label htmlFor="upload-test-file" className="absolute top-0 right-0">
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm"
                          className="h-full rounded-l-none border-l"
                        >
                          انتخاب فایل
                        </Button>
                      </label>
                    </div>
                  </div>
                  
                  {selectedTestFile && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground flex-1 truncate">
                        {selectedTestFile.name}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleTestFileUpload()}
                        disabled={uploadingTestFile}
                      >
                        {uploadingTestFile ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current ml-2"></div>
                            در حال آپلود...
                          </>
                        ) : (
                          <>آپلود فایل</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="answers-pdf">فایل پاسخنامه (اختیاری)</Label>
            <div className="space-y-3">
              <Select value={answersFile || "none"} onValueChange={(value) => setAnswersFile(value === "none" ? null : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="-- انتخاب فایل --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">هیچکدام</SelectItem>
                  {files.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="pt-2">
                <Label htmlFor="upload-answers-file">یا آپلود فایل پاسخنامه جدید:</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="upload-answers-file"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setSelectedAnswersFile(e.target.files?.[0] || null)}
                        className="flex-1 pr-28 rtl"
                      />
                      <label htmlFor="upload-answers-file" className="absolute top-0 right-0">
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm"
                          className="h-full rounded-l-none border-l"
                        >
                          انتخاب فایل
                        </Button>
                      </label>
                    </div>
                  </div>
                  
                  {selectedAnswersFile && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground flex-1 truncate">
                        {selectedAnswersFile.name}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAnswersFileUpload()}
                        disabled={uploadingAnswersFile}
                      >
                        {uploadingAnswersFile ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current ml-2"></div>
                            در حال آپلود...
                          </>
                        ) : (
                          <>آپلود فایل</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
              در حال ذخیره...
            </>
          ) : (
            "ذخیره تغییرات"
          )}
        </Button>
      </div>
    </div>
  );
}
