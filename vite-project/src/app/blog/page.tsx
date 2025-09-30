"use client";
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { blogApi, type BlogPostList, type BlogCategory } from '@/api/blog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, Search, BookOpen } from 'lucide-react';

export default function PublicBlogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPostList[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filterPosts = async () => {
      try {
        const params: Record<string, string> = {};
        if (searchTerm) params.search = searchTerm;
        if (selectedCategory && selectedCategory !== 'all') params.categories = selectedCategory;
        
        const res = await blogApi.listPosts(params);
        setPosts(res.data.results || []);
      } catch (error) {
        console.error('Error filtering posts:', error);
      }
    };

    // Update URL when filters change
    const newParams = new URLSearchParams();
    if (searchTerm) newParams.set('search', searchTerm);
    if (selectedCategory && selectedCategory !== 'all') newParams.set('category', selectedCategory);
    setSearchParams(newParams);
    
    // Filter posts
    filterPosts();
  }, [searchTerm, selectedCategory, setSearchParams]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsRes, categoriesRes] = await Promise.all([
        blogApi.listPosts(),
        blogApi.listCategories()
      ]);
      setPosts(postsRes.data.results || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error loading blog data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">در حال بارگذاری...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            <BookOpen className="inline-block w-10 h-10 mr-2 text-primary" />
            وبلاگ آریان تفضلی‌زاده
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            مقالات آموزشی، تجربیات و دانش‌های تخصصی در حوزه آموزش
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="جستجو در مقالات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="md:w-48">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="همه دسته‌ها" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه دسته‌ها</SelectItem>
                      {Array.isArray(categories) && categories.map((cat) => (
                        <SelectItem key={cat.slug} value={cat.slug}>
                          {cat.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                {(searchTerm || (selectedCategory && selectedCategory !== 'all')) && (
                  <Button onClick={clearFilters} variant="outline">
                    پاک کردن فیلترها
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-foreground mb-2">مقاله‌ای یافت نشد</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || (selectedCategory && selectedCategory !== 'all')
                ? 'برای فیلترهای انتخابی مقاله‌ای وجود ندارد' 
                : 'هنوز مقاله‌ای منتشر نشده است'
              }
            </p>
            {(searchTerm || (selectedCategory && selectedCategory !== 'all')) && (
              <Button onClick={clearFilters} variant="outline">
                نمایش همه مقالات
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Posts Count */}
            <div className="mb-6">
              <p className="text-muted-foreground">
                {posts.length} مقاله یافت شد
                {searchTerm && ` برای "${searchTerm}"`}
                {selectedCategory && selectedCategory !== 'all' && Array.isArray(categories) && ` در دسته‌بندی "${categories.find(c => c.slug === selectedCategory)?.title}"`}
              </p>
            </div>

            {/* Posts Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {posts.map((post) => (
                <Card 
                  key={post.id} 
                  className="group hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  {post.cover_image && (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img 
                        src={post.cover_image} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                    {post.excerpt && (
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{post.author.username}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.published_at || post.created_at).toLocaleDateString('fa-IR')}</span>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag.slug} variant="outline" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                      {post.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{post.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}