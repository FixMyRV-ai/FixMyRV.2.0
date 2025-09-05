import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import authSlice from "@/store/slices/authSlice";
import { ChatHistoryItem } from "./ChatHistoryItem";
import chatService from "@/services/user/chat.service";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Helpers from "@/config/helpers";
import { Chat } from "@/types/chat";

interface ChatSidebarProps {
  isCollapsed: boolean;
}

const ChatSidebar = ({ isCollapsed }: ChatSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearUser } = authSlice();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingChat, setEditingChat] = useState<Chat | null>(null);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNewChat, setIsNewChat] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  // Fetch chats on component mount and when location changes
  useEffect(() => {
    fetchChats();
  }, []);

  // Additional polling when new chat is created
  useEffect(() => {
    if (location.pathname === "/chat/new") {
      setIsNewChat(true);
    } else if (location.pathname.startsWith("/chat/") && isNewChat) {
      // Only fetch once when navigating to a new chat
      fetchChats();
      setIsNewChat(false);
    }
  }, [location.pathname, isNewChat]);

  const fetchChats = async () => {
    try {
      setIsLoadingChats(true);
      const fetchedChats = await chatService.getAllChats();
      setChats(fetchedChats || []);
    } catch (error: unknown) {
      Helpers.toast("error", "Failed to fetch chats");
      console.error(error);
      setChats([]);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const handleLogout = () => {
    clearUser();
    navigate("/login");
  };

  const handleDelete = async (id: number) => {
    try {
      await chatService.deleteChat(id);
      Helpers.toast("success", "Chat deleted successfully");
      handleNewChat();
      fetchChats();
    } catch (error: unknown) {
      Helpers.toast("error", "Failed to delete chat");
      console.error(error);
    }
  };

  const handleEdit = (id: string) => {
    const chat = chats.find((c) => c.id === Number(id));
    if (chat) {
      setEditingChat(chat);
      setNewChatTitle(chat.title);
      setIsEditDialogOpen(true);
    }
  };

  const handleNewChat = () => {
    navigate("/chat/new");
  };

  const handleUpdateChatTitle = async () => {
    if (!editingChat || !newChatTitle.trim()) {
      Helpers.toast("error", "Please enter a chat title");
      return;
    }

    setIsLoading(true);
    try {
      const updatedChat = await chatService.updateChatTitle(
        editingChat.id,
        newChatTitle
      );
      setChats((prev) =>
        prev.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat))
      );
      setIsEditDialogOpen(false);
      setNewChatTitle("");
      setEditingChat(null);
      Helpers.toast("success", "Chat title updated successfully");
    } catch (error: unknown) {
      Helpers.toast("error", "Failed to update chat title");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? "80px" : "280px" }}
        transition={{ duration: 0.3 }}
        className="h-full relative border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 max-w-[100vw]"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          {!isCollapsed && (
            <div className="p-3 sm:p-4 flex justify-center border-b">
              <Link to="/" className="flex items-center gap-2">
                <div className="text-6xl font-bold">
                  <img
                    src="/assets/logo.png"
                    alt="logo"
                    className="w-24 sm:w-30 h-auto"
                  />
                </div>
              </Link>
            </div>
          )}

          {/* New Chat Button */}
          <div className="p-3 sm:p-4">
            <Button
              className={`w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all ${
                isCollapsed ? "px-0" : "px-3 sm:px-4"
              }`}
              onClick={handleNewChat}
            >
              <Plus className={`${isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-2"}`} />
              {!isCollapsed && "New Chat"}
            </Button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="space-y-1 px-2">
              {isLoadingChats ? (
                <div className="flex justify-center p-4">
                  <div className="animate-pulse text-muted-foreground">
                    Loading chats...
                  </div>
                </div>
              ) : (
                (chats || []).map((chat) => (
                  <ChatHistoryItem
                    key={chat?.id || Math.random()}
                    id={chat?.id?.toString() || ""}
                    title={chat?.title || "Untitled Chat"}
                    date={
                      chat?.createdAt
                        ? new Date(chat.createdAt).toLocaleDateString()
                        : ""
                    }
                    isCollapsed={isCollapsed}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t">
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className={`w-full text-destructive hover:text-destructive hover:bg-destructive/10 ${
                  isCollapsed
                    ? "justify-center px-2"
                    : "px-3 sm:px-4 justify-start"
                }`}
              >
                <LogOut className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">Log out</span>}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit Chat Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Reset state when dialog closes
            setNewChatTitle("");
            setEditingChat(null);
            // Small delay to ensure state is reset before dialog closes
            setTimeout(() => {
              setIsEditDialogOpen(false);
            }, 0);
          } else {
            setIsEditDialogOpen(true);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chat Title</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Chat Title</Label>
              <Input
                id="edit-name"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                placeholder="Enter new chat title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setNewChatTitle("");
                setEditingChat(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateChatTitle} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatSidebar;
