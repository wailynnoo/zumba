// admin-api/src/services/r2-storage.service.ts
// Cloudflare R2 Storage Service (S3-compatible)

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
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
   * @returns Public URL of uploaded file
   */
  async uploadThumbnail(
    file: Buffer | Uint8Array,
    fileName: string,
    contentType: string = "image/jpeg"
  ): Promise<string> {
    if (!this.s3Client) {
      throw new Error("R2 storage is not configured");
    }

    const cleanFileName = fileName.startsWith("/") ? fileName.substring(1) : fileName;
    const key = `thumbnails/${cleanFileName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      // Return public URL
      if (this.publicUrl) {
        return `${this.publicUrl.replace(/\/$/, "")}/${key}`;
      } else {
        throw new Error(
          "R2_PUBLIC_URL is not configured. Please set R2_PUBLIC_URL environment variable " +
          "to your R2 public URL (e.g., https://pub-xxx.r2.dev)."
        );
      }
    } catch (error: any) {
      console.error("Error uploading thumbnail to R2:", error);
      throw new Error(`Failed to upload thumbnail to R2: ${error.message}`);
    }
  }

  /**
   * Upload audio file to R2
   * @param file - Audio buffer
   * @param fileName - File name (will be prefixed with audio/)
   * @param contentType - MIME type (e.g., audio/mpeg)
   * @returns Public URL of uploaded file
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

      // Return public URL
      if (this.publicUrl) {
        return `${this.publicUrl.replace(/\/$/, "")}/${key}`;
      } else {
        throw new Error(
          "R2_PUBLIC_URL is not configured. Please set R2_PUBLIC_URL environment variable " +
          "to your R2 public URL (e.g., https://pub-xxx.r2.dev)."
        );
      }
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
          part === "videos" || part === "thumbnails" || part === "audio"
        );
        if (keyIndex >= 0) {
          key = urlParts.slice(keyIndex).join("/");
        } else {
          // Try to extract from end
          const match = fileUrl.match(/(videos|thumbnails|audio)\/.+$/);
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
          part === "videos" || part === "thumbnails" || part === "audio"
        );
        if (keyIndex >= 0) {
          key = urlParts.slice(keyIndex).join("/");
        } else {
          const match = fileUrl.match(/(videos|thumbnails|audio)\/.+$/);
          if (match) {
            key = match[0];
          }
        }
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
}

export const r2StorageService = new R2StorageService();

