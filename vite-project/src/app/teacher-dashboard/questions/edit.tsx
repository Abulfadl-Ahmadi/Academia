import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MathPreview } from "@/components/MathPreview";
import { Plus, Minus } from "lucide-react";
import { FolderSelector } from "@/components/FolderSelector";
import { toast } from "sonner";

const questionSchema = z.object({
  question_text: z.string().min(1, "متن سوال الزامی است"),
  difficulty_level: z.enum(["easy", "medium", "hard"]),
  detailed_solution: z.string().optional(),
  correct_option_index: z.number().optional(),
  publish_date: z.string().optional(),
  source: z.string().optional(),
  options: z
    .array(
      z.object({
        option_text: z.string(),
        order: z.number().optional(),
        option_image: z.string().optional(),
      })
    )
    .optional(),
  images: z
    .array(
      z.object({
        image: z.string(),
        alt_text: z.string().optional(),
        order: z.number(),
      })
    )
    .optional(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

export default function EditQuestionPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question_text: "",
      difficulty_level: "medium",
      correct_option_index: undefined,
      detailed_solution: "",
      options: [
        { option_text: "", order: 1 },
        { option_text: "", order: 2 },
        { option_text: "", order: 3 },
        { option_text: "", order: 4 },
      ],
      images: [],
    },
  });

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: "options",
  });

  const handleManualSubmit = () => {
    const formData = getValues();
    console.log("Manual submit with form data:", formData);
    onSubmit(formData, false);
  };

  const handleUpdateAndContinue = () => {
    const formData = getValues();
    onSubmit(formData, true);
  };

  const watchedQuestionText = watch("question_text");
  const watchedOptions = watch("options");
  const watchedDetailedSolution = watch("detailed_solution");

  // Load question data
  useEffect(() => {
    if (id) {
      console.log("Loading question with ID:", id);
      
      axiosInstance.get(`/questions/${id}/`)
        .then(res => {
          console.log("Question data loaded successfully:", res.data);
          const data = res.data;
          
          // Set folders
          setSelectedFolderIds(data.folders || []);
          
          // Map options to shape used in form
          type ApiOption = { id: number; option_text: string; order?: number };
          const mappedOptions = (data.options || []).map((o: ApiOption, idx: number) => ({
            option_text: o.option_text || '',
            order: o.order ?? (idx + 1),
          }));
          
          reset({
            question_text: data.question_text,
            difficulty_level: data.difficulty_level,
            detailed_solution: data.detailed_solution,
            publish_date: data.publish_date,
            source: data.source,
            correct_option_index: data.correct_option ? Math.max(0, (data.options || []).findIndex((o: ApiOption) => o.id === data.correct_option)) : undefined,
            options: mappedOptions.length > 0 ? mappedOptions : [
              { option_text: "", order: 1 },
              { option_text: "", order: 2 },
              { option_text: "", order: 3 },
              { option_text: "", order: 4 },
            ],
            images: [],
          });
          setLoading(false);
        })
        .catch(err => {
          console.error("خطا در بارگذاری سوال:", err);
          console.error("Error details:", err.response?.data);
          console.error("Error status:", err.response?.status);
          
          if (err.response?.status === 404) {
            setError(`سوال با شناسه ${id} یافت نشد.`);
          } else {
            setError("خطا در بارگذاری اطلاعات سوال");
          }
          setLoading(false);
        });
    }
  }, [id, reset]);

  const onSubmit = async (data: QuestionFormData, resetForm: boolean = false) => {
    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Raw form data:", data);
    console.log("selectedFolderIds:", selectedFolderIds);
    console.log("data.options:", data.options);
    
    if (selectedFolderIds.length === 0) {
      toast.error("حداقل یک پوشه را انتخاب کنید.");
      return;
    }

    // Validate that we have at least one non-empty option
    const nonEmptyOptions = data.options?.filter(option => option.option_text?.trim()) || [];
    if (nonEmptyOptions.length === 0) {
      toast.error("حداقل یک گزینه وارد کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Filter out empty options and add order, clean up empty fields
      const filteredOptions = nonEmptyOptions.map((option, index) => {
        const cleanOption = {
          option_text: option.option_text,
          order: index + 1,
          ...(option.option_image && option.option_image.trim() && { option_image: option.option_image })
        };
        
        return cleanOption;
      });
      
      console.log("Filtered options with order:", filteredOptions);
      
      const formData = {
        question_text: data.question_text,
        difficulty_level: data.difficulty_level,
        detailed_solution: data.detailed_solution,
        options: filteredOptions,
        folders: selectedFolderIds,
        correct_option_index: data.correct_option_index,
        ...(data.publish_date && { publish_date: data.publish_date }),
        ...(data.source && { source: data.source }),
      };

      console.log("Sending data to API:", formData);

      const response = await axiosInstance.put(`/questions/${id}/`, formData);
      console.log("سوال بروزرسانی شد:", response.data);

      if (resetForm) {
        toast.success("سوال بروزرسانی شد! آماده برای ویرایش بعدی.");
        // Keep current data loaded for continued editing
      } else {
        toast.success("سوال با موفقیت بروزرسانی شد!");
        // Could redirect back to questions list here
      }
    } catch (error) {
      console.error("خطا در بروزرسانی سوال:", error);
      toast.error("خطا در بروزرسانی سوال");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addOption = () => {
    appendOption({ option_text: "", order: optionFields.length + 1 });
  };

  const removeLastOption = () => {
    if (optionFields.length > 0) {
      removeOption(optionFields.length - 1);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">در حال بارگذاری...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">خطا</h2>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">ویرایش سوال</h1>
      
      <form className="space-y-6">
        {/* Question Text */}
        <Card>
          <CardHeader>
            <CardTitle>متن سوال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="question_text">متن سوال</Label>
              <Textarea
                dir="auto"
                id="question_text"
                placeholder="متن سوال خود را وارد کنید..."
                {...register("question_text")}
                className="min-h-[100px]"
              />
              {errors.question_text && (
                <p className="text-red-500 text-sm mt-1">{errors.question_text.message}</p>
              )}
            </div>

            {watchedQuestionText && (
              <div>
                <Label>پیش‌نمایش:</Label>
                <div className="border rounded p-3">
                  <MathPreview text={watchedQuestionText} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Folder Selection */}
        <Card>
          <CardHeader>
            <CardTitle>انتخاب پوشه</CardTitle>
          </CardHeader>
          <CardContent>
            <FolderSelector
              selectedFolderIds={selectedFolderIds}
              onSelectionChange={setSelectedFolderIds}
            />
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              گزینه‌ها
              <div className="space-x-2">
                <Button type="button" size="sm" onClick={addOption}>
                  <Plus className="h-4 w-4 ml-1" />
                  افزودن گزینه
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={removeLastOption}>
                  <Minus className="h-4 w-4 ml-1" />
                  حذف آخرین گزینه
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {optionFields.map((field, index) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={`option_${index}`}>گزینه {index + 1}</Label>
                <div className="flex gap-2">
                  <Input
                    id={`option_${index}`}
                    placeholder={`متن گزینه ${index + 1}`}
                    {...register(`options.${index}.option_text`)}
                    className="flex-1"
                  />
                </div>
                
                {watchedOptions?.[index]?.option_text && (
                  <div className="border rounded p-2">
                    <MathPreview text={watchedOptions[index].option_text || ""} />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>تنظیمات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="difficulty_level">سطح دشواری</Label>
                <Select 
                  onValueChange={(value) => setValue("difficulty_level", value as "easy" | "medium" | "hard")}
                  defaultValue={getValues("difficulty_level")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب سطح دشواری" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">ساده</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="hard">دشوار</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="publish_date">تاریخ انتشار (اختیاری)</Label>
                <Input
                  dir="ltr"
                  id="publish_date"
                  type="number"
                  placeholder="1403"
                  min="1300"
                  max="1500"
                  {...register("publish_date")}
                />
              </div>

              <div>
                <Label htmlFor="source">منبع (اختیاری)</Label>
                <Input
                  dir="auto"
                  id="source"
                  placeholder="منبع سوال را وارد کنید"
                  {...register("source")}
                />
              </div>

              {watchedOptions && watchedOptions.length > 0 && (
                <div>
                  <Label htmlFor="correct_option_index">پاسخ صحیح</Label>
                  <Select 
                    value={watch("correct_option_index")?.toString() || ""}
                    onValueChange={(value) => setValue("correct_option_index", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب پاسخ صحیح" />
                    </SelectTrigger>
                    <SelectContent>
                      {watchedOptions.map((option, index) => (
                        option.option_text && (
                          <SelectItem key={index} value={index.toString()}>
                            گزینه {index + 1}: <MathPreview text={option.option_text.substring(0, 50)} />
                          </SelectItem>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="detailed_solution">پاسخ تشریحی (اختیاری)</Label>
              <Textarea
                dir="auto"
                id="detailed_solution"
                placeholder="پاسخ تشریحی سوال..."
                {...register("detailed_solution")}
                className="min-h-[100px]"
              />
              
              {watchedDetailedSolution && (
                <div className="mt-2">
                  <Label>پیش‌نمایش پاسخ تشریحی:</Label>
                  <div className="border rounded p-3">
                    <MathPreview text={watchedDetailedSolution} />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          {/* <Button
            type="button"
            variant="outline"
            onClick={handleUpdateAndContinue}
            disabled={isSubmitting}
          >
            {isSubmitting ? "در حال بروزرسانی..." : "بروزرسانی و ادامه ویرایش"}
          </Button> */}
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleManualSubmit}
          >
            {isSubmitting ? "در حال بروزرسانی..." : "بروزرسانی سوال"}
          </Button>
        </div>
      </form>
    </div>
  );
}