import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useNavigate } from "react-router-dom";
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
import { Plus, Minus, Upload } from "lucide-react";
import { FolderSelector } from "@/components/FolderSelector";
import { toast } from "sonner";

// Component for rendering images (handles both regular images and SVG)
const ImageRenderer: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isSvg, setIsSvg] = useState(false);

  useEffect(() => {
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
  const navigate = useNavigate();
  const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionImages, setQuestionImages] = useState<File[]>([]);
  const [optionImages, setOptionImages] = useState<{ [key: number]: File }>({});
  const [detailedSolutionImages, setDetailedSolutionImages] = useState<File[]>([]);
  const [originalQuestionImages, setOriginalQuestionImages] = useState<Array<{id: number, image: string, alt_text: string, order: number}>>([]);
  const [questionImagePreviews, setQuestionImagePreviews] = useState<string[]>([]);
  const [optionImagePreviews, setOptionImagePreviews] = useState<{ [key: number]: string }>({});
  const [detailedSolutionImagePreviews, setDetailedSolutionImagePreviews] = useState<string[]>([]);
  const [originalDetailedSolutionImages, setOriginalDetailedSolutionImages] = useState<Array<{id: number, image: string, alt_text: string, order: number}>>([]);
  const [newQuestionImages, setNewQuestionImages] = useState<Array<{image: string, alt_text: string, order: number}>>([]);
  const [newDetailedSolutionImages, setNewDetailedSolutionImages] = useState<Array<{image: string, alt_text: string, order: number}>>([]);

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

  const handleUpdateAndNext = async () => {
    const formData = getValues();
    console.log("Update and next with form data:", formData);

    // First update the current question
    setIsSubmitting(true);
    try {
      await onSubmit(formData, false);

      // Then try to get the next question
      const urlParams = new URLSearchParams(window.location.search);
      const currentPage = parseInt(urlParams.get('page') || '1');
      const pageSize = parseInt(urlParams.get('page_size') || '20');

      // Build API URL with current filters to get next question
      const apiParams = new URLSearchParams();

      // Add filter parameters
      if (urlParams.get('search')) apiParams.append('search', urlParams.get('search')!);
      if (urlParams.get('difficulty')) apiParams.append('difficulty', urlParams.get('difficulty')!);
      if (urlParams.getAll('folders').length > 0) {
        urlParams.getAll('folders').forEach(folder => apiParams.append('folders', folder));
      }
      if (urlParams.get('is_active')) apiParams.append('is_active', urlParams.get('is_active')!);
      if (urlParams.get('source')) apiParams.append('source', urlParams.get('source')!);
      if (urlParams.get('has_solution')) apiParams.append('has_solution', urlParams.get('has_solution')!);
      if (urlParams.get('has_images')) apiParams.append('has_images', urlParams.get('has_images')!);
      if (urlParams.get('date_from')) apiParams.append('date_from', urlParams.get('date_from')!);
      if (urlParams.get('date_to')) apiParams.append('date_to', urlParams.get('date_to')!);
      if (urlParams.get('ordering')) apiParams.append('ordering', urlParams.get('ordering')!);

      // Get current page with larger page size to find current position
      apiParams.append('page', currentPage.toString());
      apiParams.append('page_size', pageSize.toString());

      const response = await axiosInstance.get(`/questions/?${apiParams.toString()}`);
      const questions: Array<{id: number}> = response.data.results;
      const currentIndex = questions.findIndex((q) => q.id.toString() === id);

      if (currentIndex !== -1 && currentIndex < questions.length - 1) {
        // Found next question on current page
        const nextQuestion = questions[currentIndex + 1];
        navigate(`/panel/questions/edit/${nextQuestion.id}?${urlParams.toString()}`);
      } else {
        // Need to check next page
        const nextPage = currentPage + 1;
        if (nextPage <= response.data.total_pages) {
          apiParams.set('page', nextPage.toString());
          const nextPageResponse = await axiosInstance.get(`/questions/?${apiParams.toString()}`);
          const nextPageQuestions: Array<{id: number}> = nextPageResponse.data.results;

          if (nextPageQuestions.length > 0) {
            const nextQuestion = nextPageQuestions[0];
            urlParams.set('page', nextPage.toString());
            navigate(`/panel/questions/edit/${nextQuestion.id}?${urlParams.toString()}`);
          } else {
            // No more questions
            toast.info("این آخرین سوال است");
            navigate(`/panel/questions?${urlParams.toString()}`);
          }
        } else {
          // No more questions
          toast.info("این آخرین سوال است");
          navigate(`/panel/questions?${urlParams.toString()}`);
        }
      }
    } catch (error) {
      console.error("Error updating and going to next:", error);
      toast.error("خطا در بروزرسانی و رفتن به سوال بعدی");
    } finally {
      setIsSubmitting(false);
    }
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
          
          // Load existing question images as previews
          if (data.images && data.images.length > 0) {
            const existingImagePreviews = data.images.map((img: { id: number; image: string; alt_text?: string; order: number }) => img.image);
            setQuestionImagePreviews(existingImagePreviews);
            setOriginalQuestionImages(data.images); // Store original images with IDs
          }
          
          // Load existing option images as previews
          const existingOptionPreviews: { [key: number]: string } = {};
          if (data.options && data.options.length > 0) {
            data.options.forEach((option: { id: number; option_text: string; order?: number; option_image?: string }, index: number) => {
              if (option.option_image) {
                existingOptionPreviews[index] = option.option_image;
                setValue(`options.${index}.option_image`, option.option_image);
              }
            });
            setOptionImagePreviews(existingOptionPreviews);
          }

          // Load existing detailed solution images as previews
          if (data.detailed_solution_images && data.detailed_solution_images.length > 0) {
            const existingDsImagePreviews = data.detailed_solution_images.map((img: { id: number; image: string; alt_text?: string; order: number }) => img.image);
            setDetailedSolutionImagePreviews(existingDsImagePreviews);
            setOriginalDetailedSolutionImages(data.detailed_solution_images); // Store original images with IDs
          }
          
          // Map options to shape used in form
          type ApiOption = { id: number; option_text: string; order?: number; option_image?: string };
          const mappedOptions = (data.options || []).map((o: ApiOption, idx: number) => ({
            option_text: o.option_text || '',
            order: o.order ?? (idx + 1),
            option_image: o.option_image || '',
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
  }, [id, reset, setValue]);

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
        keep_image_ids: originalQuestionImages
          .filter(origImg => questionImagePreviews.includes(origImg.image))
          .map(origImg => origImg.id),
        keep_detailed_solution_image_ids: originalDetailedSolutionImages
          .filter(origImg => detailedSolutionImagePreviews.includes(origImg.image))
          .map(origImg => origImg.id),
        images: newQuestionImages,
        detailed_solution_images: newDetailedSolutionImages,
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
          
          // Add to new images array
          setNewQuestionImages(prev => [...prev, {
            image: base64,
            alt_text: file.name,
            order: prev.length + 1
          }]);
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
          
          // Add to new images array
          setNewDetailedSolutionImages(prev => [...prev, {
            image: base64,
            alt_text: file.name,
            order: prev.length + 1
          }]);
        };
        reader.readAsDataURL(file);
      });
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
                            setNewDetailedSolutionImages(prev => prev.filter((_, i) => i !== index));
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
            disabled={isSubmitting}
            onClick={handleUpdateAndNext}
          >
            {isSubmitting ? "در حال بروزرسانی..." : "بروزرسانی و رفتن به سوال بعدی"}
          </Button>
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