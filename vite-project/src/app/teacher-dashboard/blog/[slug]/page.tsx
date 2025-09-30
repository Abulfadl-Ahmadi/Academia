"use client";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { blogApi, type BlogPostDetail } from '@/api/blog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function TeacherBlogDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await blogApi.getPost(slug);
        setPost(res.data);
      } finally { setLoading(false); }
    };
    if (slug) load();
  }, [slug]);

  if (loading) return <div>در حال بارگذاری…</div>;
  if (!post) return <div>یافت نشد</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{post.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>navigate(`/panel/blog/${post.slug}/edit`)}>ویرایش</Button>
          <Button variant="outline" onClick={()=>navigate('/panel/blog')}>بازگشت</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>مشخصات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {post.tags.map(t => <Badge key={t.slug} variant="outline">{t.name}</Badge>)}
          </div>
          <div className="prose prose-sm max-w-none" dir="rtl">
            {post.content}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
