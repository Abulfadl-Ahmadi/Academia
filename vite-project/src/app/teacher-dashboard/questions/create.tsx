import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MathPreview } from '@/components/MathPreview';
import { Plus, Minus, Eye, Upload } from 'lucide-react';
import { FolderSelector } from '@/components/FolderSelector';
import { toast } from 'sonner';

const questionSchema = z.object({
  question_text: z.string().min(1, 'متن سوال الزامی است'),
  difficulty_level: z.enum(['easy', 'medium', 'hard']),
  detailed_solution: z.string().optional(),
  correct_option_index: z.number().optional(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

export default function CreateQuestionPage() {
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add simple test function
  const testSubmit = () => {
    console.log('Testing simple submit');
    const testData = {
      question_text: 'تست سوال',
      difficulty_level: 'medium' as const,
      folders: [1]
    };
    console.log('Test data:', testData);
    
    axiosInstance.post('/questions/', testData)
      .then(response => {
        console.log('Test API success:', response.data);
        toast.success('تست موفق!');
      })
      .catch(error => {
        console.error('Test API error:', error);
        toast.error('تست ناموفق!');
      });
  };

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question_text: '',
      difficulty_level: 'medium',
      correct_option_index: undefined,
    },
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: 'options',
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: 'images',
  });

  const handleCreateAndContinue = handleSubmit(async (data) => {
    await onSubmit(data, true);
  });

  const watchedQuestionText = watch('question_text');
  const watchedOptions = watch('options');
  const watchedDetailedSolution = watch('detailed_solution');
  const watchedCorrectOptionIndex = watch('correct_option_index');

  const onSubmit = async (data: QuestionFormData, resetForm: boolean = false) => {
    console.log('onSubmit called with data:', data);
    console.log('selectedFolderIds:', selectedFolderIds);
    
    if (selectedFolderIds.length === 0) {
      toast.error('حداقل یک پوشه را انتخاب کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Filter out empty options
      const filteredOptions = data.options?.filter(option => option.option_text?.trim()) || [];
      
      const formData = {
        question_text: data.question_text,
        difficulty_level: data.difficulty_level,
        detailed_solution: data.detailed_solution,
        options: filteredOptions,
        folders: selectedFolderIds,
        correct_option_index: data.correct_option_index, // Send index to backend
      };

      console.log('Sending data to API:', formData);

      const response = await axiosInstance.post('/questions/', formData);
      console.log('سوال ایجاد شد:', response.data);

      if (resetForm) {
        toast.success('سوال ایجاد شد! پوشه‌ها برای سوال بعدی حفظ شدند.');
      } else {
        toast.success('سوال با موفقیت ایجاد شد!');
      }

      if (resetForm) {
        // Reset form for creating another question
        setValue('question_text', '');
        setValue('detailed_solution', '');
        setValue('difficulty_level', 'medium');
        setValue('correct_option_index', undefined);
        // Keep selectedFolderIds for next question (same topic)
        // setSelectedFolderIds([]); // Commented out to preserve folders
        // Reset options and images if needed
        if (optionFields.length > 0) {
          setValue('options', []);
        }
        if (imageFields.length > 0) {
          setValue('images', []);
        }
      }

    } catch (error) {
      console.error('خطا در ایجاد سوال:', error);

      // Show detailed error message
      const axiosError = error as { response?: { data?: unknown }; message?: string };
      if (axiosError.response?.data) {
        const errorData = axiosError.response.data;

        // Handle validation errors
        if (typeof errorData === 'object' && errorData !== null) {
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: ${String(messages)}`;
            })
            .join('\n');

          toast.error(`خطا در ایجاد سوال:\n${errorMessages}`);
        } else if (typeof errorData === 'string') {
          toast.error(`خطا: ${errorData}`);
        } else {
          toast.error(`خطا در ایجاد سوال: ${JSON.stringify(errorData)}`);
        }
      } else if (axiosError.message) {
        toast.error(`خطا در اتصال: ${axiosError.message}`);
      } else {
        toast.error('خطای نامشخص در ایجاد سوال. لطفا دوباره تلاش کنید.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addOption = () => {
    appendOption({ option_text: '', order: optionFields.length + 1 });
  };

  const removeLastOption = () => {
    if (optionFields.length > 0) {
      removeOption(optionFields.length - 1);
    }
  };

  const addImage = () => {
    appendImage({ image: '', alt_text: '', order: imageFields.length + 1 });
  };

  const removeLastImage = () => {
    if (imageFields.length > 0) {
      removeImage(imageFields.length - 1);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ایجاد سوال جدید</h1>
        <div className="flex gap-2">
          <Button onClick={testSubmit} variant="outline" type="button">
            تست API
          </Button>
          <Button onClick={() => {
            console.log('Current form errors:', errors);
            console.log('Selected folder IDs:', selectedFolderIds);
          }} variant="outline" type="button">
            چک کردن خطاها
          </Button>
          <Button onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="ml-2 h-4 w-4" />
            {previewMode ? 'ویرایش' : 'پیش‌نمایش'}
          </Button>
        </div>
      </div>

      <form onSubmit={(e) => {
        console.log('Raw form submit event triggered');
        e.preventDefault();
        handleSubmit((data) => {
          console.log('Form submit handler called:', data);
          return onSubmit(data, false);
        }, (errors) => {
          console.log('Form validation failed:', errors);
        })(e);
      }} className="space-y-6">
        {/* متن سوال */}
        <Card>
          <CardHeader>
            <CardTitle>متن سوال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="question_text">متن سوال (از $ برای ریاضی استفاده کنید)</Label>
              <Textarea
                id="question_text"
                {...register('question_text')}
                placeholder="متن سوال را وارد کنید. برای ریاضی از $formula$ استفاده کنید."
                rows={4}
                className="mt-1"
              />
              {errors.question_text && (
                <p className="text-red-500 text-sm mt-1">{errors.question_text.message}</p>
              )}
            </div>

            {/* Live Preview */}
            <div>
              <Label>پیش‌نمایش زنده:</Label>
              <div className="border rounded-md p-4 mt-1">
                <MathPreview text={watchedQuestionText || ''} />
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
              <div key={field.id} className="grid grid-cols-[auto_1fr_auto] lg:grid-cols-[auto_1fr_1fr_auto] gap-4 items-start">
                {/* شماره گزینه */}
                <div className="w-8 h-8 border rounded-md flex items-center justify-center text-sm font-medium mt-1">
                  {index + 1}
                </div>
                
                {/* متن گزینه */}
                <div className="lg:col-span-1">
                  <Textarea
                    {...register(`options.${index}.option_text`)}
                    placeholder="متن گزینه را وارد کنید"
                    rows={2}
                    className="w-full min-h-8"
                  />
                  
                  {/* پیش‌نمایش زنده - در موبایل زیر textarea */}
                  {watchedOptions?.[index]?.option_text && (
                    <div className="lg:hidden border rounded-md p-2 text-sm mt-2">
                      <MathPreview text={watchedOptions[index].option_text || ""} />
                    </div>
                   )} 
                </div>
                
                {/* پیش‌نمایش زنده - در دسکتاپ کنار textarea */}
                {watchedOptions?.[index]?.option_text && (
                  <div className="hidden lg:block border rounded-md p-2 text-sm">
                    <MathPreview text={watchedOptions[index].option_text} />
                  </div>
                )}
                
                {/* دکمه آپلود */}
                <div className="mt-1">
                  <label className="cursor-pointer" title="آپلود تصویر">
                    <input
                      type="file"
                      accept="image/*"
                      {...register(`options.${index}.option_image`)}
                      className="hidden"
                    />
                    <Button variant={"secondary"} className="w-8 h-8 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-blue-600" />
                    </Button>
                  </label>
                </div>
              </div>
            ))}

            <div className="flex gap-2 mt-6">
              <Button type="button" onClick={addOption} variant="outline">
                <Plus className="ml-2 h-4 w-4" />
                اضافه کردن گزینه
              </Button>
              {optionFields.length > 1 && (
                <Button type="button" onClick={removeLastOption} variant="outline">
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
                <Button type="button" onClick={removeLastImage} variant="outline">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="difficulty_level">سطح دشواری</Label>
                <Select onValueChange={(value: 'easy' | 'medium' | 'hard') => setValue('difficulty_level', value)}>
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

              {/* انتخاب پاسخ صحیح */}
              {optionFields && optionFields.length > 0 && (
                <div>
                  <Label htmlFor="correct_option_index">پاسخ صحیح (اختیاری)</Label>
                  <Select 
                    onValueChange={(value) => setValue('correct_option_index', value === 'none' ? undefined : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="پاسخ صحیح را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون پاسخ صحیح</SelectItem>
                      {optionFields.map((_, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          گزینه {['۱', '۲', '۳', '۴', '۵', '۶'][index] || (index + 1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="folders">پوشه‌ها (مباحث)</Label>
              <FolderSelector
                selectedFolderIds={selectedFolderIds}
                onSelectionChange={setSelectedFolderIds}
                required={true}
              />
            </div>

            <div>
              <Label htmlFor="detailed_solution">پاسخ تشریحی (اختیاری)</Label>
              <Textarea
                id="detailed_solution"
                {...register('detailed_solution')}
                placeholder="پاسخ تشریحی سوال"
                rows={3}
              />
              {/* پیش‌نمایش زنده پاسخ تشریحی */}
              {watchedDetailedSolution && (
                <div className="mt-2">
                  <Label className="text-sm text-gray-600">پیش‌نمایش پاسخ تشریحی:</Label>
                  <div className="border rounded-md p-3">
                    <MathPreview text={watchedDetailedSolution} />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* پیش‌نمایش نهایی */}
        {previewMode && (
          <Card>
            <CardHeader>
              <CardTitle>پیش‌نمایش نهایی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-3">متن سوال:</h3>
                  <div className="border rounded-lg p-4">
                    <MathPreview text={watchedQuestionText || ''} />
                  </div>
                </div>
                {watchedOptions && watchedOptions.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-4 text-lg">گزینه‌ها:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {watchedOptions.map((option, index) => (
                        <div 
                          key={index} 
                          className={`flex items-start gap-3 p-4 border rounded-lg hover:shadow-md transition-shadow ${
                            watchedCorrectOptionIndex === index ? 'border-green-500 border-2' : ''
                          }`}
                        >
                          <div className="flex-shrink-0 font-medium text-lg">
                            {['۱)', '۲)', '۳)', '۴)', '۵)', '۶)'][index] || `${index + 1})`}
                            {watchedCorrectOptionIndex === index && (
                              <span className="text-green-600 mr-1">✓</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 break-words">
                            <MathPreview text={option.option_text || `گزینه ${index + 1}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {watchedDetailedSolution && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-4 text-lg">پاسخ تشریحی:</h4>
                    <div className="border rounded-lg p-4">
                      <MathPreview text={watchedDetailedSolution} />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCreateAndContinue}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'در حال ایجاد...' : 'ایجاد و ساخت یکی دیگر'}
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => {
              e.preventDefault();
              console.log('Manual submit button clicked');
              handleSubmit((data) => {
                console.log('Manual form submit handler called:', data);
                return onSubmit(data, false);
              }, (errors) => {
                console.log('Manual form validation failed:', errors);
              })();
            }}
          >
            {isSubmitting ? 'در حال ایجاد...' : 'ایجاد سوال'}
          </Button>
        </div>
      </form>
    </div>
  );
}