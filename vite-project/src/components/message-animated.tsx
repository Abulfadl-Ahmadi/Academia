import { Bot, UserRound } from "lucide-react";
import MathRenderer from "@/components/ui/math-renderer-optimized";
import { MessageScrollerItem } from "@/components/ui/message-scroller";

interface MessageAnimatedProps {
  message: { id: string; role: string; content: string; [key: string]: any };
  scrollAnchor?: boolean;
}

export function MessageAnimated({ message, scrollAnchor }: MessageAnimatedProps) {
  return (
    <MessageScrollerItem
      messageId={message.id}
      scrollAnchor={scrollAnchor}
      className={`flex w-full ${message.role === 'user' ? 'justify-start' : 'justify-end'} mb-6`}
    >
      <div className="flex gap-3 max-w-[90%] sm:max-w-[80%]">
        {message.role !== 'user' && (
          <div className="h-8 w-8 shrink-0 mt-0.5 shadow-sm border border-primary/10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <Bot size={16} />
          </div>
        )}
        
        <div className={`
          flex flex-col gap-1.5 w-full
          ${message.role === 'user' ? 'items-start' : 'items-end'}
        `}>
          <div className={`
            px-4 py-3 rounded-2xl text-[14px] sm:text-[15px] leading-relaxed shadow-sm
            ${message.role === 'user' 
              ? 'bg-primary text-primary-foreground rounded-tr-sm' 
              : 'bg-background text-foreground border border-border/60 rounded-tl-sm'}
          `}>
            {message.role === 'user' ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <MathRenderer content={message.content} />
            )}
          </div>
        </div>

        {message.role === 'user' && (
          <div className="h-8 w-8 shrink-0 mt-0.5 shadow-sm bg-primary text-primary-foreground rounded-full flex items-center justify-center">
            <UserRound size={16} />
          </div>
        )}
      </div>
    </MessageScrollerItem>
  );
}
