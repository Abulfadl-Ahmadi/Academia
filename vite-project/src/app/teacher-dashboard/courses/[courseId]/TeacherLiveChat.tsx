import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../../../../context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageCircle, RefreshCw, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: number;
  user: string;
  user_id: number;
  first_name: string;
  last_name: string;
  message: string;
  timestamp: string;
}

interface TeacherLiveChatProps {
  courseId: string;
}

interface LastErrorDetails {
  code?: number;
  title: string;
  hint: string;
  reason?: string;
  url: string;
  time: string;
}

function getWebSocketUrl(courseId: string): string {
  // 1. اگر آدرس اختصاصی وب‌سوکت در متغیرهای محیطی ست شده باشد:
  const envWsUrl = import.meta.env.VITE_WS_URL;
  if (envWsUrl && typeof envWsUrl === "string") {
    const cleanBase = envWsUrl.replace(/\/+$/, "");
    if (cleanBase.endsWith("/ws")) {
      return `${cleanBase}/chat/${courseId}/`;
    }
    return `${cleanBase}/ws/chat/${courseId}/`;
  }

  // 2. اگر VITE_API_BASE_URL یک آدرس کامل است (مثلاً https://api.ariantafazolizadeh.ir/api):
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase && (apiBase.startsWith("http://") || apiBase.startsWith("https://"))) {
    try {
      const parsed = new URL(apiBase);
      const wsProtocol = parsed.protocol === "https:" ? "wss:" : "ws:";
      const port = parsed.port ? `:${parsed.port}` : "";
      return `${wsProtocol}//${parsed.hostname}${port}/ws/chat/${courseId}/`;
    } catch {
      // fallback
    }
  }

  // 3. در غیر این صورت استفاده از هاست کنونی / پورت 8000 در حالت محلی:
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsHost = window.location.hostname;
  const wsPort = window.location.protocol === "https:" ? "" : ":8000";
  return `${wsProtocol}//${wsHost}${wsPort}/ws/chat/${courseId}/`;
}

function getCloseCodeDescription(code?: number): { title: string; hint: string } {
  switch (code) {
    case 1000:
      return {
        title: "قطع اتصال عادی (Normal Closure)",
        hint: "اتصال به صورت عمدی یا خروج عادی بسته شد.",
      };
    case 1001:
      return {
        title: "خروج از سرویس (Going Away)",
        hint: "سرور یا تب مرورگر صفحه را ترک کرد یا سرویس ری‌استارت شد.",
      };
    case 1002:
      return {
        title: "خطای پروتکل (Protocol Error)",
        hint: "عدم تطابق پروتکل بین مرورگر و سرور چت.",
      };
    case 1003:
      return {
        title: "نوع داده نامعتبر (Unsupported Data)",
        hint: "نوع داده‌های ارسالی توسط سرور پذیرفته نشد.",
      };
    case 1005:
      return {
        title: "بدون کد وضعیت (No Status Code)",
        hint: "سرور بدون اعلام کد خطا اتصال را قطع کرد.",
      };
    case 1006:
      return {
        title: "قطع غیرعادی (Abnormal Closure / Unreachable)",
        hint: "ارتباط با سرور برقرار نشد؛ ممکن است سرویس ASGI (Daphne) در بک‌اند اجرا نباشد، تنظیمات پراکسی Nginx برای مسیر /ws/ مسدود باشد، یا اینترنت قطع شده باشد.",
      };
    case 1008:
      return {
        title: "رد دسترسی امنیتی (Policy Violation)",
        hint: "توکن ورود منقضی شده یا کوکی احراز هویت ارسال نشد.",
      };
    case 1011:
      return {
        title: "خطای داخلی سرور وب‌سوکت (Server Error)",
        hint: "یک خطای کنترل‌نشده در سرور چت رخ داده است.",
      };
    case 1015:
      return {
        title: "خطای دست‌تکانی TLS/SSL (Handshake Failed)",
        hint: "گواهی امنیتی SSL سرور یا پروتکل WSS دچار مشکل است.",
      };
    case 4003:
      return {
        title: "عدم احراز دسترسی تدریس (Permission Denied)",
        hint: "شما به عنوان مدرس این دوره در سیستم ثبت نشده‌اید.",
      };
    default:
      return {
        title: code ? `کد خطای ${code}` : "خطای نامشخص",
        hint: "قطع ارتباط یا عدم پاسخ‌دهی سرور وب‌سوکت چت.",
      };
  }
}

export default function TeacherLiveChat({ courseId }: TeacherLiveChatProps) {
  const { user: currentUser } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastError, setLastError] = useState<LastErrorDetails | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const isManuallyClosedRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const scrollViewport = scrollAreaRef.current?.querySelector(
        '[data-slot="scroll-area-viewport"]'
      );
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }, 50);
  }, []);

  // Add effect to scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const connect = useCallback(() => {
    if (socketRef.current) {
      isManuallyClosedRef.current = true;
      socketRef.current.close();
      socketRef.current = null;
    }

    isManuallyClosedRef.current = false;
    setIsConnecting(true);

    const wsUrl = getWebSocketUrl(courseId);
    console.log("Teacher connecting to WebSocket:", wsUrl);

    try {
      const newSocket = new WebSocket(wsUrl);
      socketRef.current = newSocket;

      newSocket.onopen = () => {
        console.log("Teacher WebSocket connected to:", wsUrl);
        setIsConnected(true);
        setIsConnecting(false);
        setLastError(null);
        toast.success("به چت زنده کلاس متصل شدید");
      };

      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "last_50_messages") {
            setMessages(data.messages);
            scrollToBottom();
          } else if (data.type === "chat_message") {
            setMessages((prev) => [...prev, data.message]);
            scrollToBottom();
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      newSocket.onclose = (event: CloseEvent) => {
        console.log("Teacher WebSocket disconnected:", event);
        setIsConnected(false);
        setIsConnecting(false);

        // Don't show error toast if deliberately closed
        if (isManuallyClosedRef.current || event.code === 1000) {
          return;
        }

        const info = getCloseCodeDescription(event.code);
        const errDetails: LastErrorDetails = {
          code: event.code,
          title: info.title,
          hint: info.hint,
          reason: event.reason || undefined,
          url: wsUrl,
          time: new Date().toLocaleTimeString("fa-IR"),
        };
        setLastError(errDetails);

        toast.error(`خطا در اتصال به چت زنده: ${info.title}`, {
          description: (
            <div className="flex flex-col gap-1.5 text-xs text-right mt-1.5 leading-relaxed">
              <div>
                <span className="font-semibold text-foreground">کد وضعیت:</span>{" "}
                <span className="font-mono font-bold text-red-500">{event.code}</span>
                {event.reason ? ` (${event.reason})` : ""}
              </div>
              <div>
                <span className="font-semibold text-foreground">علت احتمالی:</span> {info.hint}
              </div>
              <div className="mt-1 p-1 bg-muted/80 rounded text-[10px] font-mono text-left truncate dir-ltr">
                {wsUrl}
              </div>
            </div>
          ),
          duration: 10000,
          action: {
            label: "تلاش مجدد",
            onClick: () => connect(),
          },
        });
      };

      newSocket.onerror = (error) => {
        console.error("Teacher WebSocket error event:", error);
      };

      setSocket(newSocket);
    } catch (err: any) {
      console.error("Failed to construct WebSocket:", err);
      setIsConnecting(false);
      setIsConnected(false);

      const errDetails: LastErrorDetails = {
        title: "خطا در ایجاد وب‌سوکت",
        hint: err?.message || "مرورگر نتوانست اتصال وب‌سوکت را ایجاد کند.",
        url: wsUrl,
        time: new Date().toLocaleTimeString("fa-IR"),
      };
      setLastError(errDetails);

      toast.error("خطا در ایجاد اتصال وب‌سوکت چت", {
        description: (
          <div className="text-xs text-right mt-1">
            <p>{errDetails.hint}</p>
            <p className="mt-1 text-[10px] font-mono dir-ltr truncate">{wsUrl}</p>
          </div>
        ),
        duration: 9000,
        action: {
          label: "تلاش مجدد",
          onClick: () => connect(),
        },
      });
    }
  }, [courseId, scrollToBottom]);

  useEffect(() => {
    connect();

    return () => {
      isManuallyClosedRef.current = true;
      if (socketRef.current) {
        socketRef.current.close(1000, "TeacherLiveChat unmounted");
        socketRef.current = null;
      }
    };
  }, [connect]);

  const sendMessage = () => {
    if (newMessage.trim() && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          message: newMessage.trim(),
        })
      );
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden bg-background">
      {/* Header */}
      <div className="px-4 py-2.5 bg-muted/40 flex items-center justify-between border-b text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">وضعیت چت زنده:</span>
          <div className="flex items-center gap-1.5 font-medium">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                isConnected
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : isConnecting
                  ? "bg-amber-500 animate-pulse"
                  : "bg-red-500"
              }`}
            ></div>
            <span
              className={
                isConnected
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isConnecting
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {isConnected
                ? "متصل"
                : isConnecting
                ? "در حال اتصال..."
                : "قطع شده"}
            </span>
          </div>
        </div>

        {!isConnected && (
          <Button
            onClick={connect}
            disabled={isConnecting}
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 border-destructive/30 hover:bg-destructive/10 text-destructive cursor-pointer"
          >
            <RefreshCw className={`size-3 ${isConnecting ? "animate-spin" : ""}`} />
            تلاش مجدد
          </Button>
        )}
      </div>

      {/* Error Info Banner when disconnected */}
      {!isConnected && lastError && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-3 py-2 text-xs flex items-start gap-2 text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <div className="font-semibold flex items-center justify-between">
              <span>{lastError.title}</span>
              {lastError.code && (
                <span className="font-mono text-[11px] bg-destructive/20 px-1.5 py-0.5 rounded">
                  کد: {lastError.code}
                </span>
              )}
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed">{lastError.hint}</p>
            <p className="text-[10px] font-mono dir-ltr text-left opacity-70 truncate mt-1">
              {lastError.url}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="h-0 flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>هنوز پیامی ارسال نشده است</p>
              <p className="text-sm">اولین پیام را ارسال کنید!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.user_id === currentUser.id
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {message.user_id !== currentUser.id && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(message.first_name, message.last_name)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    message.user_id === currentUser.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.user_id !== currentUser.id && (
                    <div className="text-xs font-medium mb-1 opacity-70">
                      {message.first_name} {message.last_name}
                      {/* فقط برای پیام‌های دیگران (دانش‌آموزان) نمایش داده می‌شود */}
                      {" (دانش‌آموز)"}
                    </div>
                  )}
                  {message.user_id === currentUser.id && (
                    <div className="text-xs font-medium mb-1 opacity-70">
                      شما (معلم)
                    </div>
                  )}
                  <p className="text-sm">{message.message}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {formatTime(message.timestamp)}
                  </div>
                </div>

                {message.user_id === currentUser.id && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      معلم
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "پیام خود را بنویسید..." : "در انتظار برقراری اتصال..."}
            disabled={!isConnected}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {!isConnected && (
          <div className="flex items-center justify-between mt-2 pt-1 text-xs">
            <span className="text-destructive flex items-center gap-1.5">
              <WifiOff className="size-3.5" />
              اتصال با سرور چت قطع است.
            </span>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={connect}
              disabled={isConnecting}
              className="h-auto p-0 text-xs text-primary underline"
            >
              اتصال مجدد
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
