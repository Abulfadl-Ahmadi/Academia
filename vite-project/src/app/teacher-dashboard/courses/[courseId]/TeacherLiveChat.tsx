import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../../../../context/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

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

export default function TeacherLiveChat({ courseId }: TeacherLiveChatProps) {
  const { user: currentUser } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const scrollViewport = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]');
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
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect to Django backend (port 8000), not Vite dev server
    const wsUrl = `${wsProtocol}//192.168.1.7:8000/ws/chat/${courseId}/`;

    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log('Teacher WebSocket connected');
      setIsConnected(true);
      toast.success('به چت زنده متصل شدید');
    };

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'last_50_messages') {
        setMessages(data.messages);
        scrollToBottom();
      } else if (data.type === 'chat_message') {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    };

    newSocket.onclose = () => {
      console.log('Teacher WebSocket disconnected');
      setIsConnected(false);
      toast.error('اتصال چت قطع شد');
    };

    newSocket.onerror = (error) => {
      console.log('Teacher WebSocket error:', error);
      setIsConnected(false);
      toast.error('خطا در اتصال چت');
    };

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [courseId, scrollToBottom]);

  const sendMessage = () => {
    if (newMessage.trim() && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        'message': newMessage.trim()
      }));
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
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
    <div className="flex flex-col h-[600px] border rounded-lg">
      {/* Header */}
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-semibold">چت زنده کلاس</h3>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'متصل' : 'قطع شده'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          شما به عنوان معلم می‌توانید با دانش‌آموزان چت کنید
        </p>
      </div>

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
                  message.user_id === currentUser.id ? 'justify-end' : 'justify-start'
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
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.user_id !== currentUser.id && (
                    <div className="text-xs font-medium mb-1 opacity-70">
                      {message.first_name} {message.last_name}
                      {/* فقط برای پیام‌های دیگران (دانش‌آموزان) نمایش داده می‌شود */}
                      {' (دانش‌آموز)'}
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
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="پیام خود را بنویسید..."
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
          <p className="text-xs text-red-500 mt-1">
            اتصال چت قطع شده است. صفحه را رفرش کنید.
          </p>
        )}
      </div>
    </div>
  );
}