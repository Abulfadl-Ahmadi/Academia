import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { ArrowRight, Save, Plus, FileText, ClipboardList, Search, FilterX } from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DateTimePicker } from "@/components/ui/date-picker";
import { FolderSelector } from "@/components/FolderSelector";
import { QuestionCard } from "@/components/QuestionCard";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { useSidebar } from "@/components/ui/sidebar";


export type TestTypeOption = "scheduled" | "topic_based" | "practice";
export type ContentTypeOption = "pdf" | "typed_question";

interface FileItem {
  id: number;
  title: string;
  content_type: string;
  file_type: string;
}

interface QuestionOption {
  id: number;
  option_text: string;
  order: number;
}

interface QuestionImageItem {
  id: number;
  image: string;
  alt_text?: string;
  order: number;
}

interface Question {
  id: number;
  public_id: string;
  question_text: string;
  difficulty_level: "easy" | "medium" | "hard";
  folders: number[];
  folders_names: string[];
  options: QuestionOption[];
  correct_option?: number;
  detailed_solution?: string;
  images?: QuestionImageItem[];
  detailed_solution_images?: QuestionImageItem[];
  created_at: string;
  updated_at: string;
  publish_date: string;
  source: string;
  is_active: boolean;
}

interface Folder {
  id: number;
  name: string;
  parent: number | null;
}

interface TestCollection {
  id: number;
  name: string;
  description?: string;
}

const isTestTypeOption = (value: unknown): value is TestTypeOption =>
  value === "scheduled" || value === "topic_based" || value === "practice";

const isContentTypeOption = (value: unknown): value is ContentTypeOption =>
  value === "pdf" || value === "typed_question";

const padTime = (value: number) => value.toString().padStart(2, "0");

interface TestKeyPayload {
  question_number: number;
  answer: number;
}

interface TestDetailResponse {
  id: number;
  name?: string | null;
  description?: string | null;
  test_type?: TestTypeOption | null;
  content_type?: ContentTypeOption | null;
  is_active?: boolean | null;
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration?: string | null;
  duration_formatted?: string | null;
  frequency?: string | null;
  test_collection?: number | null;
  pdf_file?: number | null;
  answers_file?: number | null;
  keys?: TestKeyPayload[] | null;
  questions?: Array<Question | number> | null;
  folders?: number[] | null;
  total_questions?: number | null;
}

const AnswerKeyGrid = ({
  answers,
  onAnswerChange,
  questionCount,
}: {
  answers: string[];
  onAnswerChange: (index: number, value: string) => void;
  questionCount: number;
}) => {
  const { state } = useSidebar();

  const renderColumn = (startIndex: number) => (
    <div className="flex flex-col gap-1" key={`column-${startIndex}`}>
      {Array.from({ length: 10 }, (_, i) => {
        const questionIndex = startIndex + i;
        const questionNumber = questionIndex + 1;

        if (questionNumber > questionCount) return null;

        return (
          <div key={questionIndex} className="flex items-center gap-2">
            <span className="w-5 pl-2 text-left text-sm font-medium">
              {questionNumber}
            </span>
            <RadioGroup.Root
              value={answers[questionIndex] || ""}
              onValueChange={(value) => onAnswerChange(questionIndex, value)}
              className="flex gap-1"
            >
              {["1", "2", "3", "4"].map((option) => (
                <RadioGroup.Item
                  key={option}
                  value={option}
                  className={`
                    flex h-8 w-8 cursor-pointer items-center justify-center rounded border-2 text-sm font-medium transition-colors
                    ${answers[questionIndex] === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/50"}
                  `}
                >
                  {option}
                </RadioGroup.Item>
              ))}
            </RadioGroup.Root>
          </div>
        );
      })}
    </div>
  );

  const gridClasses = state === "collapsed"
    ? "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
    : "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

  const columnsNeeded = Math.ceil(questionCount / 10);

  return (
    <div className={`${gridClasses} gap-3 p-3 sm:p-4 lg:gap-5 xl:gap-6 2xl:gap-7 bg-muted/30 rounded-lg`}>
      {Array.from({ length: columnsNeeded }, (_, colIndex) => renderColumn(colIndex * 10))}
    </div>
  );
};

const durationHoursOptions = Array.from({ length: 5 }, (_, idx) => idx.toString());
const durationMinutesOptions = ["0", "15", "30", "45"];

const frequencyOptions = [
  { value: "once", label: "یک بار" },
  { value: "daily", label: "روزانه" },
  { value: "weekly", label: "هفتگی" },
  { value: "monthly", label: "ماهانه" },
];

interface CreateTestPageProps {
  mode?: "create" | "edit";
}

export default function CreateTestPage({ mode = "create" }: CreateTestPageProps = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { testId: pathTestId } = useParams<{ testId?: string }>();
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [testType, setTestType] = useState<TestTypeOption>(() => {
    const typeParam = searchParams.get("type");
    if (typeParam === "scheduled" || typeParam === "topic_based" || typeParam === "practice") {
      return typeParam;
    }
    return "scheduled";
  });
  const [contentType, setContentType] = useState<ContentTypeOption>(() => {
    const contentParam = searchParams.get("content");
    if (contentParam === "pdf" || contentParam === "typed_question") {
      return contentParam;
    }
    return "pdf";
  });
  const [isActive, setIsActive] = useState(true);
  const [frequency, setFrequency] = useState("once");
  const [testCollectionId, setTestCollectionId] = useState<string>("none");

  const [durationHour, setDurationHour] = useState("0");
  const [durationMinute, setDurationMinute] = useState("30");

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTimeStr, setStartTimeStr] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTimeStr, setEndTimeStr] = useState("");

  const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>([]);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [pdfFileId, setPdfFileId] = useState<number | null>(null);
  const [answersFileId, setAnswersFileId] = useState<number | null>(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [selectedAnswersFile, setSelectedAnswersFile] = useState<File | null>(null);
  const [uploadingPdfFile, setUploadingPdfFile] = useState(false);
  const [uploadingAnswersFile, setUploadingAnswersFile] = useState(false);

  const [questionCount, setQuestionCount] = useState(60);
  const [answerKeys, setAnswerKeys] = useState<string[]>(() => Array(60).fill(""));

  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [folderFilter, setFolderFilter] = useState<number | null>(null);

  const [availableFolders, setAvailableFolders] = useState<Folder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [availableCollections, setAvailableCollections] = useState<TestCollection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  const queryTestId = searchParams.get("testId");
  const resolvedTestId = pathTestId ?? queryTestId ?? undefined;
  const parsedTestId = resolvedTestId ? Number.parseInt(resolvedTestId, 10) : Number.NaN;
  const effectiveTestId = !Number.isNaN(parsedTestId) && parsedTestId > 0 ? parsedTestId : undefined;
  const isEditing = mode === "edit" || typeof effectiveTestId === "number";

  const applyDurationFromValue = useCallback((value?: string | null) => {
    if (!value) {
      setDurationHour("0");
      setDurationMinute("30");
      return;
    }

    let hours = 0;
    let minutes = 0;

    if (value.startsWith("PT")) {
      const isoMatch = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
      if (isoMatch) {
        hours = Number.parseInt(isoMatch[1] ?? "0", 10);
        minutes = Number.parseInt(isoMatch[2] ?? "0", 10);
        if (!minutes && isoMatch[3]) {
          const seconds = Number.parseInt(isoMatch[3], 10);
          minutes = Math.round(seconds / 60);
        }
      }
    } else if (value.includes(":")) {
      const parts = value.split(":");
      hours = Number.parseInt(parts[0] ?? "0", 10);
      minutes = Number.parseInt(parts[1] ?? "0", 10);
    } else {
      const numericMinutes = Number.parseInt(value, 10);
      if (!Number.isNaN(numericMinutes)) {
        minutes = numericMinutes;
      }
    }

    const clampedHours = Math.max(0, Math.min(hours, durationHoursOptions.length - 1));
    const possibleMinutes = durationMinutesOptions.map((option) => Number.parseInt(option, 10));
    let normalizedMinutes = minutes;
    if (!durationMinutesOptions.includes(normalizedMinutes.toString())) {
      const closest = possibleMinutes.reduce((prev, current) =>
        Math.abs(current - normalizedMinutes) < Math.abs(prev - normalizedMinutes) ? current : prev
      );
      normalizedMinutes = closest;
    }

    setDurationHour(clampedHours.toString());
    setDurationMinute(normalizedMinutes.toString());
  }, []);

  const parseDateTimeValue = useCallback((value?: string | null) => {
    if (!value) {
      return { date: undefined as Date | undefined, time: "" };
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return { date: undefined as Date | undefined, time: "" };
    }
    return {
      date: parsed,
      time: `${padTime(parsed.getHours())}:${padTime(parsed.getMinutes())}`,
    };
  }, []);

  const pageTitle = isEditing ? "ویرایش آزمون" : "ایجاد آزمون جدید";
  const pageDescription = isEditing
    ? "ویرایش تنظیمات آزمون موجود، شامل فایل‌ها، پوشه‌ها و سوالات"
    : "ساخت آزمون با انتخاب نوع (زمان‌بندی شده، مبحثی، تمرینی) و نوع محتوا (PDF یا سوالات تایپ شده)";

  useEffect(() => {
    if (mode === "edit" && typeof effectiveTestId !== "number") {
      toast.error("شناسه آزمون نامعتبر است");
      navigate("/panel/tests");
    }
  }, [mode, effectiveTestId, navigate]);

  const loadFiles = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/files/?content_type=test");
      let filesData: FileItem[] = [];
      if (Array.isArray(response.data)) {
        filesData = response.data as FileItem[];
      } else if (response.data && Array.isArray(response.data.results)) {
        filesData = response.data.results as FileItem[];
      }
      setFiles(filesData);
    } catch (error) {
      console.error("Error loading files:", error);
      toast.error("خطا در بارگذاری فایل‌ها");
    }
  }, []);

  const loadCollections = useCallback(async () => {
    try {
      setCollectionsLoading(true);
      const response = await axiosInstance.get("/test-collections/");
      let collections: TestCollection[] = [];
      if (Array.isArray(response.data)) {
        collections = response.data as TestCollection[];
      } else if (response.data && Array.isArray(response.data.results)) {
        collections = response.data.results as TestCollection[];
      }
      setAvailableCollections(collections);
    } catch (error) {
      console.error("Error loading test collections:", error);
      toast.error("خطا در بارگذاری مجموعه آزمون‌ها");
    } finally {
      setCollectionsLoading(false);
    }
  }, []);

  const loadFolders = useCallback(async () => {
    try {
      setFoldersLoading(true);
      const response = await axiosInstance.get("/knowledge/folders/");
      let folders: Folder[] = [];
      if (Array.isArray(response.data)) {
        folders = response.data as Folder[];
      } else if (response.data && Array.isArray(response.data.results)) {
        folders = response.data.results as Folder[];
      }
      setAvailableFolders(folders);
    } catch (error) {
      console.error("Error loading folders:", error);
      toast.error("خطا در بارگذاری پوشه‌ها");
    } finally {
      setFoldersLoading(false);
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      setLoadingQuestions(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (difficultyFilter !== "all") params.append("difficulty_level", difficultyFilter);
      if (folderFilter) params.append("folders", folderFilter.toString());
      const queryString = params.toString();
      const url = queryString ? `/questions/?${queryString}` : "/questions/";
      const response = await axiosInstance.get(url);
      let questions: Question[] = [];
      if (Array.isArray(response.data)) {
        questions = response.data as Question[];
      } else if (response.data && Array.isArray(response.data.results)) {
        questions = response.data.results as Question[];
      }
      setAvailableQuestions(questions);
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("خطا در بارگذاری سوالات");
    } finally {
      setLoadingQuestions(false);
    }
  }, [searchQuery, difficultyFilter, folderFilter]);

  const fetchTestDetails = useCallback(async (testId: number) => {
    try {
      const response = await axiosInstance.get(`/tests/${testId}/`);
      const data = response.data as TestDetailResponse;

      setName(data.name ?? "");
      setDescription(data.description ?? "");

      if (isTestTypeOption(data.test_type)) {
        setTestType(data.test_type);
      }

      if (isContentTypeOption(data.content_type)) {
        setContentType(data.content_type);
      }

      setIsActive(data.is_active ?? true);
      setFrequency(data.frequency ?? "once");

      if (data.test_collection) {
        setTestCollectionId(data.test_collection.toString());
      } else {
        setTestCollectionId("none");
      }

      const { date: startDateValue, time: startTimeValue } = parseDateTimeValue(data.start_time);
      setStartDate(startDateValue);
      setStartTimeStr(startTimeValue);

      const { date: endDateValue, time: endTimeValue } = parseDateTimeValue(data.end_time);
      setEndDate(endDateValue);
      setEndTimeStr(endTimeValue);

      applyDurationFromValue(data.duration ?? data.duration_formatted ?? null);

      const folderIds = Array.isArray(data.folders) ? data.folders : [];
      setSelectedFolderIds(folderIds);

      const resolvedContentType = isContentTypeOption(data.content_type) ? data.content_type : contentType;
      if (resolvedContentType === "pdf") {
        setPdfFileId(data.pdf_file ?? null);
        setAnswersFileId(data.answers_file ?? null);
        setSelectedPdfFile(null);
        setSelectedAnswersFile(null);

        const keys = Array.isArray(data.keys) ? data.keys : [];
        const highestQuestionNumber = keys.reduce((acc, key) => Math.max(acc, key.question_number ?? 0), 0);
        const derivedCount = Math.max(
          data.total_questions ?? 0,
          highestQuestionNumber,
          1
        );
        setQuestionCount(derivedCount);
        const answers = Array.from({ length: derivedCount }, () => "");
        keys.forEach((key) => {
          if (key.question_number >= 1 && key.question_number <= derivedCount) {
            answers[key.question_number - 1] = key.answer.toString();
          }
        });
        setAnswerKeys(answers);
        setSelectedQuestions([]);
      } else {
        setPdfFileId(null);
        setAnswersFileId(null);
        setSelectedPdfFile(null);
        setSelectedAnswersFile(null);
        const questionsRaw = Array.isArray(data.questions) ? data.questions : [];
        const typedQuestions = questionsRaw.filter(
          (question): question is Question => typeof question === "object" && question !== null && "id" in question
        );
        setSelectedQuestions(typedQuestions);
        setAnswerKeys((prev) => prev.map(() => ""));
      }
    } catch (error) {
      console.error("Error loading test details:", error);
      toast.error("خطا در بارگذاری اطلاعات آزمون");
      navigate("/panel/tests");
      throw error;
    }
  }, [applyDurationFromValue, contentType, navigate, parseDateTimeValue]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const tasks: Promise<unknown>[] = [loadFiles(), loadCollections(), loadFolders()];
        if (typeof effectiveTestId === "number") {
          tasks.push(fetchTestDetails(effectiveTestId));
        }
        await Promise.all(tasks);
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setInitializing(false);
      }
    };
    bootstrap();
  }, [loadFiles, loadCollections, loadFolders, fetchTestDetails, effectiveTestId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const questionIds = useMemo(() => selectedQuestions.map((q) => q.id), [selectedQuestions]);

  const handleQuestionToggle = (question: Question, selected: boolean) => {
    setSelectedQuestions((prev) => {
      if (selected) {
        if (prev.some((item) => item.id === question.id)) {
          return prev;
        }
        return [...prev, question];
      }
      return prev.filter((item) => item.id !== question.id);
    });
  };

  const handleRemoveSelectedQuestion = (questionId: number) => {
    setSelectedQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setDifficultyFilter("all");
    setFolderFilter(null);
  };

  const handleAnswerChange = (index: number, value: string) => {
    setAnswerKeys((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleQuestionCountChange = (value: string) => {
    const parsed = parseInt(value, 10);
    const safeValue = Number.isNaN(parsed) ? 1 : Math.min(Math.max(parsed, 1), 200);
    setQuestionCount(safeValue);
    setAnswerKeys((prev) => {
      const next = Array(safeValue).fill("");
      for (let i = 0; i < Math.min(prev.length, safeValue); i += 1) {
        next[i] = prev[i];
      }
      return next;
    });
  };

  const handleFileUpload = async (
    file: File,
    setUploading: (value: boolean) => void,
    onSuccess: (fileId: number) => void
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);
    formData.append("description", "");
    formData.append("content_type", "test");
    formData.append("file_type", "application/pdf");

    try {
      setUploading(true);
      const response = await axiosInstance.post("/files/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const createdFile = response.data;
      setFiles((prev) => [...prev, {
        id: createdFile.id,
        title: createdFile.title || file.name,
        content_type: createdFile.content_type || "test",
        file_type: createdFile.file_type || "application/pdf",
      }]);
      onSuccess(createdFile.id);
      toast.success("فایل با موفقیت آپلود شد");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("خطا در آپلود فایل");
    } finally {
      setUploading(false);
    }
  };

  const combineDateTime = (date?: Date, time?: string) => {
    if (!date || !time) return undefined;
    const [hours, minutes] = time.split(":").map((part) => parseInt(part, 10) || 0);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined.toISOString();
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setTestType("scheduled");
    setContentType("pdf");
    setIsActive(true);
    setFrequency("once");
    setTestCollectionId("none");
    setDurationHour("0");
    setDurationMinute("30");
    setStartDate(undefined);
    setStartTimeStr("");
    setEndDate(undefined);
    setEndTimeStr("");
    setSelectedFolderIds([]);
    setPdfFileId(null);
    setAnswersFileId(null);
    setSelectedPdfFile(null);
    setSelectedAnswersFile(null);
    setQuestionCount(60);
    setAnswerKeys(Array(60).fill(""));
    setSelectedQuestions([]);
  };

  const handleSubmit = async (saveAndCreateAnother = false) => {
    if (!name.trim()) {
      toast.error("نام آزمون الزامی است");
      return;
    }

    if (contentType === "pdf" && !pdfFileId) {
      toast.error("لطفاً فایل آزمون PDF را انتخاب کنید");
      return;
    }

    if (contentType === "typed_question" && selectedQuestions.length === 0) {
      toast.error("لطفاً حداقل یک سوال انتخاب کنید");
      return;
    }

    if (testType === "scheduled") {
      if (!startDate || !startTimeStr || !endDate || !endTimeStr) {
        toast.error("برای آزمون زمان‌بندی شده، زمان شروع و پایان الزامی است");
        return;
      }
      const startIso = combineDateTime(startDate, startTimeStr);
      const endIso = combineDateTime(endDate, endTimeStr);
      if (startIso && endIso && new Date(startIso) >= new Date(endIso)) {
        toast.error("زمان پایان باید بعد از زمان شروع باشد");
        return;
      }
    }

    if (testType === "topic_based" && selectedFolderIds.length === 0) {
      toast.error("برای آزمون مبحثی، انتخاب حداقل یک پوشه الزامی است");
      return;
    }

    if (contentType === "pdf" && questionCount <= 0) {
      toast.error("تعداد سوالات باید حداقل 1 باشد");
      return;
    }

  const hours = parseInt(durationHour, 10) || 0;
  const minutes = parseInt(durationMinute, 10) || 0;
  const durationSegments: string[] = [];
  if (hours) durationSegments.push(`${hours}H`);
  if (minutes) durationSegments.push(`${minutes}M`);
  const durationIso = `PT${durationSegments.length ? durationSegments.join("") : "0M"}`;

    const startIso = testType === "scheduled" ? combineDateTime(startDate, startTimeStr) : undefined;
    const endIso = testType === "scheduled" ? combineDateTime(endDate, endTimeStr) : undefined;

    const keysPayload = contentType === "pdf"
      ? answerKeys
          .map((answer, index) => (answer ? ({ question_number: index + 1, answer: parseInt(answer, 10) }) : null))
          .filter(Boolean)
      : [];

    const payload: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || undefined,
      is_active: isActive,
      duration: durationIso,
      start_time: startIso,
      end_time: endIso,
    };

    if (testType === "scheduled") {
      payload.frequency = frequency;
    } else if (isEditing) {
      payload.frequency = null;
    }

    if (selectedFolderIds.length) {
      payload.folders = selectedFolderIds;
    } else if (isEditing) {
      payload.folders = [];
    }

    if (testCollectionId !== "none") {
      payload.test_collection = Number(testCollectionId);
    } else if (isEditing) {
      payload.test_collection = null;
    }

    if (!isEditing) {
      payload.test_type = testType;
      payload.content_type = contentType;
    }

    if (contentType === "pdf") {
      payload.pdf_file = pdfFileId;
      payload.answers_file = answersFileId;
      payload.keys = keysPayload;
      if (isEditing) {
        payload.questions = [];
      }
    } else {
      payload.questions = questionIds;
      if (isEditing) {
        payload.pdf_file = null;
        payload.answers_file = null;
        payload.keys = [];
      }
    }

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    setSubmitting(true);
    try {
      if (isEditing && typeof effectiveTestId === "number") {
        await axiosInstance.patch(`/tests/${effectiveTestId}/update`, payload);
        toast.success("آزمون با موفقیت به‌روزرسانی شد");
        navigate("/panel/tests");
      } else {
        await axiosInstance.post("/tests/", payload);
        toast.success("آزمون با موفقیت ایجاد شد");
        if (saveAndCreateAnother) {
          resetForm();
          loadQuestions();
        } else {
          navigate("/panel/tests");
        }
      }
    } catch (error) {
      console.error(isEditing ? "Error updating test:" : "Error creating test:", error);
      toast.error(isEditing ? "خطا در بروزرسانی آزمون" : "خطا در ایجاد آزمون");
    } finally {
      setSubmitting(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/panel/tests")}> 
          <ArrowRight className="ml-2 h-4 w-4" />
          بازگشت
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {pageDescription}
          </p>
        </div>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              اطلاعات پایه آزمون
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="test-name">نام آزمون *</Label>
                <Input
                  id="test-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="مثال: آزمون فصل تابع - سطح ۱"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>نوع آزمون</Label>
                <Select
                  value={testType}
                  onValueChange={(value: TestTypeOption) => setTestType(value)}
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">زمان‌بندی شده</SelectItem>
                    <SelectItem value="topic_based">مبحثی</SelectItem>
                    <SelectItem value="practice">تمرینی</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>نوع محتوا</Label>
                <Select
                  value={contentType}
                  onValueChange={(value: ContentTypeOption) => setContentType(value)}
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">فایل PDF</SelectItem>
                    <SelectItem value="typed_question">سوالات تایپ شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>مدت زمان آزمون</Label>
                <div className="flex items-center gap-2">
                  <Select value={durationHour} onValueChange={setDurationHour}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="ساعت" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationHoursOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option} ساعت
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={durationMinute} onValueChange={setDurationMinute}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="دقیقه" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationMinutesOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option} دقیقه
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {testType === "scheduled" && (
                <>
                  <div className="space-y-2">
                    <Label>زمان شروع</Label>
                    <DateTimePicker
                      date={startDate}
                      setDate={setStartDate}
                      time={startTimeStr}
                      setTime={setStartTimeStr}
                      placeholder="انتخاب زمان شروع"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>زمان پایان</Label>
                    <DateTimePicker
                      date={endDate}
                      setDate={setEndDate}
                      time={endTimeStr}
                      setTime={setEndTimeStr}
                      placeholder="انتخاب زمان پایان"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تکرار آزمون</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>مجموعه آزمون (اختیاری)</Label>
                <Select
                  value={testCollectionId}
                  onValueChange={setTestCollectionId}
                  disabled={collectionsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب مجموعه" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون اتصال به مجموعه</SelectItem>
                    {availableCollections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id.toString()}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات</Label>
              <Textarea
                id="description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="توضیحات تکمیلی آزمون..."
              />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="is-active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(Boolean(checked))}
              />
              <Label htmlFor="is-active">آزمون فعال باشد</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              پوشه‌های مرتبط
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FolderSelector
              selectedFolderIds={selectedFolderIds}
              onSelectionChange={setSelectedFolderIds}
              required={testType === "topic_based"}
            />
          </CardContent>
        </Card>

        {contentType === "pdf" && (
          <Card>
            <CardHeader>
              <CardTitle>فایل‌های آزمون</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">فایل PDF آزمون *</Label>
                <Tabs defaultValue="select" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="select">انتخاب فایل موجود</TabsTrigger>
                    <TabsTrigger value="upload">آپلود فایل جدید</TabsTrigger>
                  </TabsList>
                  <TabsContent value="select" className="space-y-2">
                    <Select
                      value={pdfFileId ? pdfFileId.toString() : "none"}
                      onValueChange={(value) => setPdfFileId(value === "none" ? null : Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب فایل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">انتخاب نشده</SelectItem>
                        {files.map((file) => (
                          <SelectItem key={file.id} value={file.id.toString()}>
                            {file.title || `فایل شماره ${file.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                  <TabsContent value="upload" className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(event) => setSelectedPdfFile(event.target.files?.[0] || null)}
                      />
                      <Button
                        type="button"
                        disabled={!selectedPdfFile || uploadingPdfFile}
                        onClick={() => {
                          if (selectedPdfFile) {
                            handleFileUpload(selectedPdfFile, setUploadingPdfFile, (id) => {
                              setPdfFileId(id);
                              setSelectedPdfFile(null);
                            });
                          }
                        }}
                      >
                        {uploadingPdfFile ? "در حال آپلود..." : "آپلود"}
                      </Button>
                    </div>
                    {selectedPdfFile && (
                      <p className="text-sm text-muted-foreground">{selectedPdfFile.name}</p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">فایل پاسخنامه (اختیاری)</Label>
                <Tabs defaultValue="select" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="select">انتخاب فایل موجود</TabsTrigger>
                    <TabsTrigger value="upload">آپلود فایل جدید</TabsTrigger>
                  </TabsList>
                  <TabsContent value="select" className="space-y-2">
                    <Select
                      value={answersFileId ? answersFileId.toString() : "none"}
                      onValueChange={(value) => setAnswersFileId(value === "none" ? null : Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب فایل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون فایل پاسخنامه</SelectItem>
                        {files.map((file) => (
                          <SelectItem key={file.id} value={file.id.toString()}>
                            {file.title || `فایل شماره ${file.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                  <TabsContent value="upload" className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(event) => setSelectedAnswersFile(event.target.files?.[0] || null)}
                      />
                      <Button
                        type="button"
                        disabled={!selectedAnswersFile || uploadingAnswersFile}
                        onClick={() => {
                          if (selectedAnswersFile) {
                            handleFileUpload(selectedAnswersFile, setUploadingAnswersFile, (id) => {
                              setAnswersFileId(id);
                              setSelectedAnswersFile(null);
                            });
                          }
                        }}
                      >
                        {uploadingAnswersFile ? "در حال آپلود..." : "آپلود"}
                      </Button>
                    </div>
                    {selectedAnswersFile && (
                      <p className="text-sm text-muted-foreground">{selectedAnswersFile.name}</p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium">کلید پاسخ</Label>
                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="question-count">تعداد سوالات</Label>
                    <Input
                      id="question-count"
                      type="number"
                      min={1}
                      max={200}
                      value={questionCount}
                      onChange={(event) => handleQuestionCountChange(event.target.value)}
                    />
                  </div>
                </div>
                <Accordion type="single" collapsible>
                  <AccordionItem value="keys">
                    <AccordionTrigger>تنظیم پاسخ‌ها ({questionCount} سوال)</AccordionTrigger>
                    <AccordionContent>
                      <AnswerKeyGrid
                        answers={answerKeys}
                        onAnswerChange={handleAnswerChange}
                        questionCount={questionCount}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
        )}

        {contentType === "typed_question" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                انتخاب سوالات آزمون
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedQuestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>سوالات انتخاب شده ({selectedQuestions.length})</Label>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedQuestions([])}>
                      حذف همه
                    </Button>
                  </div>
                  <ScrollArea className="h-24 rounded border p-2">
                    <div className="flex flex-wrap gap-2">
                      {selectedQuestions.map((question) => (
                        <Badge key={question.id} variant="secondary" className="flex items-center gap-2">
                          {question.public_id}
                          <button type="button" onClick={() => handleRemoveSelectedQuestion(question.id)} className="text-xs">
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </ScrollArea>
                  <Separator />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex w-full max-w-md items-center gap-2">
                    <Input
                      placeholder="جستجو بر اساس عنوان یا شناسه"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                    />
                    <Button variant="outline" size="icon" onClick={loadQuestions}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    <FilterX className="ml-2 h-4 w-4" />
                    حذف فیلترها
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>سطح دشواری</Label>
                    <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه</SelectItem>
                        <SelectItem value="easy">ساده</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="hard">دشوار</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>فیلتر پوشه</Label>
                    <Select
                      value={folderFilter ? folderFilter.toString() : "none"}
                      onValueChange={(value) => setFolderFilter(value === "none" ? null : Number(value))}
                      disabled={foldersLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="همه پوشه‌ها" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">همه پوشه‌ها</SelectItem>
                        {availableFolders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id.toString()}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>سوالات موجود</Label>
                <ScrollArea className="h-[420px] rounded border p-4">
                  {loadingQuestions ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                    </div>
                  ) : availableQuestions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">سوالی یافت نشد</p>
                  ) : (
                    <div className="space-y-3">
                      {availableQuestions.map((question) => (
                        <QuestionCard
                          key={question.id}
                          question={question}
                          showActions={false}
                          selectable
                          isSelected={questionIds.includes(question.id)}
                          onSelectionChange={(selected) => handleQuestionToggle(question, selected)}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/panel/tests")}>انصراف</Button>
          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => handleSubmit(true)}
            >
              <Plus className="ml-2 h-4 w-4" />
              ذخیره و ساخت آزمون دیگر
            </Button>
          )}
          <Button type="button" disabled={submitting} onClick={() => handleSubmit(false)}>
            <Save className="ml-2 h-4 w-4" />
            {isEditing ? "ذخیره تغییرات" : "ذخیره آزمون"}
          </Button>
        </div>
      </form>
    </div>
  );
}
