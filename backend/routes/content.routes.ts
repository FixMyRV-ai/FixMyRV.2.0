import { Router } from "express";
import contentController from "../controllers/content.controller";
import multer from "multer";
import authMiddleware from "../middlewares/auth.middleware";
import path from "path";

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // Specify the folder for storing files
    },
    filename: (req, file, cb) => {
      const fileExtension = path.extname(file.originalname);
      const filename = Date.now() + fileExtension; // Add timestamp to avoid naming conflicts
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only pdf is allowed."));
    }
  },
});

const router = Router();

// Protected routes
router.use(authMiddleware);
router.post("/scrape", contentController.scrape);
router.get("/all-sources", contentController.getSources);
router.post("/delete-source", contentController.deleteSource);
router.post("/upload-pdf", upload.single("file"), contentController.uploadPDF);
router.post("/bulk-delete-sources", contentController.bulkDeleteSources);

// Google Drive Integration Routes
router.get("/google-drive/authorize", contentController.authorizeGoogleDrive);
router.get("/google-drive/files", contentController.getGoogleDriveFiles);
router.post("/google-drive/upload", contentController.uploadFromGoogleDrive);
router.post(
  "/google-drive/bulk-upload",
  contentController.bulkUploadFromGoogleDrive
);

export default router;
