import BaseService from "../base.service";
import { AxiosError } from "axios";
import { Settings, SettingsResponse, ErrorResponse } from "@/types/setting";

class SettingServices extends BaseService {
  constructor() {
    super("/setting");
  }

  async getSettings(): Promise<SettingsResponse> {
    try {
      return await this.get("/");
    } catch (error: unknown) {
      console.error("Error fetching OpenAI settings:", error);
      const errorMessage =
        (error as AxiosError<ErrorResponse>)?.response?.data?.message ||
        (error as AxiosError<ErrorResponse>)?.response?.data?.error ||
        "Failed to fetch OpenAI settings";
      throw new Error(errorMessage);
    }
  }

  async updateSettings(settings: Settings) {
    try {
      await this.post("/", settings);
    } catch (error: unknown) {
      console.error("Error updating OpenAI settings:", error);
      const errorMessage =
        (error as AxiosError<ErrorResponse>)?.response?.data?.message ||
        (error as AxiosError<ErrorResponse>)?.response?.data?.error ||
        "Failed to update OpenAI settings";
      throw new Error(errorMessage);
    }
  }
}

export default new SettingServices();
