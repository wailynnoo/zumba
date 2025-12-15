// admin-api/src/services/r2-storage.service.ts
// Cloudflare R2 Storage Service (S3-compatible)

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";
import path from "path";

/**
 * Cloudflare R2 Storage Service
 * Uses AWS SDK (S3-compatible) to interact with Cloudflare R2
 */
export class R2StorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private publicUrl?: string;

  constructor() {
    this.bucketName = env.R2_BUCKET_NAME || "fitness-dance-videos";
    this.publicUrl = env.R2_PUBLIC_URL;

    console.log("[R2 Storage] Initializing R2 Storage Service...");
    console.log("[R2 Storage] Configuration:", {
      bucketName: this.bucketName,
      hasPublicUrl: !!this.publicUrl,
      hasAccountId: !!env.R2_ACCOUNT_ID,
      hasAccessKeyId: !!env.R2_ACCESS_KEY_ID,
      hasSecretAccessKey: !!env.R2_SECRET_ACCESS_KEY,
      endpoint: env.R2_ENDPOINT,
    });

    // Initialize S3 client if credentials are provided
    if (env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY) {
      const endpoint = env.R2_ENDPOINT?.replace("{account_id}", env.R2_ACCOUNT_ID) || 
        `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

      console.log("[R2 Storage] Creating S3 client with endpoint:", endpoint);

      this.s3Client = new S3Client({
        region: "auto", // R2 uses "auto" region
        endpoint,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
      });

      console.log("[R2 Storage] S3 client created successfully");
    } else {
      console.warn("[R2 Storage] R2 credentials not fully configured. R2 storage will be disabled.");
      console.warn("[R2 Storage] Missing:", {
        accountId: !env.R2_ACCOUNT_ID,
        accessKeyId: !env.R2_ACCESS_KEY_ID,
        secretAccessKey: !env.R2_SECRET_ACCESS_KEY,
      });
    }
  }

  /**
   * Check if R2 is configured
   */
  isConfigured(): boolean {
    return this.s3Client !== null;
  }

  /**
   * Upload video file to R2
   * @param file - File buffer or stream
   * @param fileName - File name (will be prefixed with videos/)
   * @param contentType - MIME type (e.g., video/mp4)
   * @returns Public URL of uploaded file
   */
  async uploadVideo(
    file: Buffer | Uint8Array,
    fileName: string,
    contentType: string = "video/mp4"
  ): Promise<string> {
    console.log("[R2 Storage] uploadVideo called with:", {
      fileName,
      contentType,
      fileSize: file.length,
      bucketName: this.bucketName,
      hasPublicUrl: !!this.publicUrl,
    });

    if (!this.s3Client) {
      console.error("[R2 Storage] S3 client is null - R2 not configured");
      throw new Error("R2 storage is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY");
    }

    // Ensure fileName doesn't have leading slash
    const cleanFileName = fileName.startsWith("/") ? fileName.substring(1) : fileName;
    const key = `videos/${cleanFileName}`;

    console.log("[R2 Storage] Uploading to key:", key);

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        // Make file publicly readable (or use signed URLs for private access)
        // ACL: "public-read", // R2 doesn't support ACL, use public bucket or signed URLs
      });

      console.log("[R2 Storage] Sending PutObjectCommand to R2...");
      await this.s3Client.send(command);
      console.log("[R2 Storage] PutObjectCommand successful!");

      // Return public URL
      let publicUrl: string;
      if (this.publicUrl) {
        // Custom domain or R2 public URL (e.g., https://pub-xxx.r2.dev)
        publicUrl = `${this.publicUrl.replace(/\/$/, "")}/${key}`;
      } else {
        // If R2_PUBLIC_URL is not set, we cannot generate a public URL
        // The storage endpoint URL is NOT publicly accessible
        // User must set R2_PUBLIC_URL in environment variables
        throw new Error(
          "R2_PUBLIC_URL is not configured. Please set R2_PUBLIC_URL environment variable " +
          "to your R2 public URL (e.g., https://pub-xxx.r2.dev). " +
          "You can find this in your Cloudflare R2 bucket settings under 'Public Access'."
        );
      }

      console.log("[R2 Storage] Generated public URL:", publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error("[R2 Storage] Error uploading video to R2:", error);
      console.error("[R2 Storage] Error details:", {
        message: error.message,
        code: error.Code,
        requestId: error.$metadata?.requestId,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Failed to upload video to R2: ${error.message}`);
    }
  }

  /**
   * Upload thumbnail image to R2
   * @param file - Image buffer
   * @param fileName - File name (will be prefixed with thumbnails/)
   * @param contentType - MIME type (e.g., image/jpeg)
   * @returns R2 key (e.g., "thumbnails/thumbnail-xxx.jpg") - not a public URL since bucket is private
   */
  async uploadThumbnail(
    file: Buffer | Uint8Array,
    fileName: string,
    contentType: string = "image/jpeg"
  ): Promise<string> {
    console.log("[R2 Storage] uploadThumbnail called with:", {
      fileName,
      contentType,
      fileSize: file.length,
      bucketName: this.bucketName,
    });

    if (!this.s3Client) {
      console.error("[R2 Storage] S3 client is null - R2 not configured");
      throw new Error("R2 storage is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY");
    }

    const cleanFileName = fileName.startsWith("/") ? fileName.substring(1) : fileName;
    const key = `thumbnails/${cleanFileName}`;

    console.log("[R2 Storage] Uploading thumbnail to key:", key);

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      console.log("[R2 Storage] Thumbnail uploaded successfully to:", key);
      
      // Return the R2 key (not a public URL since bucket is private)
      return key;
    } catch (error: any) {
      console.error("[R2 Storage] Error uploading thumbnail to R2:", error);
      console.error("[R2 Storage] Error details:", {
        message: error.message,
        code: error.Code,
        requestId: error.$metadata?.requestId,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Failed to upload thumbnail to R2: ${error.message}`);
    }
  }

  /**
   * Upload category image to R2
   * @param file - Image buffer or file path
   * @param fileName - File name (will be prefixed with categories/)
   * @param contentType - MIME type (e.g., image/jpeg)
   * @returns R2 key (e.g., "categories/category-xxx.jpg") - not a public URL since bucket is private
   */
  async uploadCategoryImage(
    file: Buffer | Uint8Array | string,
    fileName: string,
    contentType: string = "image/jpeg"
  ): Promise<string> {
    console.log("[R2 Storage] uploadCategoryImage called with:", {
      fileName,
      contentType,
      fileType: typeof file === "string" ? "path" : "buffer",
      bucketName: this.bucketName,
    });

    if (!this.s3Client) {
      console.error("[R2 Storage] S3 client is null - R2 not configured");
      throw new Error("R2 storage is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY");
    }

    const cleanFileName = fileName.startsWith("/") ? fileName.substring(1) : fileName;
    const key = `categories/${cleanFileName}`;

    console.log("[R2 Storage] Uploading category image to key:", key);

    try {
      // If file is a path string, read it as buffer
      let fileBuffer: Buffer | Uint8Array;
      if (typeof file === "string") {
        const fs = require("fs");
        fileBuffer = fs.readFileSync(file);
      } else {
        fileBuffer = file;
      }

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      console.log("[R2 Storage] Category image uploaded successfully to:", key);
      
      // Return the R2 key (not a public URL since bucket is private)
      return key;
    } catch (error: any) {
      console.error("[R2 Storage] Error uploading category image to R2:", error);
      console.error("[R2 Storage] Error details:", {
        message: error.message,
        code: error.Code,
        requestId: error.$metadata?.requestId,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Failed to upload category image to R2: ${error.message}`);
    }
  }

  /**
   * Upload collection thumbnail to R2
   * @param file - File buffer, Uint8Array, or file path string
   * @param fileName - File name (will be prefixed with collections/)
   * @param contentType - MIME type (e.g., image/jpeg)
   * @returns R2 key (e.g., "collections/collection-xxx.jpg") - not a public URL since bucket is private
   */
  async uploadCollectionThumbnail(
    file: Buffer | Uint8Array | string,
    fileName: string,
    contentType: string = "image/jpeg"
  ): Promise<string> {
    console.log("[R2 Storage] uploadCollectionThumbnail called with:", {
      fileName,
      contentType,
      fileType: typeof file === "string" ? "path" : "buffer",
      bucketName: this.bucketName,
    });

    if (!this.s3Client) {
      console.error("[R2 Storage] S3 client is null - R2 not configured");
      throw new Error("R2 storage is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY");
    }

    const cleanFileName = fileName.startsWith("/") ? fileName.substring(1) : fileName;
    const key = `collections/${cleanFileName}`;

    console.log("[R2 Storage] Uploading collection thumbnail to key:", key);

    try {
      // If file is a path string, read it as buffer
      let fileBuffer: Buffer | Uint8Array;
      if (typeof file === "string") {
        const fs = require("fs");
        fileBuffer = fs.readFileSync(file);
      } else {
        fileBuffer = file;
      }

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      console.log("[R2 Storage] Collection thumbnail uploaded successfully to:", key);
      
      // Return the R2 key (not a public URL since bucket is private)
      return key;
    } catch (error: any) {
      console.error("[R2 Storage] Error uploading collection thumbnail to R2:", error);
      console.error("[R2 Storage] Error details:", {
        message: error.message,
        code: error.Code,
        requestId: error.$metadata?.requestId,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Failed to upload collection thumbnail to R2: ${error.message}`);
    }
  }

  /**
   * Upload audio file to R2
   * @param file - Audio buffer
   * @param fileName - File name (will be prefixed with audio/)
   * @param contentType - MIME type (e.g., audio/mpeg)
   * @returns R2 key (e.g., "audio/audio-xxx.mp3") - not a public URL since bucket is private
   */
  async uploadAudio(
    file: Buffer | Uint8Array,
    fileName: string,
    contentType: string = "audio/mpeg"
  ): Promise<string> {
    if (!this.s3Client) {
      throw new Error("R2 storage is not configured");
    }

    const cleanFileName = fileName.startsWith("/") ? fileName.substring(1) : fileName;
    const key = `audio/${cleanFileName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      console.log("[R2 Storage] Audio uploaded successfully to:", key);
      
      // Return the R2 key (not a public URL since bucket is private)
      return key;
    } catch (error: any) {
      console.error("Error uploading audio to R2:", error);
      throw new Error(`Failed to upload audio to R2: ${error.message}`);
    }
  }

  /**
   * Delete file from R2
   * @param fileUrl - Full URL or key of file to delete
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error("R2 storage is not configured");
    }

    try {
      // Extract key from URL
      let key = fileUrl;
      if (fileUrl.includes("/")) {
        // Extract key from URL
        const urlParts = fileUrl.split("/");
        const keyIndex = urlParts.findIndex(part => 
          part === "videos" || part === "thumbnails" || part === "audio" || part === "categories"
        );
        if (keyIndex >= 0) {
          key = urlParts.slice(keyIndex).join("/");
        } else {
          // Try to extract from end
          const match = fileUrl.match(/(videos|thumbnails|audio|categories)\/.+$/);
          if (match) {
            key = match[0];
          }
        }
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error: any) {
      console.error("Error deleting file from R2:", error);
      // Don't throw - file might not exist
    }
  }

  /**
   * Generate signed URL for private file access (expires in 1 hour by default)
   * @param fileUrl - Full URL or key of file
   * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
   * @returns Signed URL
   */
  async getSignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
    if (!this.s3Client) {
      throw new Error("R2 storage is not configured");
    }

    try {
      // Extract key from URL
      let key = fileUrl;
      if (fileUrl.includes("/")) {
        const urlParts = fileUrl.split("/");
        const keyIndex = urlParts.findIndex(part => 
          part === "videos" || part === "thumbnails" || part === "audio" || part === "categories" || part === "video-steps"
        );
        if (keyIndex >= 0) {
          key = urlParts.slice(keyIndex).join("/");
        } else {
          const match = fileUrl.match(/(videos|thumbnails|audio|categories|video-steps)\/.+$/);
          if (match) {
            key = match[0];
          }
        }
      }

      // Fix: If key starts with "video-steps/" (without "videos/" prefix), add it
      // This handles old records that were stored with the wrong key format
      if (key.startsWith("video-steps/") && !key.startsWith("videos/video-steps/")) {
        key = `videos/${key}`;
      }

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error: any) {
      console.error("Error generating signed URL:", error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Check if a file exists in R2
   * @param fileUrl - Full URL or key of file
   * @returns true if file exists, false otherwise
   */
  async fileExists(fileUrl: string): Promise<boolean> {
    if (!this.s3Client) {
      throw new Error("R2 storage is not configured");
    }

    try {
      // Extract key from URL
      let key = fileUrl;
      if (fileUrl.includes("/")) {
        const urlParts = fileUrl.split("/");
        const keyIndex = urlParts.findIndex(part => 
          part === "videos" || part === "thumbnails" || part === "audio" || part === "categories" || part === "video-steps"
        );
        if (keyIndex >= 0) {
          key = urlParts.slice(keyIndex).join("/");
        } else {
          const match = fileUrl.match(/(videos|thumbnails|audio|categories|video-steps)\/.+$/);
          if (match) {
            key = match[0];
          }
        }
      }

      // Fix: If key starts with "video-steps/" (without "videos/" prefix), add it
      if (key.startsWith("video-steps/") && !key.startsWith("videos/video-steps/")) {
        key = `videos/${key}`;
      }

      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      // If error is 404 (NotFound), file doesn't exist
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      // For other errors, log and return false
      console.error("Error checking file existence:", error);
      return false;
    }
  }

  /**
   * Generate unique file name
   * @param originalName - Original file name
   * @param prefix - Optional prefix (e.g., "video", "thumbnail")
   * @returns Unique file name
   */
  generateFileName(originalName: string, prefix?: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const prefixPart = prefix ? `${prefix}-` : "";
    return `${prefixPart}${timestamp}-${random}${ext}`;
  }

  /**
   * Get S3 client (for streaming)
   * @returns S3Client instance
   */
  getS3Client(): S3Client {
    if (!this.s3Client) {
      throw new Error("R2 storage is not configured");
    }
    return this.s3Client;
  }

  /**
   * Get bucket name
   * @returns Bucket name
   */
  getBucketName(): string {
    return this.bucketName;
  }

  /**
   * Extract key from URL or return key as-is
   * @param fileUrl - Full URL or key
   * @returns R2 key (e.g., "videos/file.mp4")
   */
  extractKey(fileUrl: string): string {
    if (fileUrl.includes("/")) {
      const urlParts = fileUrl.split("/");
      const keyIndex = urlParts.findIndex(part => 
        part === "videos" || part === "thumbnails" || part === "audio" || part === "categories"
      );
      if (keyIndex >= 0) {
        return urlParts.slice(keyIndex).join("/");
      } else {
        const match = fileUrl.match(/(videos|thumbnails|audio|categories)\/.+$/);
        if (match) {
          return match[0];
        }
      }
    }
    return fileUrl;
  }

  /**
   * Get object metadata (for Content-Length, Content-Type, etc.)
   * @param fileUrl - Full URL or key of file
   * @returns Object metadata
   */
  async getObjectMetadata(fileUrl: string) {
    if (!this.s3Client) {
      throw new Error("R2 storage is not configured");
    }

    const key = this.extractKey(fileUrl);
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    // Use HeadObject would be better, but GetObjectCommand works too
    // We'll just get the response metadata
    const response = await this.s3Client.send(command);
    
    return {
      contentLength: response.ContentLength,
      contentType: response.ContentType || "video/mp4",
      lastModified: response.LastModified,
      etag: response.ETag,
    };
  }
}

export const r2StorageService = new R2StorageService();

