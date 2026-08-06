import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import { Bot, Send, Loader2, Pin, PinOff, Trash2, Paperclip, X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStickToBottom } from 'use-stick-to-bottom';
import MathRenderer from '@/components/ui/math-renderer-optimized';

// Types
interface AIMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  model_tier?: number;
  model_name?: string;
  reasoning?: string | null;
  created_at: string;
}

interface AIConversation {
  id: number;
  title: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  messages?: AIMessage[];
}

interface SubscriptionInfo {
  tier: string;
  tier_display: string;
  is_active: boolean;
  usage: { tier1: number; tier2: number; tier3: number; pdf: number; image: number };
  remaining: { tier1: number; tier2: number; tier3: number; pdf: number; image: number };
  quota: {
    max_tier: number;
    tier1_daily: number;
    tier2_daily: number;
    tier3_daily: number;
    pdf_daily: number;
    image_daily: number;
  };
}

const TIER_BADGES: Record<number, { label: string; className: string }> = {
  1: { label: 'سریع', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  2: { label: 'متعادل', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  3: { label: 'پیشرفته', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
};

export function AIChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [showReasoning, setShowReasoning] = useState<Record<number, boolean>>({});
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Scroll to bottom
  const { scrollRef, scrollToBottom } = useStickToBottom();

  // Fetch conversation
  const fetchConversation = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/chat/ai/conversations/${id}/`);
      setConversation(response.data);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Error fetching conversation:', err);
      toast.error('خطا در دریافت گفتگو');
      navigate('/panel/ai');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Fetch subscription
  const fetchSubscription = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/chat/ai/subscription/');
      setSubscription(response.data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchConversation();
    }
    fetchSubscription();
  }, [id, fetchConversation, fetchSubscription]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0 || streamingContent) {
      scrollToBottom();
    }
  }, [messages.length, streamingContent, scrollToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !id || sending) return;

    // Optimistic user message
    const tempUserMsg: AIMessage = {
      id: Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setInput('');
    setSending(true);
    setStreamingContent('');

    // Build attachment metadata
    const attachmentMeta = attachments.map(f => ({
      name: f.name,
      type: f.type.startsWith('image/') ? 'image' : f.type === 'application/pdf' ? 'pdf' : 'text',
      size: f.size,
    }));

    try {
      // Use streaming endpoint
      const response = await fetch('/api/chat/ai/stream/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          conversation_id: Number(id),
          content,
          attachments: attachmentMeta,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error(errorData.error || 'سهمیه شما به پایان رسیده است');
        } else if (response.status === 403) {
          toast.error(errorData.error || 'دسترسی غیرمجاز');
        } else {
          toast.error(errorData.error || 'خطا در ارسال پیام');
        }
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
        setInput(content);
        return;
      }

      // Parse SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'delta') {
                fullContent += data.content || '';
                setStreamingContent(fullContent);
              } else if (data.type === 'done') {
                // Add final AI message
                const aiMsg: AIMessage = {
                  id: data.message_id || Date.now() + 1,
                  role: 'assistant',
                  content: fullContent,
                  model_tier: data.tier,
                  model_name: data.model,
                  created_at: new Date().toISOString(),
                };
                setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, aiMsg]);
                setStreamingContent('');
                if (data.remaining) {
                  setSubscription(prev => prev ? { ...prev, remaining: data.remaining, usage: data.usage } : prev);
                }
              } else if (data.type === 'error') {
                toast.error(data.message || 'خطا در دریافت پاسخ');
                setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
                setInput(content);
              }
            } catch (e) {
              console.error('Failed to parse SSE chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      toast.error('خطا در ارتباط با سرور');
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      setInput(content);
    } finally {
      setSending(false);
      setStreamingContent('');
      setAttachments([]);
    }
  };

  const togglePin = async () => {
    if (!id) return;
    try {
      const response = await axiosInstance.post(`/chat/ai/conversations/${id}/toggle_pin/`);
      setConversation(prev => prev ? { ...prev, is_pinned: response.data.is_pinned } : prev);
    } catch {
      toast.error('خطا در پین کردن گفتگو');
    }
  };

  const deleteConversation = async () => {
    if (!id) return;
    try {
      await axiosInstance.delete(`/chat/ai/conversations/${id}/`);
      toast.success('گفتگو حذف شد');
      navigate('/panel/ai');
    } catch {
      toast.error('خطا در حذف گفتگو');
    }
  };

  const toggleReasoning = (msgId: number) => {
    setShowReasoning(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-6.5rem)] flex flex-col">
        <div className="flex items-center gap-3 p-4 border-b">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-20 w-3/4" />
          <Skeleton className="h-32 w-2/3 mr-auto" />
          <Skeleton className="h-16 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm sm:text-base">{conversation?.title || 'گفتگوی هوش مصنوعی'}</h2>
              {conversation?.is_pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>دستیار آموزشی</span>
              {subscription && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {subscription.tier_display}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={togglePin}>
                  {conversation?.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{conversation?.is_pinned ? 'برداشتن پین' : 'پین کردن'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>حذف گفتگو</DialogTitle>
                <DialogDescription>
                  آیا از حذف این گفتگو مطمئن هستید؟ این عمل قابل بازگشت نیست.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => {}}>انصراف</Button>
                <Button variant="destructive" onClick={deleteConversation}>حذف</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4">
        {messages.length === 0 && !streamingContent ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">از دستیار آموزشی بپرسید</h3>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
              سوالات درسی، مسائل ریاضی، توضیح مفاهیم و هر چیز دیگری که نیاز دارید را بپرسید.
              دستیار هوشمند به صورت گام‌به‌گام به شما کمک می‌کند.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-lg">
              {['حل مسئله ریاضی', 'توضیح مفهوم', 'راهنمایی تمرین'].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setInput(suggestion + ' ')}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'order-first' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted/50 border rounded-bl-sm'
                  }`}>
                    {message.role === 'assistant' && message.model_tier && (
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-[10px] px-1.5 py-0 ${TIER_BADGES[message.model_tier]?.className || ''}`}>
                          {TIER_BADGES[message.model_tier]?.label || `Tier ${message.model_tier}`}
                        </Badge>
                        {message.model_name && (
                          <span className="text-[10px] text-muted-foreground">{message.model_name}</span>
                        )}
                      </div>
                    )}
                    {message.role === 'assistant' ? (
                      <MathRenderer content={message.content} />
                    ) : (
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[10px] text-muted-foreground">{formatTime(message.created_at)}</span>
                    {message.role === 'assistant' && message.reasoning && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1 text-[10px] text-muted-foreground"
                        onClick={() => toggleReasoning(message.id)}
                      >
                        {showReasoning[message.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {showReasoning[message.id] ? 'پنهان کردن استدلال' : 'نمایش استدلال'}
                      </Button>
                    )}
                  </div>
                  {message.role === 'assistant' && message.reasoning && showReasoning[message.id] && (
                    <div className="mt-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                      <div className="font-medium mb-1">استدلال مدل:</div>
                      <div className="whitespace-pre-wrap">{message.reasoning}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming content */}
            {streamingContent && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[85%] sm:max-w-[75%]">
                  <div className="rounded-2xl px-4 py-3 bg-muted/50 border rounded-bl-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        در حال پاسخ...
                      </Badge>
                    </div>
                    <MathRenderer content={streamingContent} />
                  </div>
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {sending && !streamingContent && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl px-4 py-3 bg-muted/50 border rounded-bl-sm">
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">در حال فکر کردن...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-3 sm:p-4 shrink-0 bg-background">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs">
                <Paperclip className="h-3 w-3" />
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>افزودن فایل (تصویر یا PDF)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="سوال خود را بنویسید..."
            className="flex-1 min-h-[44px] max-h-32 resize-none"
            disabled={sending || loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={sending || loading || !input.trim()}
            className="h-10 shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          دستیار آموزشی ممکن است خطا کند. اطلاعات مهم را بررسی کنید.
        </p>
      </div>
    </div>
  );
}
