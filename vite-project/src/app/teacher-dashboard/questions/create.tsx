import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Plus, Minus, Eye, Upload } from "lucide-react";
import { FolderSelector } from "@/components/FolderSelector";
import { toast } from "sonner";

// Component for rendering images (handles both regular images and SVG)
const ImageRenderer: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isSvg, setIsSvg] = useState(false);

  React.useEffect(() => {
    // Check if the URL ends with .svg (ignoring query parameters)
    const urlWithoutParams = src.split('?')[0].toLowerCase();
    const isSvgFile = urlWithoutParams.endsWith('.svg');

    if (isSvgFile) {
      setIsSvg(true);
      // Fetch SVG content
      fetch(src)
        .then(response => response.text())
        .then(content => {
          // Basic validation that it's actually SVG
          if (content.includes('<svg')) {
            // Modify SVG to be theme-aware by adding CSS classes
            const modifiedContent = content
              // Add class to SVG element for theme styling
              .replace('<svg', '<svg class="theme-aware-svg"')
              // Replace black strokes with theme-aware colors
              .replace(/stroke="black"/g, 'stroke="currentColor"')
              .replace(/stroke="#000"/g, 'stroke="currentColor"')
              .replace(/stroke="#000000"/g, 'stroke="currentColor"')
              // Replace black fills with theme-aware colors
              .replace(/fill="black"/g, 'fill="currentColor"')
              .replace(/fill="#000"/g, 'fill="currentColor"')
              .replace(/fill="#000000"/g, 'fill="currentColor"')
              // Replace black colors in CSS styles
              .replace(/stroke:black/g, 'stroke:currentColor')
              .replace(/fill:black/g, 'fill:currentColor')
              .replace(/stroke:#000/g, 'stroke:currentColor')
              .replace(/stroke:#000000/g, 'stroke:currentColor')
              .replace(/fill:#000/g, 'fill:currentColor')
              .replace(/fill:#000000/g, 'fill:currentColor');

            setSvgContent(modifiedContent);
          } else {
            // Fallback to img tag if not valid SVG
            setIsSvg(false);
          }
        })
        .catch(() => {
          // Fallback to img tag on error
          setIsSvg(false);
        });
    } else {
      setIsSvg(false);
    }
  }, [src]);

  if (isSvg && svgContent) {
    return (
      <div
        className={`${className} flex items-center justify-center text-foreground`}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
    />
  );
};

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
        order: z.number().default(1),
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

export default function CreateQuestionPage() {
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionImages, setQuestionImages] = useState<File[]>([]);
  const [optionImages, setOptionImages] = useState<{ [key: number]: File }>({});
  const [detailedSolutionImages, setDetailedSolutionImages] = useState<File[]>([]);
  const [questionImagePreviews, setQuestionImagePreviews] = useState<string[]>([]);
  const [optionImagePreviews, setOptionImagePreviews] = useState<{ [key: number]: string }>({});
  const [detailedSolutionImagePreviews, setDetailedSolutionImagePreviews] = useState<string[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
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

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control,
    name: "images",
  });

  const handleManualSubmit = () => {
    const formData = getValues();
    console.log("Manual submit with form data:", formData);
    onSubmit(formData, false);
  };

  const handleCreateAndContinue = () => {
    const formData = getValues();
    onSubmit(formData, true);
  };

  const watchedQuestionText = watch("question_text");
  const watchedOptions = watch("options");
  const watchedDetailedSolution = watch("detailed_solution");
  const watchedCorrectOptionIndex = watch("correct_option_index");

  const onSubmit = async (
    data: QuestionFormData,
    resetForm: boolean = false
  ) => {
    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Raw form data:", data);
    console.log("selectedFolderIds:", selectedFolderIds);
    console.log("data.options:", data.options);

    if (selectedFolderIds.length === 0) {
      toast.error("حداقل یک پوشه را انتخاب کنید.");
      return;
    }

    // Validate that we have at least one non-empty option
    const nonEmptyOptions =
      data.options?.filter((option) => option.option_text?.trim()) || [];
    if (nonEmptyOptions.length === 0) {
      toast.error("حداقل یک گزینه وارد کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Filter out empty options and add order, clean up empty fields
      const filteredOptions = nonEmptyOptions.map((option, index) => {
        const cleanOption: any = {
          option_text: option.option_text,
          order: index + 1,
        };

        // Only include option_image if it's not empty
        if (option.option_image && option.option_image.trim()) {
          cleanOption.option_image = option.option_image;
        }

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
        images: data.images || [],
        detailed_solution_images: detailedSolutionImagePreviews.map((preview, index) => ({
          image: preview,
          alt_text: detailedSolutionImages[index]?.name || `تصویر پاسخ ${index + 1}`,
          order: index + 1
        })),
        ...(data.publish_date && { publish_date: data.publish_date }),
        ...(data.source && { source: data.source }),
      };

      console.log("Sending data to API:", formData);

      const response = await axiosInstance.post("/questions/", formData);
      console.log("سوال ایجاد شد:", response.data);

      if (resetForm) {
        toast.success("سوال ایجاد شد! پوشه‌ها برای سوال بعدی حفظ شدند.");
        // Reset form but keep folders
        setValue("question_text", "");
        setValue("detailed_solution", "");
        setValue("correct_option_index", undefined);
        setValue("options", [
          { option_text: "", order: 1 },
          { option_text: "", order: 2 },
          { option_text: "", order: 3 },
          { option_text: "", order: 4 },
        ]);
        setValue("images", []);
        setDetailedSolutionImages([]);
        setDetailedSolutionImagePreviews([]);
      } else {
        toast.success("سوال با موفقیت ایجاد شد!");
        // Reset everything including folders
        setValue("question_text", "");
        setValue("detailed_solution", "");
        setValue("correct_option_index", undefined);
        setValue("options", []);
        setValue("images", []);
        setSelectedFolderIds([]);
      }
    } catch (error) {
      console.error("خطا در ایجاد سوال:", error);
      toast.error("خطا در ایجاد سوال");
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

  const addImage = () => {
    appendImage({ image: "", alt_text: "", order: imageFields.length + 1 });
  };

  const removeLastImage = () => {
    if (imageFields.length > 0) {
      removeImage(imageFields.length - 1);
    }
  };

  const handleQuestionImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files);
      setQuestionImages(prev => [...prev, ...newImages]);
      
      // Create previews
      const newPreviews: string[] = [];
      newImages.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          newPreviews.push(base64);
          setQuestionImagePreviews(prev => [...prev, base64]);
          
          // Add to form data
          appendImage({
            image: base64,
            alt_text: file.name,
            order: imageFields.length + newPreviews.length
          });
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleOptionImageUpload = (optionIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOptionImages(prev => ({ ...prev, [optionIndex]: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setOptionImagePreviews(prev => ({ ...prev, [optionIndex]: base64 }));
        setValue(`options.${optionIndex}.option_image`, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetailedSolutionImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files);
      setDetailedSolutionImages(prev => [...prev, ...newImages]);
      
      // Create previews
      const newPreviews: string[] = [];
      newImages.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          newPreviews.push(base64);
          setDetailedSolutionImagePreviews(prev => [...prev, base64]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">ایجاد سوال جدید</h1>

      <form className="space-y-6">
        {/* Question Text */}
        <Card>
          <CardHeader>
            <CardTitle>متن سوال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="question_text">متن سوال</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('question-image-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 ml-1" />
                    آپلود تصویر
                  </Button>
                  <input
                    id="question-image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleQuestionImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
              <Textarea
                dir="auto"
                id="question_text"
                placeholder="متن سوال خود را وارد کنید..."
                {...register("question_text")}
                className="min-h-[100px] question-editor"
              />
              {errors.question_text && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.question_text.message}
                </p>
              )}
            </div>

            {watchedQuestionText && (
              <div>
                <Label>پیش‌نمایش:</Label>
                <div className="border rounded p-3 question-preview">
                  <MathPreview text={watchedQuestionText} />
                </div>
              </div>
            )}

            {questionImagePreviews.length > 0 && (
              <div>
                <Label>تصاویر سوال:</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {questionImagePreviews.map((preview, index) => (
                    <div key={index} className="border rounded p-2 relative">
                      <button
                        type="button"
                        onClick={() => {
                          setQuestionImagePreviews(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="حذف تصویر"
                      >
                        ×
                      </button>
                      <ImageRenderer
                        src={preview}
                        alt={`تصویر سوال ${index + 1}`}
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Folder Selection */}
        <Card>
          <CardHeader>
            <CardTitle>انتخاب مبحث</CardTitle>
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
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={removeLastOption}
                >
                  <Minus className="h-4 w-4 ml-1" />
                  حذف آخرین گزینه
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {optionFields.map((field, index) => (
              <div key={field.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor={`option_${index}`}>گزینه {index + 1}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(`option-image-upload-${index}`)?.click()}
                  >
                    <Upload className="h-4 w-4 ml-1" />
                    تصویر
                  </Button>
                  <input
                    id={`option-image-upload-${index}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleOptionImageUpload(index, e)}
                    className="hidden"
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    dir="auto"
                    id={`option_${index}`}
                    placeholder={`متن گزینه ${index + 1}`}
                    {...register(`options.${index}.option_text`)}
                    className="flex-1"
                  />
                </div>

                {watchedOptions?.[index]?.option_text && (
                  <div className="border rounded p-2">
                    <MathPreview
                      text={watchedOptions[index].option_text || ""}
                    />
                  </div>
                )}

                {optionImagePreviews[index] && (
                  <div className="border rounded p-2 relative">
                    <button
                      type="button"
                      onClick={() => {
                        setOptionImagePreviews(prev => {
                          const newPreviews = { ...prev };
                          delete newPreviews[index];
                          return newPreviews;
                        });
                        setValue(`options.${index}.option_image`, '');
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                      title="حذف تصویر"
                    >
                      ×
                    </button>
                    <Label className="text-sm text-gray-600">تصویر گزینه:</Label>
                    <ImageRenderer
                      src={optionImagePreviews[index]}
                      alt={`تصویر گزینه ${index + 1}`}
                      className="w-full h-32 object-cover rounded mt-1"
                    />
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
                  onValueChange={(value) =>
                    setValue(
                      "difficulty_level",
                      value as "easy" | "medium" | "hard"
                    )
                  }
                  defaultValue="medium"
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
            </div>            {watchedOptions && watchedOptions.length > 0 && (
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
                      (option, index) =>
                        option.option_text && (
                          <SelectItem key={index} value={index.toString()}>
                            گزینه {index + 1}:{" "}
                            <MathPreview text={option.option_text.substring(0, 50)} />
                          </SelectItem>
                        )
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="detailed_solution">پاسخ تشریحی (اختیاری)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('detailed-solution-image-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 ml-1" />
                    آپلود تصویر پاسخ
                  </Button>
                  <input
                    id="detailed-solution-image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleDetailedSolutionImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
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

              {detailedSolutionImagePreviews.length > 0 && (
                <div className="mt-4">
                  <Label>تصاویر پاسخ تشریحی:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {detailedSolutionImagePreviews.map((preview, index) => (
                      <div key={index} className="border rounded p-2 relative">
                        <button
                          type="button"
                          onClick={() => {
                            setDetailedSolutionImagePreviews(prev => prev.filter((_, i) => i !== index));
                            setDetailedSolutionImages(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="حذف تصویر"
                        >
                          ×
                        </button>
                        <ImageRenderer
                          src={preview}
                          alt={`تصویر پاسخ ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCreateAndContinue}
            disabled={isSubmitting}
          >
            {isSubmitting ? "در حال ایجاد..." : "ایجاد و ساخت یکی دیگر"}
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleManualSubmit}
          >
            {isSubmitting ? "در حال ایجاد..." : "ایجاد سوال"}
          </Button>
        </div>
      </form>
    </div>
  );
}
