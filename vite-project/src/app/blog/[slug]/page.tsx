"use client";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { blogApi, type BlogPostDetail } from '@/api/blog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Tag, ArrowLeft, BookOpen } from 'lucide-react';

export default function PublicBlogDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const res = await blogApi.getPost(slug as string);
        setPost(res.data);
      } catch (err: unknown) {
        const errorResponse = err as { response?: { status?: number } };
        if (errorResponse.response?.status === 404) {
          setError('مقاله یافت نشد');
        } else if (errorResponse.response?.status === 403) {
          setError('این مقاله هنوز منتشر نشده است');
        } else {
          setError('خطا در بارگذاری مقاله');
        }
        console.error('Error loading post:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">در حال بارگذاری...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground mb-4">{error || 'مقاله یافت نشد'}</h1>
          <Button onClick={() => navigate('/blog')} variant="outline">
            <ArrowLeft className="w-4 h-4 ml-2" />
            بازگشت به فهرست مقالات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            onClick={() => navigate('/blog')} 
            variant="ghost" 
            className="hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            بازگشت به فهرست مقالات
          </Button>
        </div>

        {/* Article */}
        <article className="max-w-4xl mx-auto">
          {/* Cover Image */}
          {post.cover_image && (
            <div className="aspect-video mb-8 rounded-lg overflow-hidden">
              <img 
                src={post.cover_image} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Header */}
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
              {post.title}
            </h1>
            
            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {post.excerpt}
              </p>
            )}
            
            {/* Meta Info */}
            <div className="flex items-center justify-center gap-6 text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="font-medium">{post.author.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{new Date(post.published_at || post.created_at).toLocaleDateString('fa-IR')}</span>
              </div>
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap justify-center gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag.slug} variant="outline">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag.name}
                </Badge>
              ))}
            </div>
          </header>

          {/* Article Content */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div 
                className="prose prose-lg max-w-none text-foreground leading-relaxed rtl-content"
                dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br>') }}
              />
            </CardContent>
          </Card>

          {/* Categories */}
          {post.categories.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">دسته‌بندی‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {post.categories.map((cat) => (
                    <Badge key={cat.slug} variant="secondary">
                      {cat.title}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Images */}
          {post.images && post.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تصاویر مرتبط</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {post.images.map((img) => (
                    <div key={img.id} className="aspect-video rounded-lg overflow-hidden">
                      <img 
                        src={img.image_url} 
                        alt={img.alt_text || post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </article>
      </div>
    </div>
  );
}