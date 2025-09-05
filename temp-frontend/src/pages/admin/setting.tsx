import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Helpers from "@/config/helpers";
import settingService from "@/services/admin/setting.service";
import twilioService, { TwilioLogEntry } from "@/services/admin/twilio.service";
import { Settings, Model, TwilioSettings, ErrorResponse } from "@/types/setting";
import { Loader2, Settings as SettingsIcon, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { AxiosError } from "axios";

const Setting = () => {
  const [settings, setSettings] = useState<Settings>({
    key: "",
    chatModel: "",
    embeddingModel: "",
    outputTokens: 0,
    systemPrompt: "",
  });
  const [twilioSettings, setTwilioSettings] = useState<TwilioSettings>({
    accountSid: "",
    authToken: "",
    phoneNumber: "",
    optinMessage: "",
  });
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [twilioUpdateLoading, setTwilioUpdateLoading] = useState(false);
  const [optinMessageUpdateLoading, setOptinMessageUpdateLoading] = useState(false);
  // @ts-ignore - Preserved for future toggle functionality
  const [showTwilioLogs, setShowTwilioLogs] = useState(false); // Default to settings for easier API access
  const [twilioLogs, setTwilioLogs] = useState<TwilioLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingService.getSettings();
      setSettings(response.data);
      setModels(response.models);
    } catch (error: unknown) {
      const errorMessage =
        (error as AxiosError<ErrorResponse>)?.response?.data?.message ||
        (error as AxiosError<ErrorResponse>)?.response?.data?.error ||
        (error as Error)?.message ||
        "Failed to fetch settings";
      Helpers.toast("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchTwilioSettings = async () => {
    try {
      const response = await settingService.getTwilioSettings();
      setTwilioSettings(response.data);
    } catch (error: unknown) {
      // If Twilio settings don't exist yet, that's okay - just use defaults
      console.log("Twilio settings not found, using defaults");
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchTwilioSettings();
  }, []);

  // Real-time log polling when logs view is active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (showTwilioLogs) {
      // Fetch logs immediately when switching to logs view
      fetchTwilioLogs();
      
      // Set up polling every 5 seconds
      interval = setInterval(fetchTwilioLogs, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [showTwilioLogs]);

  const handleUpdate = async () => {
    try {
      setUpdateLoading(true);
      await settingService.updateSettings(settings);
      Helpers.toast("success", "Settings updated successfully");
      fetchSettings();
    } catch (error: unknown) {
      console.error("Failed to update settings:", error);
      const errorMessage =
        (error as AxiosError<ErrorResponse>)?.response?.data?.message ||
        (error as AxiosError<ErrorResponse>)?.response?.data?.error ||
        (error as Error)?.message ||
        "Failed to update settings";
      Helpers.toast("error", errorMessage);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleTwilioUpdate = async () => {
    try {
      setTwilioUpdateLoading(true);
      await settingService.updateTwilioSettings(twilioSettings);
      Helpers.toast("success", "Twilio settings updated successfully");
      fetchTwilioSettings();
    } catch (error: unknown) {
      console.error("Failed to update Twilio settings:", error);
      const errorMessage =
        (error as AxiosError<ErrorResponse>)?.response?.data?.message ||
        (error as AxiosError<ErrorResponse>)?.response?.data?.error ||
        (error as Error)?.message ||
        "Failed to update Twilio settings";
      Helpers.toast("error", errorMessage);
    } finally {
      setTwilioUpdateLoading(false);
    }
  };

  const handleOptinMessageUpdate = async () => {
    try {
      setOptinMessageUpdateLoading(true);
      await settingService.updateTwilioOptinMessage(twilioSettings.optinMessage);
      Helpers.toast("success", "Twilio Opt-In message updated successfully");
      fetchTwilioSettings();
    } catch (error: unknown) {
      console.error("Failed to update Twilio Opt-In message:", error);
      const errorMessage =
        (error as AxiosError<ErrorResponse>)?.response?.data?.message ||
        (error as AxiosError<ErrorResponse>)?.response?.data?.error ||
        (error as Error)?.message ||
        "Failed to update Twilio Opt-In message";
      Helpers.toast("error", errorMessage);
    } finally {
      setOptinMessageUpdateLoading(false);
    }
  };

  const handleChange = (field: keyof Settings, value: string | number) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const fetchTwilioLogs = async () => {
    try {
      setLogsLoading(true);
      const logs = await twilioService.getRecentLogs(50);
      setTwilioLogs(logs);
    } catch (error: unknown) {
      console.error("Failed to fetch Twilio logs:", error);
      // Don't show error toast for logs - it's not critical
    } finally {
      setLogsLoading(false);
    }
  };

  const formatLogEntry = (log: TwilioLogEntry): string => {
    const timestamp = new Date(log.createdAt).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const messagePreview = log.messageBody.length > 50 
      ? `${log.messageBody.substring(0, 50)}...` 
      : log.messageBody;
    
    const testFlag = log.isTestMessage ? '[TEST]' : '[REAL]';
    const statusFlag = log.status.toUpperCase();
    
    return `[${timestamp}] ${log.fromNumber} → ${log.toNumber}: ${messagePreview} ${testFlag} ${statusFlag}`;
  };

  const handleTwilioChange = (field: keyof TwilioSettings, value: string) => {
    setTwilioSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Twilio Settings Card */}
      <Card className="bg-card w-full mx-auto shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-foreground">
              {showTwilioLogs ? "Twilio Logs" : "Twilio Settings"}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTwilioLogs(!showTwilioLogs)}
              className="h-8 w-8 p-0"
              title={showTwilioLogs ? "View Settings" : "View Logs"}
            >
              {showTwilioLogs ? (
                <SettingsIcon className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showTwilioLogs ? (
            // Terminal-style Twilio Logs Viewer
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {logsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <div className="text-sm text-muted-foreground">
                  Real-time • Updates every 5s • Last {twilioLogs.length} messages
                </div>
              </div>
              
              {/* Terminal-style log container */}
              <div className="bg-gray-100 text-gray-700 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto border">
                {twilioLogs.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    {logsLoading ? "Loading logs..." : "No logs found. Test the webhook to see messages appear here."}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {twilioLogs.map((log) => {
                      const logLine = formatLogEntry(log);
                      const lineColor = log.status === 'error' || log.status === 'failed' 
                        ? 'text-red-600' 
                        : log.isTestMessage 
                        ? 'text-yellow-600' 
                        : 'text-green-700';
                      
                      return (
                        <div 
                          key={log.id} 
                          className={`${lineColor} hover:bg-gray-200 px-2 py-1 rounded cursor-pointer transition-colors`}
                          title={`Full message: ${log.messageBody}\nProcessing time: ${log.processingTimeMs || 'N/A'}ms\nMessage SID: ${log.messageSid}`}
                        >
                          {logLine}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Log controls */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Real Messages</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span>Test Messages</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>Errors</span>
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchTwilioLogs}
                  disabled={logsLoading}
                >
                  {logsLoading ? "Refreshing..." : "Refresh Now"}
                </Button>
              </div>
            </div>
          ) : (
            // Twilio Settings Form - Fully preserved for future re-enabling
            <div className="space-y-4">
            <div>
              <label htmlFor="twilioAccountSid" className="block text-sm font-medium">
                Account SID
              </label>
              <Input
                id="twilioAccountSid"
                type="text"
                value={twilioSettings.accountSid}
                onChange={(e) => handleTwilioChange("accountSid", e.target.value)}
                placeholder="Enter your Twilio Account SID"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="twilioAuthToken" className="block text-sm font-medium">
                Auth Token
              </label>
              <Input
                id="twilioAuthToken"
                type="password"
                value={twilioSettings.authToken}
                onChange={(e) => handleTwilioChange("authToken", e.target.value)}
                placeholder="Enter your Twilio Auth Token"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="twilioPhoneNumber" className="block text-sm font-medium">
                Phone Number
              </label>
              <Input
                id="twilioPhoneNumber"
                type="text"
                value={twilioSettings.phoneNumber}
                onChange={(e) => handleTwilioChange("phoneNumber", e.target.value)}
                placeholder="Enter your Twilio Phone Number (e.g., +1234567890)"
                disabled={loading}
              />
            </div>
            <Button onClick={handleTwilioUpdate} disabled={loading || twilioUpdateLoading}>
              {twilioUpdateLoading ? "Updating..." : "Update Twilio Settings"}
            </Button>

            {/* Opt-In Message Section */}
            <div className="mt-6 pt-6 border-t border-border">
              <div>
                <label htmlFor="twilioOptinMessage" className="block text-sm font-medium mb-2">
                  Opt-In Message
                </label>
                <Textarea
                  id="twilioOptinMessage"
                  rows={7}
                  value={twilioSettings.optinMessage}
                  onChange={(e) => {
                    const message = e.target.value;
                    if (message.length <= 320) {
                      handleTwilioChange("optinMessage", message);
                    }
                  }}
                  placeholder="Enter your SMS Opt-In message..."
                  disabled={loading}
                  className="resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">
                    {twilioSettings.optinMessage.length}/320 characters
                  </span>
                  {twilioSettings.optinMessage.length > 320 && (
                    <span className="text-sm text-destructive">
                      Message too long
                    </span>
                  )}
                </div>
              </div>
              <Button 
                onClick={handleOptinMessageUpdate} 
                disabled={loading || optinMessageUpdateLoading || twilioSettings.optinMessage.length > 320}
                className="mt-4"
              >
                {optinMessageUpdateLoading ? "Updating..." : "Update Opt-In Message"}
              </Button>
            </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OpenAI Settings Card */}
      <Card className="bg-card w-full mx-auto shadow-md">
        <CardHeader>
          <CardTitle className="text-card-foreground">OpenAI Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="key" className="block text-sm font-medium">
                OpenAI API Key
              </label>
              <Input
                id="key"
                type="text"
                value={settings.key}
                onChange={(e) => handleChange("key", e.target.value)}
                placeholder="Enter your OpenAI API key"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="chatModel" className="block text-sm font-medium">
                Chat Model
              </label>
              <Select
                value={settings.chatModel}
                onValueChange={(value) => handleChange("chatModel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a chat model" />
                </SelectTrigger>
                <SelectContent className="w-96">
                  {models.map((model) => (
                    <SelectItem className="w-96" key={model.id} value={model.id}>
                      {model.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="embeddingModel"
                className="block text-sm font-medium"
              >
                Embedding Model
              </label>
              <Select
                value={settings.embeddingModel}
                onValueChange={(value) => handleChange("embeddingModel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a Embedding model" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="outputTokens" className="block text-sm font-medium">
                Output Tokens
              </label>
              <Input
                id="outputTokens"
                type="number"
                value={settings.outputTokens}
                onChange={(e) =>
                  handleChange("outputTokens", parseInt(e.target.value))
                }
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="systemPrompt" className="block text-sm font-medium">
                System Prompt
              </label>
              <Textarea
                id="systemPrompt"
                value={settings.systemPrompt}
                onChange={(e) => handleChange("systemPrompt", e.target.value)}
                placeholder="Enter your system prompt"
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                This prompt will be used to guide the AI's behavior.
              </p>
            </div>
            <Button onClick={handleUpdate} disabled={loading || updateLoading}>
              {updateLoading ? "Updating..." : "Update Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Setting;
