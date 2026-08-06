import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import { Bot, Plus, Clock, Pin, MessageSquare, Loader2, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AIConversation {
  id: number;
  title: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  last_message?: {
    role: string;
    content: string;
    created_at: string;
  };
  message_count: number;
}

export function AIConversationList() {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/chat/ai/conversations/');
      const payload = response.data;
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
          ? payload.results
          : [];
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      toast.error('خطا در دریافت گفتگوها');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createNewConversation = async () => {
    try {
      setCreating(true);
      const response = await axiosInstance.post('/chat/ai/conversations/', {
        title: 'گفتگوی جدید'
      });
      navigate(`/panel/ai/${response.data.id}`);
    } catch (err) {
      console.error('Error creating conversation:', err);
      toast.error('خطا در ایجاد گفتگوی جدید');
    } finally {
      setCreating(false);
    }
  };

  const deleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axiosInstance.delete(`/chat/ai/conversations/${id}/`);
      toast.success('گفتگو حذف شد');
      fetchConversations();
    } catch {
      toast.error('خطا در حذف گفتگو');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Sort: pinned first, then by updated_at
  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="h-[calc(100vh-6.5rem)]">
      <Card className="h-full flex flex-col">
        <CardHeader className="p-3 sm:p-6 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">دستیار هوشمند</CardTitle>
                <CardDescription>گفتگوهای شما با دستیار آموزشی</CardDescription>
              </div>
            </div>
            <Button onClick={createNewConversation} disabled={creating} className="flex-1 sm:flex-none">
              {creating ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Plus className="h-4 w-4 ml-1" />}
              گفتگوی جدید
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="border rounded-lg p-4">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : sortedConversations.length === 0 ? (
            <div className="text-center p-10 border border-dashed rounded-lg">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-medium mb-2">هنوز گفتگویی ندارید</h3>
              <p className="text-muted-foreground mb-4">گفتگوی جدیدی با دستیار هوشمند شروع کنید</p>
              <Button onClick={createNewConversation} disabled={creating}>
                <Plus className="h-4 w-4 ml-1" />
                شروع گفتگوی جدید
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-blue-500/4 border border-blue-500/8 rounded-md p-4 text-right">
                  <h4 className="font-medium text-blue-800 mb-2">چرا از دستیار هوشمند استفاده کنیم؟</h4>
                  <ul className="text-blue-700 text-sm space-y-2">
                    <li>• دریافت کمک فوری برای سوالات درسی</li>
                    <li>• راهنمایی در حل مسائل ریاضی و فیزیک</li>
                    <li>• توضیح مفاهیم درسی به زبان ساده</li>
                    <li>• امکان پرسش سوالات پیگیری</li>
                  </ul>
                </div>
                <div className="bg-green-500/4 border border-green-500/8 rounded-md p-4 text-right">
                  <h4 className="font-medium text-green-800 mb-2">ویژگی‌های گفتگو</h4>
                  <ul className="text-green-700 text-sm space-y-2">
                    <li>• ذخیره تاریخچه گفتگوها برای مراجعه بعدی</li>
                    <li>• امکان ادامه گفتگو در هر زمان</li>
                    <li>• دسترسی به تمام پرسش‌های قبلی</li>
                    <li>• ارائه توضیحات قدم به قدم برای سوالات</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {sortedConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="border rounded-lg p-3 sm:p-4 hover:bg-muted/30 transition cursor-pointer group"
                  onClick={() => navigate(`/panel/ai/${conversation.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {conversation.is_pinned && <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        <h3 className="font-medium text-md sm:text-lg line-clamp-1">{conversation.title}</h3>
                      </div>
                      {conversation.last_message && (
                        <div className="text-muted-foreground text-xs sm:text-sm line-clamp-2">
                          <span className="font-medium ml-1">
                            {conversation.last_message.role === 'user' ? 'شما:' : 'دستیار:'}
                          </span>
                          {conversation.last_message.content}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(conversation.updated_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {conversation.message_count} پیام
                        </span>
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>حذف گفتگو</DialogTitle>
                          <DialogDescription>
                            آیا از حذف این گفتگو مطمئن هستید؟
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {}}>انصراف</Button>
                          <Button variant="destructive" onClick={(e) => deleteConversation(conversation.id, e)}>حذف</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}