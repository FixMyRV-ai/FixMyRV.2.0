import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import type { Message } from "../../types/chat";
import MessageBubble from "./messageBubble";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  streamingMessage: Message | null;
}

const ChatArea = ({
  messages,
  onSendMessage,
  streamingMessage,
}: ChatAreaProps) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change or streaming message updates
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full bg-white/50 dark:bg-gray-900/50">
      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6"
      >
        <div className="space-y-4 md:space-y-6 max-w-3xl mx-auto w-full">
          {messages.map((message) => (
            <MessageBubble key={message.id} content={message.content} createdAt={message.createdAt} is_bot={message.is_bot} />
          ))}
          {streamingMessage && (
            <MessageBubble
              key={streamingMessage.id}
              content={streamingMessage.content}
              createdAt={streamingMessage.createdAt}
              is_bot={streamingMessage.is_bot}
            />
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 p-4 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl shadow-sm"
              disabled={!!streamingMessage}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || !!streamingMessage}
              className="shrink-0 bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;
