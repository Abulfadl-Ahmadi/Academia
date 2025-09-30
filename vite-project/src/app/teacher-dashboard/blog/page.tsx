"use client";
import { useEffect, useState } from 'react';
import { blogApi, type BlogPostList } from '@/api/blog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';

export default function TeacherBlogListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<BlogPostList[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await blogApi.listPosts(q ? { search: q } : undefined);
        setItems(res.data.results || []);
      } finally { setLoading(false); }
    };
    load();
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت وبلاگ</h1>
          <Button onClick={() => navigate('/panel/blog/create')}>ایجاد نوشته</Button>
      </div>

      <div className="flex gap-2">
        <Input placeholder="جستجو در عنوان/برچسب/دسته" value={q} onChange={(e)=>setQ(e.target.value)} />
      </div>

      {loading ? (
        <div>در حال بارگذاری…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">موردی یافت نشد.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map(p => (
            <Card key={p.id} className="hover:shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg cursor-pointer" onClick={()=>navigate(`/panel/blog/${p.slug}`)}>{p.title}</CardTitle>
                  <Badge variant={p.status === 'published' ? 'default' : 'secondary'}>
                    {p.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">توسط {p.author.username}</div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {p.tags.map(t => <Badge variant="outline" key={t.slug}>{t.name}</Badge>)}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={()=>navigate(`/panel/blog/${p.slug}`)}>مشاهده</Button>
                  <Button size="sm" variant="outline" onClick={()=>navigate(`/panel/blog/${p.slug}/edit`)}>ویرایش</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
