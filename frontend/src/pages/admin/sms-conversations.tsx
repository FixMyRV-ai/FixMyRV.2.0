import { useState, useEffect } from "react";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Phone,
  User,
  Bot
} from "lucide-react";
import Helpers from "@/config/helpers";
import adminSMSService from "@/services/admin/sms.service";

interface SMSMessage {
  id: number;
  content: string;
  is_bot: boolean;
  createdAt: string;
  smsMessageSid?: string;
  smsBatchIndex?: number;
  smsBatchTotal?: number;
}

interface SMSChat {
  id: number;
  title: string;
  channel: 'sms';
  organizationUserId: number;
  createdAt: string;
  updatedAt: string;
  messages: SMSMessage[];
  organizationUser: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    organization: {
      name: string;
    };
  };
}

const SMSConversations = () => {
  const [smsChats, setSmsChats] = useState<SMSChat[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<SMSChat | null>(null);

  const fetchSMSChats = async () => {
    setLoading(true);
    try {
      // Fetch SMS conversations from admin API using service
      const data = await adminSMSService.getSMSChats();
      console.log('SMS Chats received:', data);
      setSmsChats(data);
    } catch (error) {
      console.error('Error fetching SMS chats:', error);
      Helpers.toast("error", "Failed to load SMS conversations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSMSChats();
  }, []);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">SMS Conversations</h1>
        <Badge variant="outline" className="ml-auto">
          {smsChats.length} conversations
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active SMS Chats</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading conversations...
                  </div>
                ) : smsChats.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No SMS conversations yet
                  </div>
                ) : (
                  smsChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedChat?.id === chat.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="space-y-1">
                        {/* Line 1: User Name + SMS Badge */}
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">
                            {chat.organizationUser ? 
                              `${chat.organizationUser.firstName} ${chat.organizationUser.lastName}` :
                              'Unknown User'
                            }
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            SMS
                          </Badge>
                        </div>
                        
                        {/* Line 2: Organization */}
                        <div className="text-sm text-muted-foreground">
                          {chat.organizationUser?.organization?.name || 'Unknown Organization'}
                        </div>
                        
                        {/* Line 3: Conversation Title */}
                        <div className="text-sm text-foreground">
                          {chat.title}
                        </div>
                        
                        {/* Line 4: Phone + Last Message Date */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 truncate">
                            📞 {chat.organizationUser?.phone || 'No phone'}
                          </span>
                          <span className="flex-shrink-0">
                            {formatTime(chat.updatedAt).split(',')[0]}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              {selectedChat ? (
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {selectedChat.organizationUser ? 
                      `${selectedChat.organizationUser.firstName} ${selectedChat.organizationUser.lastName}` :
                      'Unknown User'
                    }
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {selectedChat.organizationUser?.phone ? 
                        formatPhone(selectedChat.organizationUser.phone) : 
                        'No phone'
                      }
                    </span>
                    <span>
                      {selectedChat.organizationUser?.organization?.name || 'No organization'}
                    </span>
                  </div>
                </div>
              ) : (
                <CardTitle className="text-lg">Select a conversation</CardTitle>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {selectedChat ? (
                <ScrollArea className="h-[600px] p-4">
                  <div className="space-y-4">
                    {selectedChat.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.is_bot ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-3 py-2 ${
                            message.is_bot
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          <div className="flex items-start gap-2 mb-1">
                            {message.is_bot ? (
                              <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            ) : (
                              <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                                <span>{formatTime(message.createdAt)}</span>
                                {message.smsBatchIndex && (
                                  <span>
                                    Part {message.smsBatchIndex}/{message.smsBatchTotal}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to view messages</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SMSConversations;
