import express from "express";
import authController from "../controllers/auth.controller";
import authMiddleware from "../middlewares/auth.middleware";
import multer from "multer";
import path from "path";
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profiles/"); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG and GIF are allowed."));
    }
  },
});

// register route
router.post("/register", authController.register);

// Email verification route
router.get("/verify-email", authController.verifyEmail);
router.get("/resend-verification-email", authController.resendVerification);

// login route
router.post("/login", authController.login);

// Forgot password route
router.post("/forgot-password", authController.forgotPassword);

// Reset password route
router.post("/reset-password", authController.resetPassword);

router.put(
  "/profile",
  authMiddleware,
  upload.single("profileImage"),
  authController.updateProfile
);
router.put("/change-password", authMiddleware, authController.changePassword);

// Add this route with authentication middleware
router.post("/verify-password", authMiddleware, authController.verifyPassword);

export default router;
