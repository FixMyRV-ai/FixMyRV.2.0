import { chromium, type Page, type Browser } from "playwright";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {
  DistanceStrategy,
  PGVectorStore,
} from "@langchain/community/vectorstores/pgvector";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Request as ExpressRequest, Response } from "express";
import fs from "fs";
import { google } from "googleapis";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import path from "path";
import { PoolConfig } from "pg";
import { Op } from "sequelize";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { Setting, SourceContent } from "../models/index";
import { getVectorStore } from "../config/database";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ContentController {
  private oauth2Client: import("google-auth-library").JWT | null = null;
  private isGoogleDriveConfigured = false;
  private SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
    "https://www.googleapis.com/auth/drive.file",
  ];

  private CREDENTIALS_FILE = path.join(
    __dirname,
    "../config/google-credentials.json"
  );

  // Helper method to check if Google Drive is configured
  private isGoogleDriveAvailable(): boolean {
    return this.isGoogleDriveConfigured && this.oauth2Client !== null;
  }

  constructor() {
    try {
      console.log("Looking for Google credentials at:", this.CREDENTIALS_FILE);
      console.log("Current __dirname:", __dirname);
      
      if (fs.existsSync(this.CREDENTIALS_FILE)) {
        const credentials = JSON.parse(
          fs.readFileSync(this.CREDENTIALS_FILE, "utf8")
        );

        // Initialize with service account credentials
        this.oauth2Client = new google.auth.JWT(
          credentials.client_email,
          undefined,
          credentials.private_key,
          this.SCOPES
        );

        // Authorize the service account
        (async () => {
          try {
            if (this.oauth2Client) {
              await this.oauth2Client.authorize();
              this.isGoogleDriveConfigured = true;
              console.log("Service account authorized successfully");
            }
          } catch (err) {
            console.error("Error authorizing service account:", err);
            this.isGoogleDriveConfigured = false;
          }
        })();
      } else {
        console.warn(
          "Google Drive service account credentials file not found at:",
          this.CREDENTIALS_FILE
        );
        console.log("Available files in config directory:");
        try {
          const configDir = path.dirname(this.CREDENTIALS_FILE);
          const files = fs.readdirSync(configDir);
          console.log(files);
        } catch (e) {
          console.log("Could not read config directory");
        }
      }
    } catch (error) {
      console.error("Error initializing Google Drive integration:", error);
    }
  }

  private cleanContent = (content: string): string => {
    content = content.replace(/<[^>]*>?/g, "");
    content = content.replace(/\s+/g, " ");
    content = content.replace(/\n+/g, "\n");
    content = content.replace(/\t+/g, "\t");
    content = content.replace(/&nbsp;/g, " ");
    content = content.replace(/&amp;/g, "&");
    content = content.replace(/&quot;/g, '"');
    content = content.replace(/&apos;/g, "'");
    content = content.replace(/&lt;/g, "<");
    content = content.replace(/&gt;/g, ">");
    content = content.replace(/&copy;/g, "©");
    content = content.replace(/&reg;/g, "®");
    content = content.replace(/&trade;/g, "™");
    content = content.replace(/&hellip;/g, "...");
    content = content.replace(/&mdash;/g, "—");
    content = content.replace(/&ndash;/g, "–");

    return content;
  };

  private async processScrapedContent(
    content: string,
    url: string
  ): Promise<void> {
    try {
      // Validate content
      if (
        !content ||
        typeof content !== "string" ||
        content.trim().length === 0
      ) {
        throw new Error("Invalid or empty content received");
      }

      const document: Document = {
        pageContent: content,
        metadata: {
          url,
          extractedAt: new Date().toISOString(),
        },
      };

      const URLinDB = await SourceContent.create({
        type: "url",
        path: url,
      });

      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      let docs;
      try {
        docs = await textSplitter.createDocuments([document.pageContent]);
      } catch (err: any) {
        console.error(`Error splitting content: ${err.message}`);
        throw new Error(`Failed to split content: ${err.message}`);
      }

      if (!docs || docs.length === 0) {
        console.error("No documents generated from content");
        throw new Error("Failed to generate documents from content");
      }

      await this.processDocumentAndGenerateVectorStore(
        docs,
        document.metadata,
        URLinDB
      );
    } catch (error) {
      console.error("Error processing scraped content:", error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  scrape = async (req: ExpressRequest, res: Response): Promise<void> => {
    const { url } = req.body;
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--window-size=1920x1080",
          "--disable-blink-features=AutomationControlled",
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
        ],
      });

      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: this.getRandomUserAgent(),
        deviceScaleFactor: 1,
        hasTouch: false,
        javaScriptEnabled: true,
        locale: "en-US",
        timezoneId: "America/New_York",
        permissions: [],
        geolocation: undefined,
        offline: false,
        httpCredentials: undefined,
        ignoreHTTPSErrors: true,
        bypassCSP: true,
      });

      await context.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", {
          get: () => undefined,
        });
        Object.defineProperty(navigator, "plugins", {
          get: () => [1, 2, 3, 4, 5],
        });
        Object.defineProperty(navigator, "languages", {
          get: () => ["en-US", "en"],
        });
        Object.defineProperty(navigator, "platform", { get: () => "Win32" });
        (window as any).chrome = { runtime: {} };
      });

      page = await context.newPage();

      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        Referer: "https://www.google.com/",
        DNT: "1",
        "Upgrade-Insecure-Requests": "1",
      });

      console.log(`Navigating to: ${url}`);
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const hasProtection = await page.evaluate(() => {
        return (
          document.querySelector('input[name="cf-turnstile-response"]') !==
            null ||
          document.querySelector('iframe[src*="challenges.cloudflare.com"]') !==
            null ||
          document.querySelector(".cf-turnstile-response") !== null ||
          document.querySelector(".cf-error-title") !== null ||
          document.querySelector(".cf-challenge-wrapper") !== null ||
          document.getElementById("challenge-form") !== null ||
          document.body.textContent?.includes(
            "Enable JavaScript and cookies to continue"
          ) ||
          document.body.textContent?.includes("Just a moment") ||
          document.body.textContent?.includes("Checking your browser")
        );
      });

      if (hasProtection) {
        console.log("Protection detected");
        throw new Error("Protection detected");
      }

      const scrapedData = await this.extractPageContent(page, url);

      if (
        !scrapedData ||
        !scrapedData.content ||
        scrapedData.content.trim().length === 0
      ) {
        throw new Error("No content extracted from page");
      }

      await this.processScrapedContent(scrapedData.content, url);

      res.status(200).json({
        message: "Data scraped and processed successfully",
        data: scrapedData,
      });
    } catch (error) {
      console.error("Scraping error:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while scraping",
      });
    } finally {
      if (page) {
        await page
          .close()
          .catch((e) => console.error("Error closing page:", e));
      }
      if (browser) {
        await browser
          .close()
          .catch((e) => console.error("Error closing browser:", e));
      }
    }
  };

  private getRandomUserAgent(): string {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15",
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  private async extractPageContent(page: Page, url: string): Promise<any> {
    try {
      // Wait for Cloudflare challenge to resolve
      await page.waitForSelector("body", { timeout: 30000 });

      // Check for Cloudflare challenge
      const pageContent = await page.content();
      if (
        pageContent.includes("Enable JavaScript and cookies to continue") ||
        pageContent.includes("Just a moment") ||
        pageContent.includes("Checking your browser")
      ) {
        throw new Error("Cloudflare protection detected");
      }

      // Wait a bit longer for dynamic content
      await page.waitForTimeout(5000);

      // Try multiple content extraction strategies
      const content = await page.evaluate(() => {
        // Try to get main content first
        const mainContent = document.querySelector(
          'main, article, [role="main"], .content, #content'
        );
        if (mainContent && mainContent.textContent) {
          return mainContent.textContent.trim();
        }

        // Fallback to body content
        const bodyContent = document.body.textContent;
        if (bodyContent) {
          return bodyContent.trim();
        }

        return "";
      });

      if (!content || content.length < 100) {
        throw new Error("Insufficient content extracted");
      }

      const title = await page.title();
      const metadata = await this.extractMetadata(page);
      const cleanedContent = this.cleanContent(content);
      const images = await this.extractImages(page);

      return {
        content: cleanedContent,
        metadata: {
          title,
          ...metadata,
          url,
          images,
          extractedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Content extraction error:", error);
      throw error;
    }
  }

  private async extractMetadata(page: Page): Promise<Record<string, string>> {
    const metadata: Record<string, string> = {};

    try {
      const metaTags = await page.$$eval("meta", (tags) =>
        tags
          .map((tag) => ({
            name:
              tag.getAttribute("name") || tag.getAttribute("property") || "",
            content: tag.getAttribute("content") || "",
          }))
          .filter((tag) => tag.name && tag.content)
      );

      for (const tag of metaTags) {
        const key = tag.name.replace(/^og:/, "").replace(/^twitter:/, "");
        if (!metadata[key]) {
          metadata[key] = tag.content;
        }
      }

      const jsonLd = await page.$$eval(
        'script[type="application/ld+json"]',
        (scripts) => {
          try {
            return scripts
              .map((script) => {
                try {
                  return JSON.parse(script.textContent || "");
                } catch {
                  return null;
                }
              })
              .filter(Boolean);
          } catch {
            return [];
          }
        }
      );

      if (jsonLd.length > 0) {
        metadata.jsonLd = JSON.stringify(jsonLd);
      }
    } catch (error) {
      console.log("Metadata extraction error:", error);
    }

    return metadata;
  }

  private async extractImages(page: Page): Promise<string[]> {
    return await page.$$eval("img", (imgs) =>
      imgs
        .map((img) => img.src)
        .filter((src) => src && !src.startsWith("data:"))
        .slice(0, 10)
    );
  }

  // Rest of the methods remain the same...
  fileDelete(fileName: string) {
    const filePath = path.join(__dirname, fileName);

    try {
      fs.unlinkSync(filePath);
    } catch (err: any) {
      console.error(`Error deleting file ${filePath}: ${err.message}`);
    }
  }

  processDocumentAndGenerateVectorStore = async (
    docs: any[],
    metadata: any,
    sourceInDB: any
  ) => {
    const setting = await Setting.findOne();
    if (!setting || !setting.key) {
      throw new Error("API key is missing or not found");
    }

    const vectorStore = await getVectorStore();

    const docsWithFileId = docs.map((doc) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        ...metadata,
        source_id: sourceInDB?.id,
      },
    }));

    const ids = docsWithFileId.map(() => uuidv4());

    try {
      await vectorStore.addDocuments(docsWithFileId, { ids });
    } catch (error) {
      console.error("Error adding documents to vector store:", error);
      throw error;
    }
    return 1;
  };

  private async extractContentWithFastAPI(
    filePath: string
  ): Promise<{ content: string; metadata: any }> {
    try {
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(filePath);
      const fileBlob = new Blob([new Uint8Array(fileBuffer)], { type: "application/pdf" });
      formData.append("file", fileBlob, path.basename(filePath));

      const response = await fetch("http://127.0.0.1:8000/extract-text", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();

      if (!text || text.trim().length === 0) {
        throw new Error(
          "No content could be extracted from the PDF using FastAPI"
        );
      }

      return {
        content: text,
        metadata: {
          extractedBy: "fastapi",
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Error extracting content with FastAPI:", error);
      throw new Error("Failed to extract content using FastAPI");
    }
  }

  private async generateDocumentsFromPDF(
    filePath: string
  ): Promise<{ docs: Document[]; metadata: any }> {
    const loader = new PDFLoader(filePath, {
      splitPages: false,
    });

    let singleDoc;
    try {
      singleDoc = await loader.load();

      // Validate that we have content
      if (!singleDoc || singleDoc.length === 0 || !singleDoc[0]?.pageContent) {
        // If regular PDF loader fails, try FastAPI
        console.log(
          "Regular PDF loader failed, attempting to extract content with FastAPI..."
        );
        const fastAPIResult = await this.extractContentWithFastAPI(filePath);

        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });

        const docs = await textSplitter.createDocuments([
          fastAPIResult.content,
        ]);

        if (!docs || docs.length === 0) {
          throw new Error("Failed to process PDF content into documents");
        }

        return { docs, metadata: fastAPIResult.metadata };
      }

      // Validate the content is not empty
      if (!singleDoc[0].pageContent.trim()) {
        // If content is empty, try FastAPI
        console.log(
          "PDF content is empty, attempting to extract content with FastAPI..."
        );
        const fastAPIResult = await this.extractContentWithFastAPI(filePath);

        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });

        const docs = await textSplitter.createDocuments([
          fastAPIResult.content,
        ]);

        if (!docs || docs.length === 0) {
          throw new Error("Failed to process PDF content into documents");
        }

        return { docs, metadata: fastAPIResult.metadata };
      }

      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      let docs;
      let metadata;
      try {
        docs = await textSplitter.createDocuments([singleDoc[0].pageContent]);

        // Validate that documents were created
        if (!docs || docs.length === 0) {
          throw new Error("Failed to process PDF content into documents");
        }

        metadata = singleDoc[0].metadata || {};
      } catch (error: any) {
        console.error("Error splitting PDF:", error);
        throw new Error(
          error.message ||
            "Failed to process PDF content. The PDF may be corrupted or contain no text."
        );
      }

      return { docs, metadata };
    } catch (error) {
      console.error("Error loading PDF:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to parse PDF. Ensure the PDF contains selectable text and is not corrupted."
      );
    }
  }

  uploadPDF = async (req: ExpressRequest, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({
        error: "File is required",
      });
      return;
    }

    if (req.file.mimetype !== "application/pdf") {
      res.status(400).json({
        error: "Only PDF files are allowed",
      });
      return;
    }

    try {
      // First try to load and check PDF content
      let docs, metadata;
      try {
        const result = await this.generateDocumentsFromPDF(req.file.path);
        docs = result.docs;
        metadata = result.metadata;
      } catch (error) {
        console.log(error);
        // If PDF loading fails, delete the file and return error
        this.fileDelete(req.file.filename);
        res.status(400).json({
          error:
            "The PDF appears to be empty or contains no extractable text content. Please ensure the PDF contains selectable text.",
        });
        return;
      }

      // Only proceed with database operations if we have valid content
      if (!docs || docs.length === 0) {
        this.fileDelete(req.file.filename);
        res.status(400).json({
          error: "No extractable content found in the PDF",
        });
        return;
      }

      // Create database entry only if we have valid content
      const fileInDB = await SourceContent.create({
        type: "file",
        path: req.file.filename,
      });

      const vectorizationResponse =
        await this.processDocumentAndGenerateVectorStore(
          docs,
          metadata,
          fileInDB
        );

      if (vectorizationResponse) {
        res.status(200).json({
          message: "PDF uploaded successfully",
          data: {
            id: fileInDB.id,
            path: fileInDB.path,
            createdAt: fileInDB.createdAt,
          },
        });
      } else {
        // Clean up if vectorization fails
        this.fileDelete(req.file.filename);
        await fileInDB.destroy();
        throw new Error("Unable to process file");
      }
    } catch (error) {
      console.error("Upload PDF error:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while uploading PDF",
      });
    }
  };

  getSources = async (req: ExpressRequest, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      if (
        isNaN(pageNumber) ||
        isNaN(limitNumber) ||
        pageNumber <= 0 ||
        limitNumber <= 0
      ) {
        res.status(400).json({
          error:
            "Invalid pagination parameters. Page and limit must be positive integers.",
        });
        return;
      }

      const offset = (pageNumber - 1) * limitNumber;

      const { rows: sources, count: totalItems } =
        await SourceContent.findAndCountAll({
          offset,
          limit: limitNumber,
          order: [["id", "DESC"]],
        });

      const totalPages = Math.ceil(totalItems / limitNumber);

      res.status(200).json({
        message: "Content fetched successfully",
        data: sources,
        pagination: {
          totalItems,
          totalPages,
          currentPage: pageNumber,
          pageSize: limitNumber,
        },
      });
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while fetching content",
      });
    }
  };

  deleteSource = async (req: ExpressRequest, res: Response): Promise<void> => {
    try {
      // Delete from source content table
      await SourceContent.destroy({
        where: {
          id: {
            [Op.eq]: req.body.source_id,
          },
        },
      });

      // Delete from vector store
      const vectorStore = await getVectorStore();

      // Delete documents with matching source_id in metadata
      await vectorStore.delete({
        filter: {
          source_id: req.body.source_id,
        },
      });

      res.status(200).json({
        message: "Content deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting source:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting source",
      });
    }
  };

  bulkDeleteSources = async (
    req: ExpressRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { source_ids } = req.body;

      if (!Array.isArray(source_ids) || source_ids.length === 0) {
        res.status(400).json({ error: "Source IDs array is required" });
        return;
      }

      // Delete from source content table
      await SourceContent.destroy({
        where: {
          id: {
            [Op.in]: source_ids,
          },
        },
      });

      // Delete from vector store
      const vectorStore = await getVectorStore();

      // Delete documents with matching source_ids in metadata
      await vectorStore.delete({
        filter: {
          source_id: {
            [Op.in]: source_ids,
          },
        },
      });

      res.status(200).json({
        message: "Selected content deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting sources:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting sources",
      });
    }
  };

  // Google Drive Integration Methods
  authorizeGoogleDrive = async (
    req: ExpressRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!this.oauth2Client) {
        res
          .status(500)
          .json({ error: "Google Drive integration not configured" });
        return;
      }

      // Since we're using service account, we don't need OAuth flow
      res.status(200).json({
        message: "Service account is already authorized",
        data: {
          authorized: true,
        },
      });
    } catch (error) {
      console.error("Google Drive auth error:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "An error occurred during Google Drive authorization",
      });
    }
  };

  getGoogleDriveFiles = async (
    req: ExpressRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!this.oauth2Client) {
        res
          .status(500)
          .json({ error: "Google Drive integration not configured" });
        return;
      }

      const folderId = req.query.folderId as string;
      const drive = google.drive({ version: "v3", auth: this.oauth2Client });

      // Build query based on whether we're in a folder or root
      const query = folderId
        ? `'${folderId}' in parents and (mimeType='application/pdf' or mimeType='application/vnd.google-apps.folder') and trashed = false`
        : "(mimeType='application/pdf' or mimeType='application/vnd.google-apps.folder') and trashed = false";

      const response = await drive.files.list({
        q: query,
        fields:
          "files(id, name, mimeType, owners, shared, createdTime, modifiedTime, size, webViewLink, parents)",
        pageSize: 100,
        orderBy: "modifiedTime desc",
        corpora: "allDrives",
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        spaces: "drive",
      });

      // Get all uploaded file IDs from the database
      const uploadedFiles = await SourceContent.findAll({
        where: {
          googleDriveFileId: {
            [Op.not]: null,
          },
        },
        attributes: ["googleDriveFileId"],
      });
      const uploadedFileIds = new Set(
        uploadedFiles.map((f: any) => f.googleDriveFileId)
      );

      const processedItems = response.data.files?.map((item) => {
        const isFolder = item.mimeType === "application/vnd.google-apps.folder";
        return {
          ...item,
          isOwner: item.owners?.some((owner) => owner.me) || false,
          isShared: item.shared || false,
          isFolder,
          isUploaded:
            !isFolder && item.id ? uploadedFileIds.has(item.id) : false,
        };
      });

      // Sort items: folders first, then files
      const sortedItems = processedItems?.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return (a.name || "").localeCompare(b.name || "");
      });

      res.status(200).json({
        message: "Items retrieved successfully",
        data: {
          items: sortedItems || [],
          total: sortedItems?.length || 0,
        },
      });
    } catch (error) {
      console.error("Error fetching Google Drive items:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch items from Google Drive";

      if (
        error instanceof Error &&
        error.message.includes("insufficient permission")
      ) {
        res.status(403).json({
          error:
            "Insufficient permissions to access Google Drive. Please check service account permissions.",
        });
      } else if (error instanceof Error && error.message.includes("quota")) {
        res.status(429).json({
          error: "Google Drive API quota exceeded. Please try again later.",
        });
      } else {
        res.status(500).json({ error: errorMessage });
      }
    }
  };

  uploadFromGoogleDrive = async (
    req: ExpressRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { fileId, fileName } = req.body;

      if (!fileId) {
        res.status(400).json({ error: "File ID is required" });
        return;
      }

      if (!this.oauth2Client) {
        res.status(401).json({ error: "Not authorized with Google Drive" });
        return;
      }

      // Check if file already exists
      const existingFile = await SourceContent.findOne({
        where: { googleDriveFileId: fileId },
      });

      if (existingFile) {
        res.status(409).json({
          error: "File already uploaded",
          data: {
            id: existingFile.id,
            path: existingFile.path,
            createdAt: existingFile.createdAt,
          },
        });
        return;
      }

      const drive = google.drive({ version: "v3", auth: this.oauth2Client });

      // Download the file
      const response = await drive.files.get(
        {
          fileId,
          alt: "media",
          supportsAllDrives: true,
        },
        { responseType: "stream" }
      );

      // Create a unique filename
      const timestamp = Date.now();
      const originalFileName = fileName || fileId;
      // Remove .pdf extension if it exists to prevent duplication
      const baseFileName = originalFileName.replace(/\.pdf$/i, "");
      const downloadedFilename = `${timestamp}_${baseFileName}.pdf`;
      const localFilePath = path.join("uploads", downloadedFilename);

      // Ensure uploads directory exists
      if (!fs.existsSync("uploads")) {
        fs.mkdirSync("uploads", { recursive: true });
      }

      // Save the file locally
      const dest = fs.createWriteStream(localFilePath);

      await new Promise<void>((resolve, reject) => {
        response.data
          .on("end", () => resolve())
          .on("error", (err: Error) => reject(err))
          .pipe(dest);
      });

      // Process the PDF first to check content
      let docs, metadata;
      try {
        const result = await this.generateDocumentsFromPDF(localFilePath);
        docs = result.docs;
        metadata = result.metadata;
      } catch (error) {
        // If PDF loading fails, delete the file and return error
        fs.unlinkSync(localFilePath);
        res.status(400).json({
          error:
            "The PDF appears to be empty or contains no extractable text content. Please ensure the PDF contains selectable text.",
        });
        return;
      }

      // Only proceed with database operations if we have valid content
      if (!docs || docs.length === 0) {
        fs.unlinkSync(localFilePath);
        res.status(400).json({
          error: "No extractable content found in the PDF",
        });
        return;
      }

      // Create record in database only if we have valid content
      const fileInDB = await SourceContent.create({
        type: "gdrive",
        path: downloadedFilename,
        googleDriveFileId: fileId,
      });

      const vectorizationResponse =
        await this.processDocumentAndGenerateVectorStore(
          docs,
          {
            ...metadata,
            originalSource: "Google Drive",
            originalFileName: fileName,
            googleDriveFileId: fileId,
          },
          fileInDB
        );

      if (vectorizationResponse) {
        res.status(200).json({
          data: {
            message: "Google Drive file processed successfully",
            id: fileInDB.id,
            path: fileInDB.path,
            createdAt: fileInDB.createdAt,
          },
        });
      } else {
        // Clean up if processing failed
        fs.unlinkSync(localFilePath);
        await fileInDB.destroy();
        throw new Error("Unable to process Google Drive file");
      }
    } catch (error) {
      console.error("Google Drive upload error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to process file from Google Drive";
      res.status(500).json({
        error: errorMessage,
      });
    }
  };

  bulkUploadFromGoogleDrive = async (
    req: ExpressRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { files } = req.body;

      if (!Array.isArray(files) || files.length === 0) {
        res.status(400).json({ error: "Files array is required" });
        return;
      }

      if (!this.oauth2Client) {
        res.status(401).json({ error: "Not authorized with Google Drive" });
        return;
      }

      const drive = google.drive({ version: "v3", auth: this.oauth2Client });
      const results = [];

      // Process files in parallel with a concurrency limit
      const concurrencyLimit = 3;
      const chunks = [];
      for (let i = 0; i < files.length; i += concurrencyLimit) {
        chunks.push(files.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async ({ fileId, fileName }) => {
          try {
            // Check if file already exists
            const existingFile = await SourceContent.findOne({
              where: { googleDriveFileId: fileId },
            });

            if (existingFile) {
              return {
                fileId,
                status: "skipped",
                message: "File already uploaded",
                data: {
                  id: existingFile.id,
                  path: existingFile.path,
                  createdAt: existingFile.createdAt,
                },
              };
            }

            // Download the file
            const response = await drive.files.get(
              { fileId, alt: "media" },
              { responseType: "stream" }
            );

            // Create a unique filename
            const timestamp = Date.now();
            const originalFileName = fileName || fileId;
            const baseFileName = originalFileName.replace(/\.pdf$/i, "");
            const downloadedFilename = `${timestamp}_${baseFileName}.pdf`;
            const localFilePath = path.join("uploads", downloadedFilename);

            // Ensure uploads directory exists
            if (!fs.existsSync("uploads")) {
              fs.mkdirSync("uploads", { recursive: true });
            }

            // Save the file locally
            const dest = fs.createWriteStream(localFilePath);

            await new Promise<void>((resolve, reject) => {
              response.data
                .on("end", () => resolve())
                .on("error", (err: Error) => reject(err))
                .pipe(dest);
            });

            // Process the PDF first to check content
            let docs, metadata;
            try {
              const result = await this.generateDocumentsFromPDF(localFilePath);
              docs = result.docs;
              metadata = result.metadata;
            } catch (error) {
              // If PDF loading fails, delete the file and return error
              fs.unlinkSync(localFilePath);
              return {
                fileId,
                status: "error",
                message:
                  "The PDF appears to be empty or contains no extractable text content",
              };
            }

            // Only proceed with database operations if we have valid content
            if (!docs || docs.length === 0) {
              fs.unlinkSync(localFilePath);
              return {
                fileId,
                status: "error",
                message: "No extractable content found in the PDF",
              };
            }

            // Create record in database only if we have valid content
            const fileInDB = await SourceContent.create({
              type: "gdrive",
              path: downloadedFilename,
              googleDriveFileId: fileId,
            });

            await this.processDocumentAndGenerateVectorStore(
              docs,
              {
                ...metadata,
                originalSource: "Google Drive",
                originalFileName: fileName,
                googleDriveFileId: fileId,
              },
              fileInDB
            );

            return {
              fileId,
              status: "success",
              data: {
                message: "File processed successfully",
                id: fileInDB.id,
                path: fileInDB.path,
                createdAt: fileInDB.createdAt,
              },
            };
          } catch (error) {
            console.error(`Error processing file ${fileId}:`, error);
            return {
              fileId,
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to process file",
            };
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }

      // Separate successful and failed uploads
      const successfulUploads = results.filter((r) => r.status === "success");
      const skippedUploads = results.filter((r) => r.status === "skipped");
      const failedUploads = results.filter((r) => r.status === "error");

      res.status(200).json({
        message: "Bulk upload completed",
        data: {
          total: files.length,
          successful: successfulUploads.length,
          skipped: skippedUploads.length,
          failed: failedUploads.length,
          results,
        },
      });
    } catch (error) {
      console.error("Bulk upload error:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to process bulk upload",
      });
    }
  };
}

export default new ContentController();
