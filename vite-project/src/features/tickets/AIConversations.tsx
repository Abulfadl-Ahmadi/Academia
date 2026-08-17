import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Bot,
  UserRound,
  Archive,
  RotateCw,
  ArrowUpIcon,
  MessageCircleDashedIcon,
  Plus,
  Pencil,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
} from '@/components/ui/message-scroller';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Textarea } from '@/components/ui/textarea';
import { Streamdown } from "streamdown";
import { createMathPlugin } from "@streamdown/math";
import "streamdown/styles.css";
import "katex/dist/katex.min.css";

const math = createMathPlugin({
  singleDollarTextMath: true,
});

// Types
interface AIConversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: {
    content: string;
    role: string;
    created_at: string;
  };
  message_count?: number;
}

interface AIMessage {
  id: number;
  role: 'user' | 'assistant' | 'ai';
  content: string;
  created_at: string;
}

// ─── AIConversationList ──────────────────────────────────────────────────────
export function AIConversationList() {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const navigate = useNavigate();

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/support/ai/conversations/');
      const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      toast.error('خطا در بارگذاری گفتگوها');
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
      const res = await axiosInstance.post('/api/support/ai/conversations/', {
        title: 'گفتگوی جدید'
      });
      navigate(`/panel/support/ask-ai/${res.data.id}`);
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      toast.error(err?.response?.data?.error || 'خطا در ایجاد گفتگوی جدید');
    } finally {
      setCreating(false);
    }
  };

  const handleStartRename = (e: React.MouseEvent, conv: AIConversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = async (e: React.MouseEvent | React.KeyboardEvent, id: number) => {
    e.stopPropagation();
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    try {
      setSavingEdit(true);
      await axiosInstance.patch(`/api/support/ai/conversations/${id}/`, {
        title: trimmed
      });
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: trimmed } : c));
      toast.success('عنوان گفتگو تغییر یافت');
      setEditingId(null);
    } catch {
      toast.error('خطا در ویرایش عنوان');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm('آیا از حذف این گفتگو اطمینان دارید؟')) return;
    try {
      await axiosInstance.delete(`/api/support/ai/conversations/${id}/`);
      setConversations(prev => prev.filter(c => c.id !== id));
      toast.success('گفتگو با موفقیت حذف شد');
    } catch {
      toast.error('خطا در حذف گفتگو');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background border rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
            <Bot size={26} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold">گفتگوهای هوش مصنوعی</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              تاریخچه مکالمات شما با دستیار هوشمند
            </p>
          </div>
        </div>
        <Button
          onClick={createNewConversation}
          disabled={creating || loading}
          size="default"
          className="rounded-xl shrink-0 gap-1.5"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus size={18} />
          )}
          <span>شروع گفتگوی جدید</span>
        </Button>
      </div>

      {/* Conversations List */}
      <div className="bg-background border rounded-2xl p-4 sm:p-6 shadow-xs min-h-[350px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">در حال بارگذاری تاریخچه گفتگوها...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
              <MessageCircleDashedIcon size={32} />
            </div>
            <h3 className="text-base font-semibold">هنوز گفتگویی ایجاد نشده است</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-6">
              شما می‌توانید با شروع یک گفتگوی جدید، هرگونه سوال علمی، درسی یا تحلیلی خود را از هوش مصنوعی بپرسید.
            </p>
            <Button
              onClick={createNewConversation}
              disabled={creating}
              className="rounded-xl gap-2"
            >
              <Plus size={16} />
              شروع اولین گفتگو
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => navigate(`/panel/support/ask-ai/${conv.id}`)}
                className="py-4 px-3 sm:px-4 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/15 shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Bot size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingId === conv.id ? (
                      <div className="flex items-center gap-1 max-w-md" onClick={e => e.stopPropagation()}>
                        <Input
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="h-8 text-sm px-2.5 rounded-lg"
                          autoFocus
                          disabled={savingEdit}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveRename(e, conv.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-primary shrink-0"
                          onClick={e => handleSaveRename(e, conv.id)}
                          disabled={savingEdit}
                        >
                          <Check size={16} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground shrink-0"
                          onClick={() => setEditingId(null)}
                          disabled={savingEdit}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ) : (
                      <h3 className="text-sm sm:text-base font-semibold group-hover:text-primary transition-colors truncate flex items-center gap-2">
                        <span>{conv.title || 'گفتگوی بدون عنوان'}</span>
                      </h3>
                    )}
                    {conv.last_message && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        <span className="font-medium text-foreground/80 ml-1">
                          {conv.last_message.role === 'user' ? 'شما:' : 'هوش مصنوعی:'}
                        </span>
                        {conv.last_message.content}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center shrink-0">
                  <span className="text-[11px] text-muted-foreground font-mono ml-1" dir="ltr">
                    {formatDate(conv.updated_at || conv.created_at)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => handleStartRename(e, conv)}
                    title="ویرایش عنوان"
                  >
                    <Pencil size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => handleDeleteConversation(e, conv.id)}
                    title="حذف گفتگو"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScrollToEndOnLoad({ trigger }: { trigger: any }) {
  const { scrollToEnd } = useMessageScroller();
  useEffect(() => {
    if (trigger !== undefined && trigger !== null && trigger > 0) {
      scrollToEnd({ behavior: 'auto' });
      const timer = setTimeout(() => {
        scrollToEnd({ behavior: 'auto' });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [trigger, scrollToEnd]);
  return null;
}

// ─── AIConversationDetail ────────────────────────────────────────────────────
export function AIConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [remainingQuestions, setRemainingQuestions] = useState<number | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchConversation = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/support/ai/conversations/${id}/`);
      setConversation(res.data);
      setMessages(res.data.messages || []);
      if (res.data.remaining_questions !== undefined) {
        setRemainingQuestions(res.data.remaining_questions);
        setTotalQuestions(res.data.total_questions);
      }
    } catch (err: any) {
      console.error("Error loading conversation:", err);
      toast.error('خطا در بارگذاری مکالمه');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  const startEditingTitle = () => {
    setTitleInput(conversation?.title || '');
    setIsEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    const trimmed = titleInput.trim();
    if (!trimmed || !id) {
      setIsEditingTitle(false);
      return;
    }
    try {
      setSavingTitle(true);
      await axiosInstance.patch(`/api/support/ai/conversations/${id}/`, {
        title: trimmed,
      });
      setConversation((prev) => (prev ? { ...prev, title: trimmed } : null));
      toast.success('عنوان گفتگو بروزرسانی شد');
      setIsEditingTitle(false);
    } catch {
      toast.error('خطا در تغییر عنوان گفتگو');
    } finally {
      setSavingTitle(false);
    }
  };

  const sendMessage = async () => {
    const content = messageInput.trim();
    if (!content || sending || !id) return;

    const optimisticMsg: AIMessage = {
      id: Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setMessageInput('');
    setSending(true);

    try {
      const res = await axiosInstance.post(
        `/api/support/ai/conversations/${id}/add_message/`,
        { content }
      );
      const data = res.data;
      const newMessages: AIMessage[] = [];
      if (data.user_message) newMessages.push(data.user_message);
      if (data.ai_message) newMessages.push(data.ai_message);

      setMessages((prev) => {
        const without = prev.filter((m) => m.id !== optimisticMsg.id);
        return newMessages.length > 0 ? [...without, ...newMessages] : prev;
      });
      if (data.remaining_questions !== undefined) {
        setRemainingQuestions(data.remaining_questions);
      }
      if (data.conversation_title) {
        setConversation((prev) => prev ? { ...prev, title: data.conversation_title } : null);
      }
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      toast.error(err?.response?.data?.error || 'خطا در ارسال پیام');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <MessageScrollerProvider defaultScrollPosition="end" autoScroll>
      <ScrollToEndOnLoad trigger={loading ? null : messages.length} />
      <div className="flex flex-col h-[calc(100vh-6.5rem)] overflow-hidden bg-background">
        {/* Header */}
        <div className="shrink-0 border-b px-4 pb-3 bg-background flex items-center justify-between gap-2 shadow-xs">
          {isEditingTitle ? (
            <div className="flex items-center gap-1 min-w-0 flex-1 max-w-sm">
              <Input
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="عنوان گفتگو..."
                className="h-8 text-sm px-2.5 rounded-lg"
                autoFocus
                disabled={savingTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-primary shrink-0"
                onClick={handleSaveTitle}
                disabled={savingTitle}
                title="ذخیره"
              >
                {savingTitle ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground shrink-0"
                onClick={() => setIsEditingTitle(false)}
                disabled={savingTitle}
                title="انصراف"
              >
                <X size={16} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0 group">
              <div className="bg-primary/10 p-1.5 rounded-full shrink-0">
                <Bot size={18} className="text-primary" />
              </div>
              <h2 className="text-sm sm:text-base font-semibold truncate max-w-[200px] sm:max-w-md">
                {conversation?.title || 'گفتگو با هوش مصنوعی'}
              </h2>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground/60 hover:text-foreground opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={startEditingTitle}
                title="ویرایش عنوان"
              >
                <Pencil size={13} />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {remainingQuestions !== null && totalQuestions !== null && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                باقی‌مانده: <strong>{remainingQuestions}</strong>/{totalQuestions}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={fetchConversation}
              disabled={loading || sending}
              title="بروزرسانی مکالمه"
            >
              <RotateCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/panel/support/ask-ai')}
            >
              <Archive size={14} className="ml-1" />
              <span className="hidden sm:inline">همه گفتگوها</span>
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="relative flex-1 overflow-hidden min-h-0 bg-muted/10 w-full">
          {loading ? (
            <div className="bg-background flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageCircleDashedIcon />
                </EmptyMedia>
                <EmptyTitle>گفتگوی جدید</EmptyTitle>
                <EmptyDescription>
                  سوال خود را بنویسید و پاسخ فوری از هوش مصنوعی دریافت کنید
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <MessageScroller className="bg-background h-full w-full">
              <MessageScrollerViewport className="bg-background size-full">
                <style>{`
                  .streamdown-wrapper {
                    max-width: 100% !important;
                    overflow-wrap: anywhere !important;
                    word-break: break-word !important;
                  }
                  .streamdown-wrapper * {
                    max-width: 100% !important;
                  }
                  .streamdown-wrapper pre {
                    max-width: 100% !important;
                    overflow-x: auto !important;
                    white-space: pre-wrap !important;
                    word-break: break-all !important;
                  }
                  .streamdown-wrapper code {
                    word-break: break-all !important;
                  }
                  .streamdown-wrapper .katex-display {
                    max-width: 100% !important;
                    overflow-x: auto !important;
                    overflow-y: hidden !important;
                    padding: 4px 0 !important;
                    display: block !important;
                  }
                  .streamdown-wrapper .katex {
                    font-size: 1em !important;
                  }
                  .streamdown-wrapper table {
                    display: block !important;
                    max-width: 100% !important;
                    overflow-x: auto !important;
                  }
                `}</style>
                <MessageScrollerContent
                  aria-busy={sending}
                  className="px-3 sm:px-6 py-6 space-y-5 max-w-4xl mx-auto w-full min-w-0"
                >
                  {messages.map((message) => {
                    const isUser = message.role === 'user';
                    return (
                      <MessageScrollerItem
                        key={message.id}
                        messageId={String(message.id)}
                        scrollAnchor={isUser}
                        className={`flex w-full ${isUser ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`flex gap-2.5 items-start ${isUser ? 'max-w-[85%] sm:max-w-[80%]' : 'w-full min-w-0'}`}>
                          {/* User Avatar on the RIGHT (first in RTL) */}
                          {isUser && (
                            <div className="h-8 w-8 shrink-0 mt-1 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-2xs">
                              <UserRound size={16} />
                            </div>
                          )}

                          <div className={`flex flex-col gap-1 min-w-0 flex-1 ${isUser ? 'items-start max-w-full' : 'w-full'}`}>
                            <div
                              className={`
                                py-2.5 sm:py-3 text-sm sm:text-[15px] leading-relaxed min-w-0 max-w-full
                                ${isUser
                                  ? 'px-4 rounded-2xl bg-primary text-primary-foreground rounded-tr-xs shadow-xs'
                                  : 'w-full text-foreground'}
                              `}
                            >
                              <div className="streamdown-wrapper w-full min-w-0 max-w-full overflow-hidden">
                                <Streamdown plugins={{ math }}>
                                  {message.content}
                                </Streamdown>
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground/60 px-1 font-mono" dir="ltr">
                              {formatDate(message.created_at)}
                            </span>
                          </div>
                        </div>
                      </MessageScrollerItem>
                    );
                  })}

                  {sending && (
                    <MessageScrollerItem
                      messageId="typing"
                      scrollAnchor={false}
                      className="flex w-full justify-end"
                    >
                      <div className="flex gap-2.5 items-start">
                        <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-background border border-border/70 shadow-xs">
                          <div className="flex gap-1.5 items-center h-5">
                            <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:300ms]" />
                          </div>
                        </div>
                        {/* AI Avatar on the LEFT */}
                        <div className="h-8 w-8 shrink-0 mt-1 bg-primary/10 text-primary rounded-full flex items-center justify-center border border-primary/20 shadow-2xs">
                          <Bot size={16} />
                        </div>
                      </div>
                    </MessageScrollerItem>
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t bg-background p-3 pb-[2px]">
          <InputGroup className="max-w-3xl mx-auto rounded-2xl border shadow-xs bg-muted/30 focus-within:bg-background focus-within:ring-1 focus-within:ring-primary transition-all">
            <Textarea
              ref={textareaRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="سوال خود را بنویسید (ارسال با Ctrl+Enter)..."
              className="flex-1 min-h-[52px] max-h-40 resize-none text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3.5 shadow-none"
              disabled={sending || loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <InputGroupAddon align="block-end" className="p-2">
              <InputGroupButton
                type="button"
                size="icon"
                variant="default"
                className="h-9 w-9 rounded-full"
                disabled={sending || loading || !messageInput.trim()}
                onClick={sendMessage}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpIcon className="h-4 w-4" />
                )}
                <span className="sr-only">ارسال</span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
    </MessageScrollerProvider>
  );
}

export default AIConversationDetail;
