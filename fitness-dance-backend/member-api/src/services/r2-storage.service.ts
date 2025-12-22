// member-api/src/services/r2-storage.service.ts
// Cloudflare R2 Storage Service for streaming videos (S3-compatible)

import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";
import { Readable } from "stream";

/**
 * Cloudflare R2 Storage Service for Member API
 * Focused on streaming videos with Range header support
 */
export class R2StorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string;

  constructor() {
    this.bucketName = env.R2_BUCKET_NAME || "fitness-dance-videos";

    console.log("[R2 Storage] Initializing R2 Storage Service for streaming...");
    console.log("[R2 Storage] Configuration:", {
      bucketName: this.bucketName,
      hasAccountId: !!env.R2_ACCOUNT_ID,
      hasAccessKeyId: !!env.R2_ACCESS_KEY_ID,
      hasSecretAccessKey: !!env.R2_SECRET_ACCESS_KEY,
      endpoint: env.R2_ENDPOINT,
    });

    // Initialize S3 client if credentials are provided
    if (env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY) {
      const endpoint =
        env.R2_ENDPOINT?.replace("{account_id}", env.R2_ACCOUNT_ID) ||
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
      console.warn("[R2 Storage] R2 credentials not fully configured. Video streaming will be disabled.");
    }
  }

  /**
   * Check if R2 is configured
   */
  isConfigured(): boolean {
    return this.s3Client !== null;
  }

  /**
   * Extract key from URL or use as-is
   */
  private extractKey(fileUrl: string): string {
    let key = fileUrl;
    if (fileUrl.includes("/")) {
      const urlParts = fileUrl.split("/");
      const keyIndex = urlParts.findIndex(
        (part) => part === "videos" || part === "thumbnails" || part === "audio" || 
                  part === "collections" || part === "categories"
      );
      if (keyIndex >= 0) {
        key = urlParts.slice(keyIndex).join("/");
      } else {
        const match = fileUrl.match(/(videos|thumbnails|audio|collections|categories)\/.+$/);
        if (match) {
          key = match[0];
        }
      }
    }
    return key;
  }

  /**
   * Get file metadata (size, content type, etc.)
   */
  async getFileMetadata(fileUrl: string) {
    if (!this.s3Client) {
      throw new Error("R2 storage is not configured");
    }

    const key = this.extractKey(fileUrl);
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    return {
      contentLength: response.ContentLength,
      contentType: response.ContentType || "video/mp4",
      lastModified: response.LastModified,
      etag: response.ETag,
    };
  }

  /**
   * Stream file from R2 with Range header support
   * @param fileUrl - Full URL or key of file
   * @param range - Range header value (e.g., "bytes=0-1023")
   * @returns Object with stream, content range, content length, and content type
   */
  async streamFile(fileUrl: string, range?: string) {
    if (!this.s3Client) {
      throw new Error("R2 storage is not configured");
    }

    const key = this.extractKey(fileUrl);

    // Get file metadata first
    const metadata = await this.getFileMetadata(fileUrl);
    const fileSize = metadata.contentLength || 0;

    // Parse range header
    let start = 0;
    let end = fileSize - 1;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      start = parseInt(parts[0], 10);
      end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Validate range
      if (start >= fileSize || end >= fileSize || start > end) {
        throw new Error("Invalid range");
      }
    }

    const contentLength = end - start + 1;
    const contentRange = `bytes ${start}-${end}/${fileSize}`;

    // Create GetObject command with Range
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Range: range ? `bytes=${start}-${end}` : undefined,
    });

    const response = await this.s3Client.send(command);

    // AWS SDK v3 returns Body as a Readable stream
    if (!response.Body) {
      throw new Error("No body in response");
    }

    // AWS SDK v3 GetObjectCommand.Body is a Readable stream
    // Type assertion is safe here as we know it's a stream
    const stream = response.Body as Readable;

    return {
      stream,
      contentLength,
      contentRange,
      contentType: metadata.contentType,
      acceptRanges: "bytes",
    };
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
      const key = this.extractKey(fileUrl);

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
}

export const r2StorageService = new R2StorageService();

