import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
  isLoading?: boolean;
  className?: string;
  message?: string;
  setMessage?: (message: string) => void;
}

const ChatInput = ({ onSendMessage, className, message = "", setMessage, isLoading }: ChatInputProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      if (setMessage) {
        setMessage("");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="relative px-2 py-2 max-w-3xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className={cn("w-full", className)}
      >

        <div className="max-w-3xl relative flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage ? setMessage(e.target.value) : null}
              onKeyDown={handleKeyDown}
              placeholder="Message with Fix My RV BOT..."
              className="min-h-[48px] max-h-[120px] w-full resize-y py-3 px-4 bg-background/70 border-border/40 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-0 shadow-sm transition-all"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-4 bottom-2 self-center h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 shadow-md transition-colors"
              disabled={!message.trim() || isLoading}
            >
              <Send className="h-4 w-4 text-primary-foreground" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;