export interface ContentData {
  message?: string;
  error?: string;
  content?: string;
  metadata?: {
    title?: string;
    description?: string;
    url?: string;
    images?: string[];
  };
}

export interface ContentScrapeRequest {
  url: string;
}

export interface ContentSaveRequest {
  content: string;
  metadata?: Record<string, unknown>;
}

export interface BaseResponse {
  message?: string;
  error?: string;
}

export interface ContentSaveResponse extends BaseResponse {
  data?: {
    message: string;
    similarDocs: unknown[];
  };
}

// API response types for Axios
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: unknown;
}

// Service return types
export type ScrapeContentResponse = ContentData;
export type SaveContentResponse = ContentSaveResponse;
export type UploadPdfResponse = ContentData;
export interface GetAllContentResponse extends BaseResponse {
  data?: ContentData[];
}

export interface ApiErrorResponse {
  message: string;
  error?: string;
}

export interface Source {
  id: string;
  type: "url" | "file" | "gdrive";
  path: string;
  googleDriveFileId?: string;
}

export interface ApiResponseWithPagination<T> {
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}
