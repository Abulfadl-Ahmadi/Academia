"use client";
import { useEffect, useState } from 'react';
import { blogApi, type BlogTag, type BlogCategory } from '@/api/blog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export default function TeacherBlogCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft'|'published'>('draft');
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([blogApi.listTags(), blogApi.listCategories()]).then(([t, c])=>{
      // Handle potential array or pagination format
      const tagsData = Array.isArray(t.data) ? t.data : (t.data?.results || []);
      const catsData = Array.isArray(c.data) ? c.data : (c.data?.results || []);
      setTags(tagsData); 
      setCategories(catsData);
    }).catch(err => {
      console.error('Error loading tags/categories:', err);
      setTags([]);
      setCategories([]);
    });
  }, []);

  const toggle = (arr:number[], id:number) => arr.includes(id) ? arr.filter(x=>x!==id) : [...arr, id];

  const submit = async () => {
    setSubmitting(true);
    try {
      await blogApi.createPost({ title, excerpt, content, status, tag_ids: tagIds, category_ids: categoryIds });
        navigate('/panel/blog');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ایجاد نوشته</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>اطلاعات نوشته</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm">عنوان</label>
            <Input value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">خلاصه</label>
            <Textarea rows={3} value={excerpt} onChange={e=>setExcerpt(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">محتوا</label>
            <Textarea rows={12} value={content} onChange={e=>setContent(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <label className="text-sm block w-full">برچسب‌ها</label>
            {Array.isArray(tags) && tags.map(t => (
              <Badge key={t.id} onClick={()=>setTagIds(prev=>toggle(prev, t.id))} className={`cursor-pointer ${tagIds.includes(t.id)?'bg-primary text-primary-foreground':''}`} variant={tagIds.includes(t.id)?'default':'outline'}>{t.name}</Badge>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <label className="text-sm block w-full">دسته‌بندی‌ها</label>
            {Array.isArray(categories) && categories.map(c => (
              <Badge key={c.id} onClick={()=>setCategoryIds(prev=>toggle(prev, c.id))} className={`cursor-pointer ${categoryIds.includes(c.id)?'bg-primary text-primary-foreground':''}`} variant={categoryIds.includes(c.id)?'default':'outline'}>{c.title}</Badge>
            ))}
          </div>
          <div className="flex gap-3">
            <Button disabled={submitting} onClick={submit}>ذخیره</Button>
            <Button variant="outline" onClick={()=>navigate(-1)}>بازگشت</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
