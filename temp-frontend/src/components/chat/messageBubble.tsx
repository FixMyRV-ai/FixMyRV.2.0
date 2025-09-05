import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import ChatGPTFormatter from "./chatgptFormatter";

interface MessageBubbleProps {
  content: string;
  createdAt: Date | undefined;
  is_bot: boolean;
  userAvatar?: string;
}

const MessageBubble = ({
  content,
  createdAt,
  is_bot,
  userAvatar,
}: MessageBubbleProps) => {
  // Format timestamp to locale string
  const formattedTimestamp = createdAt
    ? new Date(createdAt).toLocaleString()
    : "";

  const getIcon = () => {
    if (!is_bot) {
      return (
        <Avatar className="h-8 w-8 border border-border/50">
          <AvatarImage src={userAvatar} />
          <AvatarFallback className="bg-primary/5">
            <User className="h-5 w-5 text-primary" />
          </AvatarFallback>
        </Avatar>
      );
    }
    return (
      <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center">
        <Bot className="h-5 w-5 text-primary" />
      </div>
    );
  };

  const getBubbleStyle = () => {
    return is_bot
      ? "bg-muted rounded-tl-sm shadow-sm border border-border/10"
      : "bg-primary text-primary-foreground rounded-tr-sm shadow-sm";
  };

  return (
    <div className="group relative">
      <div
        className={cn(
          "flex items-start gap-3",
          !is_bot ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">{getIcon()}</div>

        {/* Message Content */}
        <div
          className={cn(
            "relative rounded-2xl px-4 py-3",
            "w-full sm:w-auto sm:max-w-[80%] md:max-w-[70%]", // Responsive width constraints
            "break-words overflow-hidden", // Prevent overflow
            getBubbleStyle()
          )}
        >
          <div className="whitespace-pre-wrap">
            {is_bot ? (
              <>
                <div className="prose dark:prose-invert prose-sm max-w-none">
                  <ChatGPTFormatter
                    response={content}
                    writing={false}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="prose dark:prose-invert prose-sm max-w-none">                  
                  {content}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Timestamp (appears on hover) */}
        <span
          className={cn(
            "absolute -bottom-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity",
            is_bot ? "left-12" : "right-12",
            "text-muted-foreground whitespace-nowrap"
          )}
        >
          {formattedTimestamp}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
