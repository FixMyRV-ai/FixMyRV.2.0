export interface Settings {
  key: string;
  chatModel: string;
  embeddingModel: string;
  outputTokens: number;
  systemPrompt: string;
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

export interface ErrorResponse {
  error: string;
  message?: string;
}
