// admin-api/src/middleware/upload.middleware.ts
// Multer configuration for file uploads

import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

// Ensure uploads directory exists
const ensureUploadDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Category image upload configuration
const categoryImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads", "categories");
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `category-${uniqueSuffix}${ext}`);
  },
});

// File filter for category images
const categoryImageFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only image files are allowed (jpeg, jpg, png, webp). Received: " + file.mimetype
      )
    );
  }
};

// Multer instance for category images
export const uploadCategoryImage = multer({
  storage: categoryImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: categoryImageFilter,
});

// Collection thumbnail upload configuration
const collectionThumbnailStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads", "collections");
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `collection-${uniqueSuffix}${ext}`);
  },
});

// File filter for collection thumbnails
const collectionThumbnailFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only image files are allowed (jpeg, jpg, png, webp). Received: " + file.mimetype
      )
    );
  }
};

// Multer instance for collection thumbnails
export const uploadCollectionThumbnail = multer({
  storage: collectionThumbnailStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: collectionThumbnailFilter,
});

// Error handler for multer errors
export const handleUploadError = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB.",
      });
      return;
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      res.status(400).json({
        success: false,
        message: "Too many files. Only one file allowed.",
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
    return;
  }

  if (err) {
    res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
    return;
  }

  next();
};

// Video upload configuration (memory storage - we'll upload directly to R2)
const videoStorage = multer.memoryStorage();

// File filter for videos
const videoFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /mp4|webm|mov|avi|mkv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /video\//.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only video files are allowed (mp4, webm, mov, avi, mkv). Received: " + file.mimetype
      )
    );
  }
};

// Multer instance for video uploads
export const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size for videos
  },
  fileFilter: videoFilter,
});

// Thumbnail upload configuration (memory storage)
const thumbnailStorage = multer.memoryStorage();

// File filter for thumbnails
const thumbnailFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only image files are allowed for thumbnails (jpeg, jpg, png, webp). Received: " + file.mimetype
      )
    );
  }
};

// Multer instance for thumbnail uploads
export const uploadThumbnail = multer({
  storage: thumbnailStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size for thumbnails
  },
  fileFilter: thumbnailFilter,
});

// Audio upload configuration (memory storage)
const audioStorage = multer.memoryStorage();

// File filter for audio
const audioFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /mp3|wav|ogg|m4a|aac/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /audio\//.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only audio files are allowed (mp3, wav, ogg, m4a, aac). Received: " + file.mimetype
      )
    );
  }
};

// Multer instance for audio uploads
export const uploadAudio = multer({
  storage: audioStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size for audio
  },
  fileFilter: audioFilter,
});

// Admin avatar upload configuration
const adminAvatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads", "admins");
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `admin-avatar-${uniqueSuffix}${ext}`);
  },
});

// File filter for admin avatars
const adminAvatarFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only image files are allowed for avatars (jpeg, jpg, png, webp). Received: " + file.mimetype
      )
    );
  }
};

// Multer instance for admin avatars
export const uploadAdminAvatar = multer({
  storage: adminAvatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: adminAvatarFilter,
});

