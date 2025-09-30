import axiosInstance from '@/lib/axios';

export interface BlogTag { id: number; name: string; slug: string }
export interface BlogCategory { id: number; title: string; slug: string; description?: string; parent?: number|null }
export interface BlogPostList {
  id: number; title: string; slug: string; excerpt: string; cover_image?: string|null;
  author: { id: number; username: string }; status: 'draft'|'published'; published_at?: string|null; created_at: string;
  tags: BlogTag[]; categories: BlogCategory[]
}
export interface BlogPostDetail extends BlogPostList {
  content: string; updated_at: string; meta_title?: string; meta_description?: string;
  images?: { id:number; image_url:string; alt_text?:string; order:number }[]
}

export const blogApi = {
  listPosts: (params?: any) => axiosInstance.get<{count:number; next:string|null; previous:string|null; results:BlogPostList[]}>('/blog/posts/', { params }),
  getPost: (slug: string) => axiosInstance.get<BlogPostDetail>(`/blog/posts/${slug}/`),
  createPost: (data: any) => axiosInstance.post('/blog/posts/', data),
  updatePost: (slug: string, data: any) => axiosInstance.put(`/blog/posts/${slug}/`, data),
  deletePost: (slug: string) => axiosInstance.delete(`/blog/posts/${slug}/`),
  publishPost: (slug: string) => axiosInstance.post(`/blog/posts/${slug}/publish/`),
  listTags: () => axiosInstance.get<BlogTag[]>('/blog/tags/'),
  listCategories: () => axiosInstance.get<BlogCategory[]>('/blog/categories/'),
};
