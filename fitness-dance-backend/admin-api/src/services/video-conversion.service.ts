// admin-api/src/services/video-conversion.service.ts
// Video conversion service for converting incompatible formats to MP4 (H.264)

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { spawn } from "child_process";

export interface ConversionResult {
  success: boolean;
  convertedBuffer?: Buffer;
  outputPath?: string;
  error?: string;
  duration?: number; // Conversion time in seconds
}

export class VideoConversionService {
  /**
   * Convert video file to MP4 (H.264 codec) for mobile compatibility
   * @param inputBuffer - Original video file buffer
   * @param originalFilename - Original filename (for extension detection)
   * @returns Converted video buffer and metadata
   */
  async convertToMP4(
    inputBuffer: Buffer,
    originalFilename: string
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    const ext = path.extname(originalFilename).toLowerCase();
    
    // Only convert if it's a format that needs conversion
    const needsConversion = [".mov", ".avi", ".mkv", ".wmv"].includes(ext);
    
    if (!needsConversion) {
      return {
        success: false,
        error: `File format ${ext} does not require conversion`,
      };
    }

    const inputPath = path.join(
      os.tmpdir(),
      `input-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
    );
    const outputPath = path.join(
      os.tmpdir(),
      `output-${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`
    );

    try {
      // Write input buffer to temp file
      console.log("[Video Conversion] Writing input file to:", inputPath);
      fs.writeFileSync(inputPath, inputBuffer);

      // Convert using ffmpeg
      console.log("[Video Conversion] Starting conversion to MP4 (H.264)...");
      await this.runFfmpeg(inputPath, outputPath);

      // Read converted file
      console.log("[Video Conversion] Reading converted file from:", outputPath);
      
      // Verify output file exists and has content
      const outputStats = fs.statSync(outputPath);
      console.log("[Video Conversion] Output file size:", outputStats.size, "bytes");
      
      if (outputStats.size === 0) {
        throw new Error("Converted file is empty - ffmpeg may have failed silently");
      }
      
      // Read file and create a NEW buffer (important - don't return the original fs buffer reference)
      const fileContent = fs.readFileSync(outputPath);
      // Create a copy of the buffer to avoid issues with memory references
      const convertedBuffer = Buffer.from(fileContent);
      console.log("[Video Conversion] Buffer read and copied, size:", convertedBuffer.length, "bytes");
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`[Video Conversion] Conversion completed in ${duration.toFixed(2)}s`);
      console.log(`[Video Conversion] Input size: ${inputBuffer.length} bytes -> Output size: ${convertedBuffer.length} bytes`);

      return {
        success: true,
        convertedBuffer,
        outputPath,
        duration,
      };
    } catch (error: any) {
      console.error("[Video Conversion] Error:", error);
      return {
        success: false,
        error: error.message || "Failed to convert video",
      };
    } finally {
      // Clean up temp files
      try {
        if (fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
          console.log("[Video Conversion] Cleaned up input file");
        }
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
          console.log("[Video Conversion] Cleaned up output file");
        }
      } catch (cleanupError) {
        console.error("[Video Conversion] Error cleaning up temp files:", cleanupError);
      }
    }
  }

  /**
   * Run ffmpeg to convert video to MP4 with H.264 codec
   */
  private runFfmpeg(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // FFmpeg command for converting to MP4 with H.264 codec
      // -c:v libx264: Use H.264 video codec (most compatible)
      // -crf 23: Quality setting (18-28 range, 23 is good balance)
      // -preset medium: Encoding speed vs compression (medium is good balance)
      // -c:a aac: Use AAC audio codec (most compatible)
      // -b:a 128k: Audio bitrate
      // -movflags +faststart: Optimize for streaming (move metadata to beginning)
      // -pix_fmt yuv420p: Pixel format for maximum compatibility
      const args = [
        "-i", inputPath,
        "-c:v", "libx264",
        "-crf", "23",
        "-preset", "medium",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        "-pix_fmt", "yuv420p",
        "-y", // Overwrite output file
        outputPath,
      ];

      console.log("[Video Conversion] Running ffmpeg with args:", args.join(" "));
      const ffmpeg = spawn("ffmpeg", args);

      let stderr = "";
      let stdout = "";

      ffmpeg.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      ffmpeg.stderr.on("data", (data) => {
        stderr += data.toString();
        // FFmpeg writes progress to stderr, so we log it
        const lines = data.toString().split("\n");
        for (const line of lines) {
          if (line.includes("time=")) {
            // Extract time progress
            const timeMatch = line.match(/time=(\d+:\d+:\d+\.\d+)/);
            if (timeMatch) {
              console.log("[Video Conversion] Progress:", timeMatch[1]);
            }
          }
        }
      });

      ffmpeg.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
          return;
        }

        // Check if output file exists
        if (!fs.existsSync(outputPath)) {
          reject(new Error("Conversion completed but output file not found"));
          return;
        }

        resolve();
      });

      ffmpeg.on("error", (error) => {
        reject(new Error(`ffmpeg not found or failed: ${error.message}`));
      });
    });
  }

  /**
   * Check if ffmpeg is available
   */
  async checkFfmpegAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const ffmpeg = spawn("ffmpeg", ["-version"]);
      
      ffmpeg.on("close", (code) => {
        resolve(code === 0);
      });

      ffmpeg.on("error", () => {
        resolve(false);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        ffmpeg.kill();
        resolve(false);
      }, 5000);
    });
  }
}

export const videoConversionService = new VideoConversionService();

