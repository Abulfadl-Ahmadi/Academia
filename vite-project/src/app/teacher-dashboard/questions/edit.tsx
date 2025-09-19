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
import { Plus, Minus, Eye } from "lucide-react";
import { FolderSelector } from "@/components/FolderSelector";

const questionSchema = z.object({
  question_text: z.string().min(1, "متن سوال الزامی است"),
  difficulty_level: z.enum(["easy", "medium", "hard"]),
  detailed_solution: z.string().optional(),
  correct_option_index: z.number().optional(),
  options: z
    .array(
      z.object({
        option_text: z.string().optional(),
        order: z.number().optional(),
        option_image: z.string().optional(),
      })
    )
    .min(0),
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
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question_text: "",
      difficulty_level: "medium",
      detailed_solution: "",
      correct_option_index: undefined,
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

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control,
    name: "images",
  });

  const watchedQuestionText = watch("question_text");
  const watchedOptions = watch("options");
  const watchedDetailedSolution = watch("detailed_solution");

  useEffect(() => {
    if (id) {
      console.log("Loading question with ID:", id);
      console.log("Full API URL will be:", `/questions/${id}/`);

      axiosInstance
        .get(`/questions/${id}/`)
        .then((res) => {
          console.log("Question data loaded successfully:", res.data);
          const data = res.data;
          // Folders come as array of IDs
          setSelectedFolderIds(data.folders || []);
          // Map options to shape used in form
          type ApiOption = { id: number; option_text: string; order?: number };
          const mappedOptions = (data.options || []).map(
            (o: ApiOption, idx: number) => ({
              option_text: o.option_text || "",
              order: o.order ?? idx + 1,
            })
          );
          reset({
            question_text: data.question_text,
            difficulty_level: data.difficulty_level,
            detailed_solution: data.detailed_solution,
            correct_option_index: data.correct_option
              ? Math.max(
                  0,
                  (data.options || []).findIndex(
                    (o: ApiOption) => o.id === data.correct_option
                  )
                )
              : undefined,
            options:
              mappedOptions.length > 0
                ? mappedOptions
                : [
                    { option_text: "", order: 1 },
                    { option_text: "", order: 2 },
                    { option_text: "", order: 3 },
                    { option_text: "", order: 4 },
                  ],
            images: [],
          });
          setLoading(false);
        })
        .catch((err) => {
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

  const onSubmit = async (data: QuestionFormData) => {
    if (selectedFolderIds.length === 0) {
      alert("حداقل یک پوشه را انتخاب کنید.");
      return;
    }
    try {
      // Filter options to only non-empty texts and re-order
      const nonEmptyOptions = (data.options || []).filter((opt) =>
        (opt.option_text || "").trim()
      );
      const filteredOptions = nonEmptyOptions.map((opt, index) => ({
        option_text: opt.option_text || "",
        order: index + 1,
      }));

      const formData = {
        question_text: data.question_text,
        difficulty_level: data.difficulty_level,
        detailed_solution: data.detailed_solution,
        options: filteredOptions,
        folders: selectedFolderIds,
        correct_option_index: data.correct_option_index,
      };
      const response = await axiosInstance.put(`/questions/${id}/`, formData);
      console.log("سوال بروزرسانی شد:", response.data);
      // redirect or show success
    } catch (error) {
      console.error("خطا در بروزرسانی سوال:", error);
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

  const addImage = () => {
    appendImage({ image: "", alt_text: "", order: imageFields.length + 1 });
  };

  const removeLastImage = () => {
    if (imageFields.length > 0) {
      removeImage(imageFields.length - 1);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ویرایش سوال</h1>
        <Button onClick={() => setPreviewMode(!previewMode)}>
          <Eye className="ml-2 h-4 w-4" />
          {previewMode ? "ویرایش" : "پیش‌نمایش"}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* متن سوال */}
        <Card>
          <CardHeader>
            <CardTitle>متن سوال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="question_text">
                متن سوال (از $ برای ریاضی استفاده کنید)
              </Label>
              <Textarea
                dir="auto"
                id="question_text"
                {...register("question_text")}
                placeholder="متن سوال را وارد کنید. برای ریاضی از $formula$ استفاده کنید."
                rows={4}
                className="mt-1"
              />
              {errors.question_text && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.question_text.message}
                </p>
              )}
            </div>

            {/* Live Preview */}
            <div>
              <Label>پیش‌نمایش زنده:</Label>
              <div className="border rounded-md p-4 mt-1">
                <MathPreview text={watchedQuestionText || ""} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* گزینه‌ها */}
        <Card>
          <CardHeader>
            <CardTitle>گزینه‌ها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {optionFields.map((field, index) => (
              <div key={field.id} className="space-y-2">
                <Label>گزینه {index + 1}</Label>
                <Textarea
                  dir="auto"
                  {...register(`options.${index}.option_text`)}
                  placeholder="متن گزینه را وارد کنید"
                  rows={2}
                />
                <div className="border rounded-md p-2">
                  <MathPreview
                    text={watchedOptions?.[index]?.option_text || ""}
                  />
                </div>
                {/* آپلود تصویر برای گزینه */}
                <Input
                  type="file"
                  accept="image/*"
                  {...register(`options.${index}.option_image`)}
                />
              </div>
            ))}

            <div className="flex gap-2">
              <Button type="button" onClick={addOption} variant="outline">
                <Plus className="ml-2 h-4 w-4" />
                اضافه کردن گزینه
              </Button>
              {optionFields.length > 1 && (
                <Button
                  type="button"
                  onClick={removeLastOption}
                  variant="outline"
                >
                  <Minus className="ml-2 h-4 w-4" />
                  حذف گزینه آخر
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* تصاویر سوال */}
        <Card>
          <CardHeader>
            <CardTitle>تصاویر سوال (اختیاری)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {imageFields.map((field, index) => (
              <div key={field.id} className="space-y-2">
                <Label>تصویر {index + 1}</Label>
                <Input
                  type="file"
                  accept="image/*"
                  {...register(`images.${index}.image`)}
                />
                <Input
                  {...register(`images.${index}.alt_text`)}
                  placeholder="متن جایگزین (اختیاری)"
                />
              </div>
            ))}

            <div className="flex gap-2">
              <Button type="button" onClick={addImage} variant="outline">
                <Plus className="ml-2 h-4 w-4" />
                اضافه کردن تصویر
              </Button>
              {imageFields.length > 0 && (
                <Button
                  type="button"
                  onClick={removeLastImage}
                  variant="outline"
                >
                  <Minus className="ml-2 h-4 w-4" />
                  حذف تصویر آخر
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* تنظیمات */}
        <Card>
          <CardHeader>
            <CardTitle>تنظیمات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="difficulty_level">سطح دشواری</Label>
              <Select
                onValueChange={(value: "easy" | "medium" | "hard") =>
                  setValue("difficulty_level", value)
                }
                defaultValue={
                  getValues("difficulty_level") as
                    | "easy"
                    | "medium"
                    | "hard"
                    | undefined
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب سطح" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">ساده</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="hard">دشوار</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="folders">پوشه‌ها (مباحث)</Label>
              <FolderSelector
                selectedFolderIds={selectedFolderIds}
                onSelectionChange={setSelectedFolderIds}
                required
              />
            </div>

            <div>
              <Label htmlFor="detailed_solution">پاسخ تشریحی (اختیاری)</Label>
              <Textarea
                dir="auto"
                id="detailed_solution"
                {...register("detailed_solution")}
                placeholder="پاسخ تشریحی سوال"
                rows={3}
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

            {watchedOptions && watchedOptions.length > 0 && (
              <div>
                <Label htmlFor="correct_option_index">پاسخ صحیح</Label>
                <Select
                  onValueChange={(value) =>
                    setValue("correct_option_index", parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب پاسخ صحیح" />
                  </SelectTrigger>
                  <SelectContent>
                    {watchedOptions.map(
                      (opt, index) =>
                        (opt.option_text || "").trim() && (
                          <SelectItem key={index} value={index.toString()}>
                            گزینه {index + 1}:{" "}
                            {(opt.option_text || "").substring(0, 50)}
                          </SelectItem>
                        )
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* پیش‌نمایش نهایی */}
        {previewMode && (
          <Card>
            <CardHeader>
              <CardTitle>پیش‌نمایش نهایی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4">
                <MathPreview text={watchedQuestionText || ""} />
                {watchedOptions && watchedOptions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">گزینه‌ها:</h4>
                    <ol className="list-decimal list-inside space-y-1">
                      {watchedOptions.map((option, index) => (
                        <li key={index}>
                          <MathPreview text={option.option_text || ""} />
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit">بروزرسانی سوال</Button>
        </div>
      </form>
    </div>
  );
}
