import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../../../../context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
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

interface LiveChatProps {
  courseId: string;
}

export default function LiveChat({ courseId }: LiveChatProps) {
  const { user: currentUser } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Dynamic WebSocket URL based on current host
    const wsHost = window.location.hostname;
    const wsPort = window.location.protocol === "https:" ? "" : ":8000";
    const wsUrl = `${wsProtocol}//${wsHost}${wsPort}/ws/chat/${courseId}/`;
    
    console.log("Connecting to WebSocket:", wsUrl); // برای debug

    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log("WebSocket connected");
      toast.success("به چت زنده متصل شدید");
    };

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "last_50_messages") {
        setMessages(data.messages);
        scrollToBottom();
      } else if (data.type === "chat_message") {
        setMessages((prevMessages) => [...prevMessages, data.message]);
        scrollToBottom();
      }
    };

    newSocket.onclose = () => {
      console.log("WebSocket disconnected");
      toast.error("اتصال با چت زنده قطع شد. لطفاً صفحه را رفرش کنید.");
    };

    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast.error("خطا در اتصال به چت زنده");
    };

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [courseId, scrollToBottom]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ message: newMessage }));
      setNewMessage("");
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName ? firstName[0] : "";
    const last = lastName ? lastName[0] : "";
    return `${first}${last}`.toUpperCase();
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="h-0 flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.user_id === currentUser?.id ? "flex-row-reverse" : ""
              }`}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={`/path/to/avatars/${msg.user_id}.png`} />
                <AvatarFallback className="text-xs">
                  {getInitials(msg.first_name, msg.last_name)}
                </AvatarFallback>
              </Avatar>
              <div
                className={`rounded-lg p-3 max-w-xs lg:max-w-md ${
                  msg.user_id === currentUser?.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm font-bold mb-1">
                  {msg.first_name} {msg.last_name}
                </p>
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs opacity-70 mt-1 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString("fa-IR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="پیام خود را بنویسید..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
