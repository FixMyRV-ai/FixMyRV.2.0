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
import { Settings, Model, ErrorResponse } from "@/types/setting";
import { Loader2 } from "lucide-react";
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
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

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

  useEffect(() => {
    fetchSettings();
  }, []);

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

  const handleChange = (field: keyof Settings, value: string | number) => {
    setSettings((prev) => ({
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
  );
};

export default Setting;
