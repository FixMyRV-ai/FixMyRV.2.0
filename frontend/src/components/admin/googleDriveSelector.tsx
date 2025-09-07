import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Folder, File, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import contentService from "@/services/admin/content.service";
import {
  GoogleDriveItem,
  BulkUploadFromGoogleDriveResponse,
} from "@/types/content.d";
import Helpers from "@/config/helpers";
import { AxiosError } from "axios";

interface GoogleDriveSelectorProps {
  onFileSelect?: (file: GoogleDriveItem) => void;
  onFileUploadComplete?: () => void;
}

const GoogleDriveSelector = ({
  onFileSelect,
  onFileUploadComplete,
}: GoogleDriveSelectorProps) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [driveItems, setDriveItems] = useState<GoogleDriveItem[]>([]);
  const [uploadingFileIds, setUploadingFileIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      setError(null);
      const response = await contentService.getGoogleDriveFiles();
      if (response && response.items) {
        setIsAuthorized(true);
        setDriveItems(response.items);
      } else {
        setIsAuthorized(false);
        setDriveItems([]);
      }
    } catch (error) {
      console.error("Error checking Google Drive authorization:", error);
      setIsAuthorized(false);
      setDriveItems([]);
      setError("Failed to connect to Google Drive. Please try again.");
    }
  };

  const handleAuthorize = async () => {
    try {
      setIsLoading(true);
      const response = await contentService.authorizeGoogleDrive();
      if (response && response.data.authorized) {
        setIsAuthorized(true);
        // Fetch files after successful authorization
        const filesResponse = await contentService.getGoogleDriveFiles();
        if (filesResponse && filesResponse.items) {
          setDriveItems(filesResponse.items);
        }
      } else {
        setIsAuthorized(false);
        setDriveItems([]);
      }
    } catch (error) {
      console.error("Error initiating Google Drive authorization:", error);
      setIsAuthorized(false);
      setDriveItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = async (folderId: string, folderName: string) => {
    try {
      setError(null);
      setFolderPath([...folderPath, { id: folderId, name: folderName }]);

      const response = await contentService.getGoogleDriveFiles(folderId);
      if (response && response.items) {
        setDriveItems(response.items);
      }
    } catch (error) {
      setError("Failed to load folder contents");
      console.error("Error loading folder:", error);
    }
  };

  const handleNavigateUp = async () => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);

      const parentFolderId =
        newPath.length > 0 ? newPath[newPath.length - 1].id : undefined;

      try {
        const response = await contentService.getGoogleDriveFiles(
          parentFolderId
        );
        if (response && response.items) {
          setDriveItems(response.items);
        }
      } catch (error) {
        setError("Failed to navigate up");
        console.error("Error navigating up:", error);
      }
    }
  };

  const handleBreadcrumbClick = async (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);

    const targetFolderId = newPath[newPath.length - 1]?.id || undefined;

    try {
      const response = await contentService.getGoogleDriveFiles(targetFolderId);
      if (response && response.items) {
        setDriveItems(response.items);
      }
    } catch (error) {
      setError("Failed to navigate to folder");
      console.error("Error navigating to folder:", error);
    }
  };

  const handleFileSelect = (fileId: string) => {
    const newSelectedFiles = new Set(selectedFiles);
    if (newSelectedFiles.has(fileId)) {
      newSelectedFiles.delete(fileId);
    } else {
      newSelectedFiles.add(fileId);
    }
    setSelectedFiles(newSelectedFiles);
  };

  const handleUpload = async (fileId: string) => {
    try {
      setError(null);
      setUploadingFileIds((prev) => new Set(prev).add(fileId));
      const file = driveItems.find((f) => f.id === fileId);
      if (!file) {
        throw new Error("File not found");
      }

      const responseFile = await contentService.uploadFromGoogleDrive(
        fileId,
        file.name
      );
      if (responseFile) {
        onFileSelect?.(file);
        onFileUploadComplete?.();
        // Show success toast
        Helpers.toast("success", responseFile.message);
        // Refresh the current folder's contents
        const currentFolderId =
          folderPath.length > 0
            ? folderPath[folderPath.length - 1].id
            : undefined;
        const response = await contentService.getGoogleDriveFiles(
          currentFolderId
        );
        if (response && response.items) {
          setDriveItems(response.items);
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      const axiosError = error as AxiosError<{ error: string }>;
      const errorMessage =
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Failed to upload file";
      setError(errorMessage);
      Helpers.toast("error", errorMessage);
    } finally {
      setUploadingFileIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  // Add refresh function for after deletion
  const refreshCurrentFolder = async () => {
    try {
      const currentFolderId =
        folderPath.length > 0
          ? folderPath[folderPath.length - 1].id
          : undefined;
      const response = await contentService.getGoogleDriveFiles(
        currentFolderId
      );
      if (response && response.items) {
        setDriveItems(response.items);
      }
    } catch (error) {
      console.error("Error refreshing folder:", error);
      setError("Failed to refresh folder contents");
    }
  };

  // Add useEffect to listen for file deletion
  useEffect(() => {
    const handleFileDeleted = () => {
      refreshCurrentFolder();
    };

    // Listen for custom event when file is deleted
    window.addEventListener("fileDeleted", handleFileDeleted);

    return () => {
      window.removeEventListener("fileDeleted", handleFileDeleted);
    };
  }, [folderPath]);

  const handleBulkUpload = async () => {
    try {
      setIsLoading(true);
      const filesToUpload = Array.from(selectedFiles).map((fileId) => {
        const file = driveItems.find((f) => f.id === fileId);
        if (!file) {
          throw new Error(`File not found: ${fileId}`);
        }
        return {
          fileId,
          fileName: file.name,
        };
      });

      const response = (await contentService.bulkUploadFromGoogleDrive(
        filesToUpload
      )) as BulkUploadFromGoogleDriveResponse;

      // Handle individual file results
      response.results.forEach((result) => {
        if (result.status === "error") {
          Helpers.toast("error", `${result.message} (${result.fileId})`);
        } else if (result.status === "skipped") {
          Helpers.toast("info", `${result.message} (${result.fileId})`);
        } else if (result.status === "success") {
          Helpers.toast(
            "success",
            `File ${result.fileId} uploaded successfully`
          );
        }
      });

      // Show summary toast
      const summary = `Upload complete: ${response.successful} successful, ${response.skipped} skipped, ${response.failed} failed`;
      if (response.failed > 0) {
        Helpers.toast("error", summary);
      } else if (response.skipped > 0) {
        Helpers.toast("info", summary);
      } else {
        Helpers.toast("success", summary);
      }

      // Refresh the current folder's contents
      const currentFolderId =
        folderPath.length > 0
          ? folderPath[folderPath.length - 1].id
          : undefined;
      const filesResponse = await contentService.getGoogleDriveFiles(
        currentFolderId
      );
      if (filesResponse && filesResponse.items) {
        setDriveItems(filesResponse.items);
      }

      onFileUploadComplete?.();
      setSelectedFiles(new Set());
    } catch (error) {
      console.error("Error bulk uploading files:", error);
      const axiosError = error as AxiosError<{ error: string }>;
      const errorMessage =
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Failed to upload files";
      Helpers.toast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Drive Files</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {!isAuthorized ? (
          <div className="flex flex-col items-center space-y-4">
            <p>Connect your Google Drive account to import PDF files</p>
            <Button onClick={handleAuthorize} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Google Drive"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Breadcrumb navigation */}
            {folderPath.length > 0 && (
              <div className="flex items-center space-x-2 text-sm">
                <Button variant="ghost" size="sm" onClick={handleNavigateUp}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <span className="text-gray-500">/</span>
                {folderPath.map((folder, index) => (
                  <span key={index} className="flex items-center">
                    <button
                      onClick={() => handleBreadcrumbClick(index)}
                      className="text-blue-600 hover:underline"
                    >
                      {folder.name}
                    </button>
                    {index < folderPath.length - 1 && (
                      <span className="text-gray-500 mx-1">/</span>
                    )}
                  </span>
                ))}
              </div>
            )}

            {/* File/Folder list */}
            <div className="border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {driveItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {!item.isFolder && !item.isUploaded && (
                            <input
                              type="checkbox"
                              checked={selectedFiles.has(item.id)}
                              onChange={() => handleFileSelect(item.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                            />
                          )}
                          <span
                            className={`flex items-center ${
                              item.isFolder
                                ? "cursor-pointer text-blue-600 hover:underline"
                                : ""
                            }`}
                            onClick={() =>
                              item.isFolder &&
                              handleFolderClick(item.id, item.name)
                            }
                          >
                            {item.isFolder ? (
                              <Folder className="h-4 w-4 mr-2" />
                            ) : (
                              <File className="h-4 w-4 mr-2" />
                            )}
                            {item.name}
                            {item.isUploaded && (
                              <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                Uploaded
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.isFolder ? "Folder" : "PDF File"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.owners[0]?.emailAddress || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!item.isFolder && !item.isUploaded && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpload(item.id)}
                            disabled={uploadingFileIds.has(item.id)}
                          >
                            {uploadingFileIds.has(item.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bulk upload button */}
            {selectedFiles.size > 0 && (
              <div className="flex justify-end">
                <Button onClick={handleBulkUpload} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Selected ({selectedFiles.size})
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleDriveSelector;
