import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/pagination";
import DeleteConfirmationModal from "@/components/deleteConfirmationModal";
import GoogleDriveSelector from "@/components/admin/googleDriveSelector";
import Helpers from "@/config/helpers";
import contentService from "@/services/admin/content.service";
import type {
  ContentData,
  Source,
  ApiResponseWithPagination,
  ApiErrorResponse,
} from "@/types/content";
import { AxiosError } from "axios";
import { Loader2 } from "lucide-react";

const Content = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string } | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      const response = await contentService.allSources({
        page,
        limit: pageSize,
      });
      const sourceData = response.data as unknown as Source[];
      setSources(sourceData || []);
      const totalItems =
        (response as ApiResponseWithPagination<unknown>).pagination
          ?.totalItems || 0;
      setTotalItems(totalItems);
    } catch (error) {
      console.error("Error fetching sources:", error);
      Helpers.toast("error", "Failed to fetch sources");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedSources(sources.map((source) => source.id));
    } else {
      setSelectedSources([]);
    }
  };

  const handleSelectSource = (sourceId: string, checked: boolean) => {
    if (checked) {
      setSelectedSources((prev) => [...prev, sourceId]);
    } else {
      setSelectedSources((prev) => prev.filter((id) => id !== sourceId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedSources.length === 0) {
      Helpers.toast("error", "Please select at least one source to delete");
      return;
    }
    setItemToDelete({ id: "bulk" });
    setDeleteModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete({ id });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.id === "bulk") {
        await contentService.bulkDeleteSources(selectedSources);
        Helpers.toast("success", "Selected sources deleted successfully");
        setSelectedSources([]);
        setSelectAll(false);
      } else {
        await contentService.deleteSource(itemToDelete.id);
        Helpers.toast("success", "Source deleted successfully");
        // Dispatch custom event for file deletion
        window.dispatchEvent(new Event("fileDeleted"));
      }
      fetchSources();
    } catch (error) {
      console.error("Error deleting source(s):", error);
      Helpers.toast("error", "Failed to delete source(s)");
    } finally {
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      Helpers.toast("error", "URL cannot be empty");
      return;
    }

    try {
      setScrapingLoading(true);
      const response: ContentData = await contentService.scrapeContent(url);
      fetchSources();
      Helpers.toast("success", response?.message || "");
      setUrl("");
    } catch (error) {
      console.error("Scraping error:", error);
      const axiosError = error as AxiosError<ApiErrorResponse>;
      Helpers.toast(
        "error",
        axiosError.response?.data?.error || "Failed to scrape content"
      );
    } finally {
      setScrapingLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handlePdfUpload = async () => {
    if (!selectedFile) {
      Helpers.toast("error", "Please select a file to upload");
      return;
    }

    try {
      setPdfUploading(true);
      const response = await contentService.uploadPdf(selectedFile);

      if (response) {
        await fetchSources();
        Helpers.toast(
          "success",
          response.message || "PDF uploaded successfully"
        );
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        throw new Error("Failed to process PDF");
      }
    } catch (error) {
      console.error("PDF upload error:", error);
      Helpers.toast(
        "error",
        error instanceof Error ? error.message : "Failed to upload PDF"
      );
    } finally {
      setPdfUploading(false);
    }
  };

  const handleFileUploadComplete = useCallback(() => {
    fetchSources();
  }, [fetchSources]);

  if (loading && pdfUploading && scrapingLoading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Content Management</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Scrape Content from URL</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScrape} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL to scrape"
                  required
                />
              </div>
              <Button type="submit" disabled={scrapingLoading}>
                {scrapingLoading ? "Scraping..." : "Scrape Content"}
              </Button>
            </form>
          </CardContent>
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                disabled={pdfUploading}
              />
              {selectedFile && (
                <Button onClick={handlePdfUpload} disabled={pdfUploading}>
                  {pdfUploading ? "Uploading..." : "Upload PDF"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Google Drive Integration */}
        <GoogleDriveSelector onFileUploadComplete={handleFileUploadComplete} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sources</CardTitle>
          {selectedSources.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={loading}
            >
              Delete Selected ({selectedSources.length})
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="w-full h-full flex justify-center items-center">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                      aria-label="Select all sources"
                    />
                  </TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources?.map((source, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(source.id)}
                        onChange={(e) =>
                          handleSelectSource(source.id, e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300"
                        aria-label={`Select ${source.path}`}
                      />
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{source.type}</TableCell>
                    <TableCell>
                      {source.type === "url"
                        ? source.path.slice(0, 30) + "..."
                        : source.path}
                    </TableCell>
                    <TableCell>
                      <a
                        target="_blank"
                        style={{
                          marginRight: "20px",
                        }}
                        href={
                          source.type === "file"
                            ? `${Helpers.basePath}/uploads/${source.path}`
                            : source.type === "gdrive"
                            ? `https://drive.google.com/file/d/${source.googleDriveFileId}/view`
                            : source.path
                        }
                      >
                        View
                      </a>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(source.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={(newPageSize) => {
              setPageSize(newPageSize);
              setPage(1);
            }}
            disableNext={page * pageSize >= totalItems}
            hidePaginationNumbers={false}
          />
        </CardContent>
      </Card>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={
          itemToDelete?.id === "bulk"
            ? "Delete Selected Sources"
            : "Delete Source"
        }
        message={
          itemToDelete?.id === "bulk"
            ? `Are you sure you want to delete ${selectedSources.length} selected source(s)?`
            : "Are you sure you want to delete this source?"
        }
      />
    </div>
  );
};

export default Content;
