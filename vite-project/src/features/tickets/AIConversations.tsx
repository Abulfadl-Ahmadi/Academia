import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Bot, UserRound, Clock, Plus, Archive, MoreHorizontal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/support/ai/conversations/');
      setConversations(response.data);
    } catch (error) {
      console.error('خطا در دریافت گفتگوها:', error);
      toast.error('خطا در دریافت گفتگوها');
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
    <div className="container mx-auto px-1 sm:px-4">
      <Card className="overflow-hidden">
        <CardHeader className="p-3 sm:p-6">
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
        <CardContent className="p-3 sm:p-6">
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
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-right">
                  <h4 className="font-medium text-blue-800 mb-2">چرا از هوش مصنوعی استفاده کنیم؟</h4>
                  <ul className="text-blue-700 text-sm space-y-2">
                    <li>• دریافت کمک فوری برای سوالات درسی</li>
                    <li>• راهنمایی در حل مسائل ریاضی و فیزیک</li>
                    <li>• توضیح مفاهیم درسی به زبان ساده</li>
                    <li>• امکان پرسش سوالات پیگیری</li>
                  </ul>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-md p-4 text-right">
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
              {conversations.map((conversation) => (
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

  const sendMessage = async () => {
    if (!messageInput.trim() || !id) return;
    
    try {
      setSending(true);
      const response = await axiosInstance.post(`/support/ai/conversations/${id}/add_message/`, {
        content: messageInput.trim()
      });
      
      setMessages(prevMessages => [
        ...prevMessages,
        response.data.user_message,
        response.data.ai_message
      ]);
      
      setMessageInput('');
      
      // اسکرول به پایین صفحه
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
      
    } catch (error) {
      console.error('خطا در ارسال پیام:', error);
      toast.error('خطا در ارسال پیام');
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
    if (messages.length > 0 && !loading && !sending) {
      const messagesContainer = document.getElementById('messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }, [messages, loading, sending]);

  return (
    <div className="container mx-auto px-1 sm:px-4 h-[calc(100vh-8rem)] flex flex-col">
      <Card className="p-0 gap-0 flex flex-col h-full overflow-hidden">
        <CardHeader className=" sm:p-6 shrink-0">
          <div className="p-0 flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="flex items-center">
              <Bot size={20} />
              <div>
                {titleEditing ? (
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      className="border rounded px-2 py-1 w-full sm:w-auto"
                      onKeyDown={(e) => e.key === 'Enter' && updateTitle()}
                    />
                    <div className="flex gap-2 mt-1 sm:mt-0">
                      <Button variant="outline" size="sm" onClick={updateTitle}>ذخیره</Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setTitleInput(conversation?.title || '');
                        setTitleEditing(false);
                      }}>انصراف</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl sm:text-2xl">{conversation?.title || 'گفتگو با هوش مصنوعی'}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setTitleEditing(true)}>
                      <MoreHorizontal size={16} />
                    </Button>
                  </div>
                )}
                <CardDescription>پرسش و پاسخ با هوش مصنوعی</CardDescription>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/panel/support/ask-ai')} className="w-full sm:w-auto mt-2 sm:mt-0">
              <Archive size={16} className="ml-1" />
              همه گفتگوها
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div 
              id="messages-container" 
              className="flex-1 overflow-y-auto px-3 sm:px-6 py-4"
            >
              <div className="">
              {messages.length === 0 ? (
                <div className="text-center p-3 sm:p-10 border border-dashed rounded-lg">
                  <Bot size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium">گفتگوی جدید</h3>
                  <p className="text-muted-foreground mb-4">پرسش خود را مطرح کنید و پاسخ فوری دریافت کنید</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 sm:p-4 text-right mt-4 sm:mt-6">
                    <h4 className="font-medium text-blue-800 mb-2">چطور می‌توانم از هوش مصنوعی کمک بگیرم؟</h4>
                    <ul className="text-blue-700 text-sm space-y-1 sm:space-y-2">
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
                    rounded-lg p-2 sm:p-4 
                    ${message.role === 'user' 
                      ? 'bg-primary/5 border ml-2 sm:ml-5 border-primary/20 shadow-sm' 
                      : 'mr-2 sm:mr-5'}
                  `}>
                    <div className="flex items-center gap-2 mb-2">
                      {message.role === 'user' ? (
                        <UserRound size={16} className="shrink-0" />
                      ) : (
                        <Bot size={16} className="shrink-0" />
                      )}
                      <h3 className="font-medium text-sm sm:text-base truncate">
                        {message.role === 'user' ? 'شما' : 'هوش مصنوعی'}
                      </h3>
                      <span className="text-xs text-muted-foreground mr-auto whitespace-nowrap">
                        {formatMessageDate(message.created_at)}
                      </span>
                    </div>
                    
                    {message.role === 'user' ? (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    ) : (
                      <div className="prose prose-slate dark:prose-invert max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // @ts-expect-error - inline prop is correctly handled by ReactMarkdown
                            code: ({inline, ...props}) => 
                              inline ? 
                                <code className="bg-muted/70 px-1 py-0.5 rounded text-sm" {...props} /> : 
                                <code className="block bg-muted/70 p-2 rounded-md my-2 text-sm overflow-x-auto" {...props} />,
                            p: (props) => <p className="mb-4" {...props} />,
                            pre: (props) => <pre className="bg-muted/70 p-3 rounded-md my-3 overflow-x-auto" {...props} />,
                            h1: (props) => <h1 className="text-2xl font-bold mt-6 mb-3" {...props} />,
                            h2: (props) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
                            h3: (props) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
                            ul: (props) => <ul className="list-disc list-inside mb-4 pr-5" {...props} />,
                            ol: (props) => <ol className="list-decimal list-inside mb-4 pr-5" {...props} />,
                            a: (props) => <a className="text-primary hover:underline" {...props} />,
                            blockquote: (props) => <blockquote className="border-r-4 border-primary/30 pr-3 py-1 my-3 italic" {...props} />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))
              )}
              </div>
            </div>
          )}
          
          <div className="border-t shrink-0 p-3 sm:p-6 pt-3 sm:pt-4">
            <div className="space-y-3">
                <div className="flex flex-row sm:flex-row justify-between items-start sm:items-center gap-2">
              <Textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="سوال خود را بنویسید..."
                className="order-1 min-h-7 sm:min-h-28 focus:ring-2"
                disabled={sending || loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    sendMessage();
                  }
                }}
              />
              
                {/* <span className="text-xs text-muted-foreground order-2 sm:order-1">
                  برای ارسال می‌توانید از کلیدهای <kbd className="px-1 py-0.5 bg-muted/70 rounded text-xs">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-muted/70 rounded text-xs">Enter</kbd> استفاده کنید.
                </span> */}
                <Button 
                  onClick={sendMessage} 
                  disabled={sending || loading || !messageInput.trim()}
                  className="order-0"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {/* در حال ارسال... */}
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      {/* ارسال پیام */}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
