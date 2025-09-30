"use client";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { blogApi, type BlogPostDetail, type BlogTag, type BlogCategory } from '@/api/blog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function TeacherBlogEditPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [postRes, tagsRes, catsRes] = await Promise.all([
          blogApi.getPost(slug as string),
          blogApi.listTags(),
          blogApi.listCategories(),
        ]);
        const p = postRes.data;
        setPost(p);
        setTitle(p.title);
        setExcerpt(p.excerpt);
        setContent(p.content);
        setTagIds(p.tags.map(t=>t.id));
        setCategoryIds(p.categories.map(c=>c.id));
        
        // Handle potential array or pagination format for tags/categories
        const tagsData = Array.isArray(tagsRes.data) ? tagsRes.data : (tagsRes.data?.results || []);
        const catsData = Array.isArray(catsRes.data) ? catsRes.data : (catsRes.data?.results || []);
        setTags(tagsData);
        setCategories(catsData);
      } finally { setLoading(false); }
    };
    if (slug) load();
  }, [slug]);

  const toggle = (arr:number[], id:number) => arr.includes(id) ? arr.filter(x=>x!==id) : [...arr, id];

  const save = async () => {
    setSaving(true);
    try {
      await blogApi.updatePost(slug as string, { title, excerpt, content, tag_ids: tagIds, category_ids: categoryIds });
      navigate(`/panel/blog/${slug}`);
    } finally { setSaving(false); }
  };

  if (loading) return <div>در حال بارگذاری…</div>;
  if (!post) return <div>یافت نشد</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ویرایش: {post.title}</h1>
        <Button variant="outline" onClick={()=>navigate(`/panel/blog/${slug}`)}>بازگشت</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>ویرایش نوشته</CardTitle></CardHeader>
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
              <Button disabled={saving} onClick={save}>ذخیره</Button>
              <Button variant="outline" onClick={()=>navigate(-1)}>انصراف</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
