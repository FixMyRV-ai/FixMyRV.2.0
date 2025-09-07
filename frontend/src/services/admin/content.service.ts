import BaseService from "../base.service";
import {
  ContentSaveRequest,
  ScrapeContentResponse,
  SaveContentResponse,
  UploadPdfResponse,
  GetAllContentResponse,
  ApiResponse,
} from "@/types/content";
import {
  GoogleDriveAuthResponse,
  GoogleDriveFilesResponse,
  UploadFromGoogleDriveResponse,
  BulkUploadFromGoogleDriveResponse,
} from "@/types/content.d";
import Helpers from "@/config/helpers";
import { User } from "@/types/auth";

interface UserState {
  user: User | null;
  state: {
    token: string | null;
  };
}

class ContentService extends BaseService {
  constructor() {
    super("/content");
  }

  scrapeContent = async (url: string): Promise<ScrapeContentResponse> => {
    return await this.post("/scrape", {
      url,
    });
  };

  saveContent = async (
    data: ContentSaveRequest
  ): Promise<SaveContentResponse> => {
    const response: ApiResponse<SaveContentResponse> = await this.post(
      "/save",
      data
    );
    return response.data;
  };

  uploadPdf = async (file: File): Promise<UploadPdfResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const headers = Helpers.authFileHeaders().headers;
    const state: UserState = JSON.parse(localStorage.getItem("user") || "{}");
    const token = state?.state?.token;

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(this.url("/upload-pdf"), {
        method: "POST",
        headers: {
          Authorization: headers.Authorization,
        },
        body: formData,
      });

      const data: UploadPdfResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload PDF");
      }

      return data;
    } catch (error) {
      console.error("PDF upload error:", error);
      throw error;
    }
  };

  allSources = async (params: { page: number; limit: number }) => {
    const { page, limit } = params;
    try {
      const response: ApiResponse<GetAllContentResponse> = await this.get(
        `/all-sources?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching all sources:", error);
      throw new Error("Failed to fetch all sources");
    }
  };

  deleteSource = async (sourceId: string): Promise<void> => {
    try {
      await this.post("/delete-source", { source_id: sourceId });
    } catch (error) {
      console.error("Error deleting source:", error);
      throw new Error("Failed to delete source");
    }
  };

  bulkDeleteSources = async (sourceIds: string[]): Promise<void> => {
    try {
      await this.post("/bulk-delete-sources", { source_ids: sourceIds });
    } catch (error) {
      console.error("Error deleting sources:", error);
      throw new Error("Failed to delete sources");
    }
  };

  // Google Drive integration methods
  authorizeGoogleDrive = async (): Promise<GoogleDriveAuthResponse> => {
    try {
      const response = (await this.get(
        "/google-drive/authorize"
      )) as ApiResponse<GoogleDriveAuthResponse>;
      if (!response || !response.data) {
        throw new Error("Invalid response from server");
      }
      return response.data;
    } catch (error) {
      console.error("Error authorizing Google Drive:", error);
      throw error;
    }
  };

  getGoogleDriveFiles = async (
    folderId?: string
  ): Promise<GoogleDriveFilesResponse> => {
    try {
      const response = (await this.get(
        `/google-drive/files${folderId ? `?folderId=${folderId}` : ""}`
      )) as ApiResponse<GoogleDriveFilesResponse>;
      if (!response || !response.data) {
        throw new Error("Invalid response from server");
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching Google Drive files:", error);
      throw error;
    }
  };

  uploadFromGoogleDrive = async (
    fileId: string,
    fileName: string
  ): Promise<UploadFromGoogleDriveResponse> => {
    try {
      const response = (await this.post("/google-drive/upload", {
        fileId,
        fileName,
      })) as ApiResponse<UploadFromGoogleDriveResponse>;
      if (!response || !response.data) {
        throw new Error("Invalid response from server");
      }
      return response.data;
    } catch (error) {
      console.error("Error uploading from Google Drive:", error);
      throw error;
    }
  };

  bulkUploadFromGoogleDrive = async (
    files: { fileId: string; fileName: string }[]
  ): Promise<BulkUploadFromGoogleDriveResponse> => {
    const response: ApiResponse<BulkUploadFromGoogleDriveResponse> =
      await this.post("/google-drive/bulk-upload", {
        files,
      });
    return response.data;
  };
}

export default new ContentService();
