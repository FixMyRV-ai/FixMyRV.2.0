export interface Settings {
  key: string;
  chatModel: string;
  embeddingModel: string;
  outputTokens: number;
  systemPrompt: string;
}

export interface TwilioSettings {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface SettingsResponse {
  data: Settings;
  models: Model[];
}

export interface TwilioSettingsResponse {
  data: TwilioSettings;
}

export interface ErrorResponse {
  error: string;
  message?: string;
}
