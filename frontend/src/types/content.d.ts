export interface ContentData {
  message?: string;
  error?: string;
}

export interface Source {
  id: string;
  type: "url" | "file" | "gdrive"; // Updated to include gdrive type
  path: string;
  createdAt?: string;
  updatedAt?: string;
  googleDriveFileId?: string;
}

export interface ApiResponseWithPagination<T> {
  message: string;
  data: T;
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface ApiErrorResponse {
  error: string;
}

export interface GoogleDriveItem {
  id: string;
  name: string;
  mimeType: string;
  owners: Array<{
    emailAddress: string;
    displayName: string;
  }>;
  shared: boolean;
  createdTime: string;
  modifiedTime: string;
  size?: string;
  webViewLink: string;
  parents?: string[];
  isOwner: boolean;
  isShared: boolean;
  isFolder: boolean;
  isUploaded: boolean;
}

export interface GoogleDriveFilesResponse {
  message: string;
  items: GoogleDriveItem[];
  total: number;
}

export interface GoogleDriveAuthResponse {
  message: string;
  data: {
    authorized: boolean;
  };
}

export interface UploadFromGoogleDriveResponse {
  message: string;
  id: string;
  path: string;
  createdAt: string;
}

export interface GitHubCallbackResponse {
  message: string;
  error?: string;
}

export interface UploadedFile {
  id: string;
  path: string;
  createdAt: string;
}

export interface SourceContent {
  id: string;
  path: string;
  createdAt: string;
  googleDriveFileId?: string;
}

export interface ErrorResponseData {
  error: string;
  data?: {
    id: string;
    path: string;
    createdAt: string;
  };
}

export interface BulkUploadFromGoogleDriveResponse {
  total: number;
  successful: number;
  skipped: number;
  failed: number;
  results: Array<{
    fileId: string;
    status: "success" | "error" | "skipped";
    message?: string;
    data?: {
      id: string;
      path: string;
      createdAt: string;
    };
  }>;
}
