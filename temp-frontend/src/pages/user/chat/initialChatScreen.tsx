import ChatInput from "@/components/chat/chatInput";
import MessageBubble from "@/components/chat/messageBubble";
import { Button } from "@/components/ui/button";
import Helpers from "@/config/helpers";
import { useChatHeader } from "@/contexts/ChatHeaderContext";
import chatService from "@/services/user/chat.service";
import openaiService from "@/services/user/openai.service";
import { Message } from "@/types/chat";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const ChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isNewChat = location.pathname === "/chat/new";
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<Message | null>(null);
  const { headerRef } = useChatHeader();
  
  // Use a ref to track the current streamingId
  const streamingIdRef = useRef<number | null>(null);

  // Clear messages when switching to new chat
  useEffect(() => {
    if (isNewChat) {
      setMessages([]);
      setCurrentStreamingMessage(null);
      streamingIdRef.current = null;
    }
  }, [isNewChat]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 100;
    setShowScrollButton(!isBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  interface UserState {
    state: {
      credits: number;
    };
  }
  
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    const state: UserState = JSON.parse(localStorage.getItem("user") || "{}");
    const credits = state?.state?.credits;
    if (credits <= 0) {
      Helpers.toast("error", "Insufficient credits");
      navigate("/upgrade");
      return;
    }

    setIsLoading(true);
    setInputMessage(""); // Clear input after sending

    try {
      // Generate a unique ID for this message exchange
      const messageExchangeId = Date.now();
      streamingIdRef.current = messageExchangeId;
      
      let chatId = id ? Number(id) : null;
      
      // For new chat, create a new chat first
      if (isNewChat) {
        const newChat = await chatService.createChat(content);
        chatId = newChat.id;
        // Update URL without refreshing the page
        navigate(`/chat/${chatId}`, { replace: true });
      }
      
      if (!chatId) {
        throw new Error("Failed to determine chat ID");
      }

      // Add user message
      const userMessage: Message = {
        chatId: chatId,
        content,
        is_bot: false,
        timestamp: new Date(),
      };

      // Add the user message to messages state
      setMessages(prevMessages => [...prevMessages, userMessage]);

      // Initialize AI message for streaming with empty content
      const aiMessage: Message = {
        chatId: chatId,
        content: "",
        is_bot: true,
        timestamp: new Date(),
      };
      
      // Set the streaming message
      setCurrentStreamingMessage(aiMessage);
      
      let accumulatedContent = "";

      // Get AI response with streaming
      await openaiService.chat(
        { message: content, chatId: chatId },
        (chunk) => {
          // Only update if this is still the current streaming message
          if (streamingIdRef.current === messageExchangeId) {
            accumulatedContent += chunk;
            
            setCurrentStreamingMessage(prev => {
              if (!prev) return null;
              return {
                ...prev,
                content: accumulatedContent
              };
            });
          }
        },
        () => {
          // Only finalize if this is still the current streaming message
          if (streamingIdRef.current === messageExchangeId) {
            // Reset streaming ID first
            streamingIdRef.current = null;
            
            // Create finalized message
            const finalMessage = {
              chatId: chatId,
              content: accumulatedContent,
              is_bot: true,
              timestamp: new Date()
            };
            
            // Update messages array with finalized message and clear streaming
            setMessages(prev => [...prev, finalMessage]);
            setCurrentStreamingMessage(null);
            
            // Update credits
            headerRef.current?.fetchCredits();
          }
        }
      );
      
      // Scroll to bottom after sending message
      scrollToBottom();
    } catch (error) {
      Helpers.toast("error", "Failed to get response. Please try again.");
      console.error("Chat error:", error);
      
      // Reset streaming state
      streamingIdRef.current = null;
      setCurrentStreamingMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset streaming state if component unmounts
  useEffect(() => {
    return () => {
      streamingIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Separate effect for streaming message updates
  useEffect(() => {
    if (currentStreamingMessage) {
      scrollToBottom();
    }
  }, [currentStreamingMessage?.content]);

  const fetchMessages = useCallback(async () => {
    if (!id || isNewChat) return;
    
    setIsLoadingMessages(true);
    try {
      const fetchedMessages = await chatService.getChatMessages(Number(id));
      setMessages(fetchedMessages || []);
      headerRef.current?.fetchCredits();
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [id, isNewChat, headerRef]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Add mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="relative flex flex-col h-full">
      <main
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-2 sm:p-4"
        onScroll={handleScroll}
      >
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto space-y-4 sm:space-y-6 overflow-hidden"
          >
            {isLoadingMessages ? (
              <div className="flex justify-center">
                <div className="animate-pulse text-muted-foreground">
                  Loading messages...
                </div>
              </div>
            ) : (
              <>
                {/* Display all regular messages */}
                {messages.map((message, index) => (
                  <MessageBubble
                    key={`msg-${index}-${message.timestamp?.toString()}`}
                    content={message.content as string}
                    is_bot={message.is_bot}
                    createdAt={message?.createdAt}
                  />
                ))}
                
                {/* Display streaming message only if we're currently streaming */}
                {currentStreamingMessage && streamingIdRef.current !== null && (
                  <MessageBubble
                    key={`streaming-${streamingIdRef.current}`}
                    content={currentStreamingMessage.content}
                    is_bot={currentStreamingMessage.is_bot}
                    createdAt={currentStreamingMessage.createdAt}
                  />
                )}
                
                {/* Loading indicator */}
                {isLoading && !currentStreamingMessage && (
                  <div className="flex justify-center">
                    <div className="animate-pulse text-muted-foreground">
                      AI is thinking...
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </motion.div>
        </AnimatePresence>
      </main>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky bottom-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/20"
      >
        <div className={`mx-auto p-2 ${isMobile ? "max-w-md" : "max-w-2xl"}`}>
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            message={inputMessage}
            setMessage={setInputMessage}
          />
        </div>
      </motion.div>

      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-8 h-10 w-10 rounded-full bg-primary/90 hover:bg-primary p-0 shadow-lg"
          size="icon"
        >
          <ChevronDown className="h-5 w-5 text-primary-foreground" />
        </Button>
      )}
    </div>
  );
};

export default ChatPage;