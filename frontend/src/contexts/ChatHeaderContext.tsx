import { createContext, useContext } from "react";
import { ChatHeaderRef } from "@/components/chat/chatHeader";

export const ChatHeaderContext = createContext<{
  headerRef: React.MutableRefObject<ChatHeaderRef | null>;
}>({
  headerRef: { current: null },
});

export const useChatHeader = () => useContext(ChatHeaderContext);
