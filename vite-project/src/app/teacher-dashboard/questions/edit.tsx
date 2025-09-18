import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MathPreview } from '@/components/MathPreview';
import { Plus, Minus, Eye, ChevronRight, ChevronDown, Folder as FolderIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { knowledgeApi } from '@/features/knowledge/api';
import type { Folder } from '@/features/knowledge/types';

// توسعه نوع Folder برای داشتن children اختیاری بدون استفاده از any
interface FolderWithChildren extends Folder { children?: FolderWithChildren[] }
const hasChildren = (f: Folder | FolderWithChildren): f is FolderWithChildren => Array.isArray((f as FolderWithChildren).children);

const questionSchema = z.object({
  question_text: z.string().min(1, 'متن سوال الزامی است'),
  folders: z.array(z.number()).min(1, 'انتخاب حداقل یک پوشه الزامی است'),
  difficulty_level: z.enum(['easy', 'medium', 'hard']),
  detailed_solution: z.string().optional(),
  options: z.array(z.object({
    option_text: z.string().min(1, 'متن گزینه الزامی است'),
    order: z.number(),
    option_image: z.string().optional(),
  })).min(0),
  images: z.array(z.object({
    image: z.string(),
    alt_text: z.string().optional(),
    order: z.number(),
  })).optional(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

export default function EditQuestionPage() {
  const { id } = useParams<{ id: string }>();
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [folderTree, setFolderTree] = useState<Folder[]>([]);
  const [folderLoading, setFolderLoading] = useState<boolean>(false);
  const [selectedFolderIds, setSelectedFolderIds] = useState<number[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: 'options',
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: 'images',
  });

  const watchedQuestionText = watch('question_text');
  const watchedOptions = watch('options');

  const toggleExpand = useCallback((folderId: number) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  const renderFolders = (nodes: (Folder | FolderWithChildren)[], depth: number = 0) => (
    <ul className="space-y-1">
      {nodes.map(node => {
        const children = hasChildren(node) ? node.children : undefined;
        const childExists = !!children && children.length > 0;
        const expanded = childExists && expandedFolders.has(node.id);
        const checked = selectedFolderIds.includes(node.id);
        return (
          <li key={node.id}>
            <div className="flex items-center gap-2">
              {childExists ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(node.id)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted transition"
                  aria-label={expanded ? 'Collapse' : 'Expand'}
                >
                  {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <span className="w-5 h-5 inline-block" />
              )}
              <Checkbox
                checked={checked}
                onCheckedChange={(val) => {
                  setSelectedFolderIds(prev => val ? [...prev, node.id] : prev.filter(id => id !== node.id));
                }}
              />
              <FolderIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium truncate max-w-[200px]" title={node.name}>{node.name}</span>
              <span className="text-xs text-muted-foreground">#{node.id}</span>
            </div>
            {childExists && expanded && (
              <div className="ms-6 border-s ps-3 mt-1">
                {children && renderFolders(children, depth + 1)}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  useEffect(() => {
    const loadFolders = async () => {
      setFolderLoading(true);
      try {
        const tree = await knowledgeApi.getFolderTree();
        setFolderTree(tree);
      } catch (error) {
        console.error('خطا در بارگذاری پوشه‌ها:', error);
      } finally {
        setFolderLoading(false);
      }
    };
    loadFolders();
  }, []);

  useEffect(() => {
    if (id) {
      console.log('Loading question with ID:', id);
      console.log('Full API URL will be:', `/questions/${id}/`);
      
      // Test API connectivity first
      axiosInstance.get('/questions/')
        .then(listRes => {
          console.log('Questions list API works:', listRes.status);
          console.log('Available questions:', listRes.data.results?.map(q => q.id));
          
          // Now try to get specific question
          return axiosInstance.get(`/questions/${id}/`);
        })
        .then(res => {
          console.log('Question data loaded successfully:', res.data);
          const data = res.data;
          setSelectedFolderIds(data.folders || []);
          reset({
            question_text: data.question_text,
            folders: data.folders,
            difficulty_level: data.difficulty_level,
            detailed_solution: data.detailed_solution,
            options: data.options || [],
            images: data.images || [],
          });
          setLoading(false);
        })
        .catch(err => {
          console.error('خطا در بارگذاری سوال:', err);
          console.error('Error details:', err.response?.data);
          console.error('Error status:', err.response?.status);
          
          if (err.response?.status === 404) {
            setError(`سوال با شناسه ${id} یافت نشد.`);
          } else {
            setError('خطا در بارگذاری اطلاعات سوال');
          }
          setLoading(false);
        });
    }
  }, [id, reset]);

  const onSubmit = async (data: QuestionFormData) => {
    if (selectedFolderIds.length === 0) {
      alert('حداقل یک پوشه را انتخاب کنید.');
      return;
    }
    try {
      const formData = {
        ...data,
        folders: selectedFolderIds,
      };
      const response = await axiosInstance.put(`/tests/questions/${id}/`, formData);
      console.log('سوال بروزرسانی شد:', response.data);
      // redirect or show success
    } catch (error) {
      console.error('خطا در بروزرسانی سوال:', error);
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
          {previewMode ? 'ویرایش' : 'پیش‌نمایش'}
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
              <div className="border rounded-md p-4 mt-1 bg-gray-50">
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
              <div key={field.id} className="space-y-2">
                <Label>گزینه {index + 1}</Label>
                <Textarea
                  {...register(`options.${index}.option_text`)}
                  placeholder="متن گزینه را وارد کنید"
                  rows={2}
                />
                <div className="border rounded-md p-2 bg-gray-50">
                  <MathPreview text={watchedOptions?.[index]?.option_text || ''} />
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
            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <Label htmlFor="points">امتیاز</Label>
                <Input
                  id="points"
                  type="number"
                  {...register('points', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="folders">پوشه‌ها (مباحث)</Label>
              <div className="text-xs text-muted-foreground">پوشه‌ها جایگزین ساختار قدیمی (کتاب، فصل، ... ) شده‌اند. حداقل یک پوشه را انتخاب کنید.</div>
              <div className="max-h-96 overflow-auto pr-2 border rounded p-3 mt-2">
                {folderLoading && <p className="text-sm">در حال بارگذاری...</p>}
                {!folderLoading && folderTree.length === 0 && <p className="text-sm text-muted-foreground">هیچ پوشه‌ای ایجاد نشده است.</p>}
                {!folderLoading && folderTree.length > 0 && renderFolders(folderTree)}
              </div>
              {selectedFolderIds.length > 0 && (
                <div className="text-xs text-green-600 mt-2">{selectedFolderIds.length} پوشه انتخاب شد</div>
              )}
            </div>

            <div>
              <Label htmlFor="detailed_solution">پاسخ تشریحی (اختیاری)</Label>
              <Textarea
                id="detailed_solution"
                {...register('detailed_solution')}
                placeholder="پاسخ تشریحی سوال"
                rows={3}
              />
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
              <div className="border rounded-md p-4 bg-white">
                <MathPreview text={watchedQuestionText || ''} />
                {watchedOptions && watchedOptions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">گزینه‌ها:</h4>
                    <ol className="list-decimal list-inside space-y-1">
                      {watchedOptions.map((option, index) => (
                        <li key={index}>
                          <MathPreview text={option.option_text || ''} />
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