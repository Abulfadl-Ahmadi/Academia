import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Bot, UserRound, Clock, Plus, Archive, MoreHorizontal } from 'lucide-react';
import { Response } from "@/components/ui/shadcn-io/ai/response";


// نوع برای گفتگوی هوش مصنوعی
interface AIConversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: {
    role: string;
    content: string;
    created_at: string;
  };
  message_count: number;
}

// نوع برای پیام های هوش مصنوعی
interface AIMessage {
  id: number;
  role: 'user' | 'ai';
  content: string;
  created_at: string;
}

// کامپوننت اصلی لیست گفتگوها
export function AIConversationList() {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
    
    // Cleanup scroll prevention
    return () => {
      document.body.classList.remove('ai-conversation-active');
      document.body.style.overflow = '';
    };
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/support/ai/conversations/');
      const payload = response.data;
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
          ? payload.results
          : [];
      setConversations(data);
    } catch (error) {
      console.error('خطا در دریافت گفتگوها:', error);
      toast.error('خطا در دریافت گفتگوها');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/support/ai/conversations/', {
        title: 'گفتگوی جدید'
      });
      navigate(`/panel/support/ask-ai/${response.data.id}`);
    } catch (error) {
      console.error('خطا در ایجاد گفتگوی جدید:', error);
      toast.error('خطا در ایجاد گفتگوی جدید');
      setLoading(false);
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

  return (
    <div className="h-[calc(100vh-4rem)]">
      <Card className="h-full flex flex-col">
        <CardHeader className="p-3 sm:p-6 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <CardTitle className="text-xl sm:text-2xl">گفتگوهای هوش مصنوعی</CardTitle>
                <CardDescription>تاریخچه گفتگوهای شما با هوش مصنوعی</CardDescription>
              </div>
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
              <Button onClick={createNewConversation} disabled={loading} className="flex-1 sm:flex-none">
                <Plus size={16} className="ml-1" />
                گفتگوی جدید
              </Button>
              <Button variant="outline" onClick={() => navigate('/panel/support/ask-ai/new')} className="flex-1 sm:flex-none">
                پرسش تکی
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-10 border border-dashed rounded-lg">
              <Bot size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">هنوز گفتگویی ندارید</h3>
              <p className="text-muted-foreground mb-4">گفتگوی جدیدی با هوش مصنوعی شروع کنید</p>
              <Button onClick={createNewConversation} className="mb-8">
                <Plus size={16} className="ml-1" />
                شروع گفتگوی جدید
              </Button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-blue-500/4 border border-blue-500/8 rounded-md p-4 text-right">
                  <h4 className="font-medium text-blue-800 mb-2">چرا از هوش مصنوعی استفاده کنیم؟</h4>
                  <ul className="text-blue-700 text-sm space-y-2">
                    <li>• دریافت کمک فوری برای سوالات درسی</li>
                    <li>• راهنمایی در حل مسائل ریاضی و فیزیک</li>
                    <li>• توضیح مفاهیم درسی به زبان ساده</li>
                    <li>• امکان پرسش سوالات پیگیری</li>
                  </ul>
                </div>
                <div className="bg-green-500/4 border border-green-500/8 rounded-md p-4 text-right">
                  <h4 className="font-medium text-green-800 mb-2">ویژگی‌های گفتگو با هوش مصنوعی</h4>
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
              {Array.isArray(conversations) && conversations.map((conversation) => (
                <div 
                  key={conversation.id} 
                  className="border rounded-lg p-3 sm:p-4 hover:bg-muted/30 transition cursor-pointer"
                  onClick={() => navigate(`/panel/support/ask-ai/${conversation.id}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between mb-2 gap-1">
                    <h3 className="font-medium text-md sm:text-lg line-clamp-1">{conversation.title}</h3>
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      <Clock size={12} className="ml-1" />
                      {formatDate(conversation.updated_at)}
                    </div>
                  </div>
                  {conversation.last_message && (
                    <div className="text-muted-foreground text-xs sm:text-sm line-clamp-2">
                      <span className="font-medium ml-1">
                        {conversation.last_message.role === 'user' ? 'شما:' : 'هوش مصنوعی:'}
                      </span>
                      {conversation.last_message.content}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground">
                    {conversation.message_count} پیام
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

// کامپوننت گفتگو با هوش مصنوعی
export function AIConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const navigate = useNavigate();

  const fetchConversation = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/support/ai/conversations/${id}/`);
      setConversation(response.data);
      setTitleInput(response.data.title);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('خطا در دریافت گفتگو:', error);
      toast.error('خطا در دریافت گفتگو');
      navigate('/panel/support/ask-ai');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchConversation();
    }
  }, [id, fetchConversation]);

  // Prevent body scroll
  useEffect(() => {
    // No longer needed since we're not using fixed positioning
    return () => {
      // Cleanup just in case
      document.body.classList.remove('ai-conversation-active');
      document.body.style.overflow = '';
    };
  }, []);

  const sendMessage = async () => {
    if (!messageInput.trim() || !id) return;
    
    try {
      setSending(true);
      // ابتدا پیام کاربر را نشان بده تا تجربه کاربری بهتری داشته باشد
      const userMessage = {
        id: Date.now(), // یک ID موقت
        conversation_id: Number(id),
        role: 'user',
        content: messageInput.trim(),
        created_at: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      const currentInput = messageInput.trim();
      setMessageInput('');
      
      // اسکرول به پایین صفحه بعد از اضافه کردن پیام کاربر
      setTimeout(() => {
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 50);
      
      const response = await axiosInstance.post(`/support/ai/conversations/${id}/add_message/`, {
        content: currentInput
      });
      
      // جایگزین کردن پیام موقت کاربر با پیام واقعی از سرور و اضافه کردن پاسخ هوش مصنوعی
      setMessages(prevMessages => {
        const withoutTemp = prevMessages.filter(msg => msg.id !== userMessage.id);
        return [
          ...withoutTemp,
          response.data.user_message,
          response.data.ai_message
        ];
      });
      
      // اسکرول به پایین صفحه بعد از دریافت پاسخ
      setTimeout(() => {
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 200);
      
    } catch (error) {
      console.error('خطا در ارسال پیام:', error);
      
      // حذف پیام موقت کاربر در صورت خطا
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== userMessage.id));
      
      // نمایش خطای مناسب
      if (error?.response?.status === 503) {
        toast.error('سرویس هوش مصنوعی در حال حاضر در دسترس نیست. لطفا بعدا تلاش کنید.');
      } else {
        toast.error('خطا در ارسال پیام. لطفا دوباره تلاش کنید.');
      }
      
      // پیام کاربر را به ورودی برگردان
      setMessageInput(currentInput);
    } finally {
      setSending(false);
    }
  };

  const updateTitle = async () => {
    if (!titleInput.trim() || !id) return;
    
    try {
      await axiosInstance.patch(`/support/ai/conversations/${id}/`, {
        title: titleInput.trim()
      });
      
      if (conversation) {
        setConversation({
          ...conversation,
          title: titleInput.trim()
        });
      }
      
      setTitleEditing(false);
      toast.success('عنوان گفتگو با موفقیت بروزرسانی شد');
      
    } catch (error) {
      console.error('خطا در بروزرسانی عنوان:', error);
      toast.error('خطا در بروزرسانی عنوان');
    }
  };

  const formatMessageDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      const messagesContainer = document.getElementById('messages-container');
      if (messagesContainer) {
        setTimeout(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
      }
    }
  }, [messages.length, loading]);

  // Auto-scroll during message sending
  useEffect(() => {
    if (sending) {
      const messagesContainer = document.getElementById('messages-container');
      if (messagesContainer) {
        setTimeout(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
      }
    }
  }, [sending]);

  return (
    <div className="h-[calc(100vh-4rem)]">
      <Card className="flex flex-col h-full pb-0">
        <CardHeader className="shrink-0 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <div className="flex items-center">
              <Bot size={18} />
              <div>
                {titleEditing ? (
                  <div className="flex flex-wrap">
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
                      onKeyDown={(e) => e.key === 'Enter' && updateTitle()}
                    />
                    <div className="flex gap-1 mt-1 sm:mt-0">
                      <Button variant="outline" size="sm" onClick={updateTitle}>ذخیره</Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setTitleInput(conversation?.title || '');
                        setTitleEditing(false);
                      }}>انصراف</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CardTitle className="text-lg sm:text-xl">{conversation?.title || 'گفتگو با هوش مصنوعی'}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setTitleEditing(true)}>
                      <MoreHorizontal size={14} />
                    </Button>
                  </div>
                )}
                {/* <CardDescription className="text-xs sm:text-sm">پرسش و پاسخ با هوش مصنوعی</CardDescription> */}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/panel/support/ask-ai')} className="w-full sm:w-auto mt-1 sm:mt-0">
              <Archive size={14} className="ml-1" />
              همه گفتگوها
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div 
              id="messages-container" 
              className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 space-y-3"
            >
              {messages.length === 0 ? (
                <div className="text-center p-2 sm:p-6 border border-dashed rounded-lg">
                  <Bot size={36} className="mx-auto mb-3 text-muted-foreground" />
                  <h3 className="text-base font-medium">گفتگوی جدید</h3>
                  <p className="text-muted-foreground mb-3 text-sm">پرسش خود را مطرح کنید و پاسخ فوری دریافت کنید</p>
                  <div className="bg-blue-500/4 border border-blue-500/8 rounded-md p-2 sm:p-3 text-right mt-3">
                    <h4 className="font-medium text-blue-800 mb-2 text-sm">چطور می‌توانم از هوش مصنوعی کمک بگیرم؟</h4>
                    <ul className="text-blue-700 text-xs space-y-1">
                      <li>• سوالات درسی خود را به صورت واضح مطرح کنید</li>
                      <li>• کمک در حل مسائل ریاضی و فیزیک</li>
                      <li>• پرسش سوالات پیگیری درباره یک موضوع</li>
                      <li>• توضیح مفاهیم درسی به زبان ساده</li>
                    </ul>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`
                    rounded-lg p-2 sm:p-3 mb-3
                    ${message.role === 'user' 
                      ? 'bg-primary/5 border ml-2 sm:ml-6 border-primary/20 shadow-sm' 
                      : 'm-2'}
                  `}>
                    <div className="flex items-center gap-2 mb-2">
                      {message.role === 'user' ? (
                        <UserRound size={14} className="shrink-0 text-primary" />
                      ) : (
                        <Bot size={14} className="shrink-0 text-blue-600" />
                      )}
                      <h3 className="font-medium text-xs sm:text-sm">
                        {message.role === 'user' ? 'شما' : 'هوش مصنوعی'}
                      </h3>
                      <span className="text-xs text-muted-foreground mr-auto whitespace-nowrap">
                        {formatMessageDate(message.created_at)}
                      </span>
                    </div>
                    
                    <div className="message-content">
                      {message.role === 'user' ? (
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      ) : (
                        // <MathRenderer content={message.content} />
                        <Response>{message.content}</Response>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          <div className="border-t shrink-0 p-1 sm:p-3 bg-background">
            <div className="flex gap-2 items-end">
              <Textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="سوال خود را بنویسید..."
                className="flex-1 min-h-[40px] max-h-20 resize-none text-sm"
                disabled={sending || loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    sendMessage();
                  }
                }}
              />
              <Button 
                onClick={sendMessage} 
                disabled={sending || loading || !messageInput.trim()}
                className="shrink-0 h-[40px]"
                size="sm"
              >
                {sending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send size={12} />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              برای ارسال از <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> استفاده کنید
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
