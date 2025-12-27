// admin-api/src/services/video-validation.service.ts
// Video format and codec validation service

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { spawn } from "child_process";

// Supported video codecs (for mobile compatibility)
const SUPPORTED_VIDEO_CODECS = [
  "h264",    // H.264/AVC - most compatible
  "avc1",    // Another name for H.264
  "avc",     // H.264
  "vp8",     // VP8 (WebM)
  "vp9",     // VP9 (WebM)
];

// Unsupported codecs that should be rejected
const UNSUPPORTED_VIDEO_CODECS = [
  "hevc",           // H.265/HEVC - limited Android support
  "hev1",           // HEVC
  "h265",           // HEVC
  "dolby",          // Dolby Vision
  "dvhe",           // Dolby Vision
  "dvh1",           // Dolby Vision  
  "av1",            // AV1 - limited support
  "av01",           // AV1
  "prores",         // ProRes - Apple only
  "dnxhd",          // DNxHD - professional
  "dnxhr",          // DNxHR - professional
  "mjpeg",          // Motion JPEG
  "mpeg4",          // MPEG-4 Part 2 - old codec
  "wmv",            // Windows Media Video
  "vc1",            // VC-1
];

// Supported container formats
const SUPPORTED_CONTAINERS = [
  ".mp4",
  ".m4v",
  ".webm",
];

// Unsupported container formats
const UNSUPPORTED_CONTAINERS = [
  ".mov",     // QuickTime - problematic on Android
  ".avi",     // Old format
  ".wmv",     // Windows Media
  ".mkv",     // Matroska - limited support
  ".flv",     // Flash Video
  ".3gp",     // 3GP - low quality
];

export interface VideoValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  videoInfo?: {
    codec: string;
    container: string;
    duration?: number;
    width?: number;
    height?: number;
    bitrate?: number;
  };
}

export class VideoValidationService {
  /**
   * Validate video file before upload
   */
  async validateVideo(
    buffer: Buffer,
    originalFilename: string
  ): Promise<VideoValidationResult> {
    const result: VideoValidationResult = {
      valid: true,
      warnings: [],
      errors: [],
    };

    // 1. Check container format by extension
    const ext = path.extname(originalFilename).toLowerCase();
    
    // Allow formats that will be automatically converted (should not reach here if conversion worked)
    const willBeConverted = [".mov", ".avi", ".mkv", ".wmv"].includes(ext);
    if (willBeConverted) {
      // If we reach here, conversion should have happened but didn't
      // This is a fallback - ideally conversion happens before validation
      result.warnings.push(
        `File format '${ext}' was detected. This should have been converted to MP4. ` +
        `Please ensure the conversion service is working properly.`
      );
      // Continue validation - the file might still work
    } else if (UNSUPPORTED_CONTAINERS.includes(ext)) {
      result.valid = false;
      result.errors.push(
        `Container format '${ext}' is not supported. Please convert to MP4 (H.264 codec) for best compatibility.`
      );
      return result;
    }

    if (!SUPPORTED_CONTAINERS.includes(ext)) {
      result.warnings.push(
        `Container format '${ext}' may have limited compatibility. MP4 is recommended.`
      );
    }

    // 2. Try to detect codec using ffprobe
    try {
      const videoInfo = await this.getVideoInfo(buffer, originalFilename);
      result.videoInfo = videoInfo;

      if (videoInfo.codec) {
        const codecLower = videoInfo.codec.toLowerCase();
        
        // Check for unsupported codecs
        const isUnsupported = UNSUPPORTED_VIDEO_CODECS.some(
          (c) => codecLower.includes(c)
        );
        
        if (isUnsupported) {
          result.valid = false;
          result.errors.push(
            `Video codec '${videoInfo.codec}' is not supported on most mobile devices. ` +
            `Please re-encode using H.264 codec: ffmpeg -i input -c:v libx264 -crf 23 -c:a aac output.mp4`
          );
          
          // Add specific guidance for common problematic codecs
          if (codecLower.includes("dolby") || codecLower.includes("dvh")) {
            result.errors.push(
              "Dolby Vision videos require special hardware support. Please convert to standard H.264."
            );
          } else if (codecLower.includes("hevc") || codecLower.includes("h265") || codecLower.includes("hev")) {
            result.errors.push(
              "HEVC/H.265 has limited Android support. Please convert to H.264 for broader compatibility."
            );
          } else if (codecLower.includes("prores")) {
            result.errors.push(
              "ProRes is an Apple professional format. Please convert to H.264 for mobile playback."
            );
          }
        }

        // Check if it's a supported codec
        const isSupported = SUPPORTED_VIDEO_CODECS.some(
          (c) => codecLower.includes(c)
        );

        if (!isSupported && !isUnsupported) {
          result.warnings.push(
            `Video codec '${videoInfo.codec}' may have limited compatibility. H.264 is recommended.`
          );
        }
      }

      // 3. Check video dimensions
      if (videoInfo.width && videoInfo.height) {
        if (videoInfo.width > 3840 || videoInfo.height > 2160) {
          result.warnings.push(
            `Video resolution ${videoInfo.width}x${videoInfo.height} is very high. ` +
            `Consider downscaling to 1080p for better streaming performance.`
          );
        }
      }

      // 4. Check bitrate
      if (videoInfo.bitrate && videoInfo.bitrate > 20000000) {
        result.warnings.push(
          `Video bitrate (${Math.round(videoInfo.bitrate / 1000000)}Mbps) is high. ` +
          `This may cause buffering on slow connections. Consider encoding at 5-10Mbps.`
        );
      }
    } catch (error: any) {
      // FFprobe not available or failed - add warning but don't fail
      console.warn("[Video Validation] Could not analyze video codec:", error.message);
      result.warnings.push(
        "Could not verify video codec. If playback fails, please re-encode using H.264: " +
        "ffmpeg -i input -c:v libx264 -crf 23 -c:a aac output.mp4"
      );
    }

    return result;
  }

  /**
   * Get video information using ffprobe
   */
  private async getVideoInfo(
    buffer: Buffer,
    originalFilename: string
  ): Promise<{
    codec: string;
    container: string;
    duration?: number;
    width?: number;
    height?: number;
    bitrate?: number;
  }> {
    // Write buffer to temp file for ffprobe analysis
    const tempDir = os.tmpdir();
    const ext = path.extname(originalFilename);
    const tempPath = path.join(
      tempDir,
      `video-validation-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
    );

    try {
      fs.writeFileSync(tempPath, buffer);

      // Run ffprobe to get video info
      const ffprobeResult = await this.runFfprobe(tempPath);
      
      return {
        codec: ffprobeResult.codec || "unknown",
        container: ext,
        duration: ffprobeResult.duration,
        width: ffprobeResult.width,
        height: ffprobeResult.height,
        bitrate: ffprobeResult.bitrate,
      };
    } finally {
      // Clean up temp file
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (cleanupError) {
        console.error("[Video Validation] Error cleaning up temp file:", cleanupError);
      }
    }
  }

  /**
   * Run ffprobe command to get video metadata
   */
  private runFfprobe(filePath: string): Promise<{
    codec?: string;
    duration?: number;
    width?: number;
    height?: number;
    bitrate?: number;
  }> {
    return new Promise((resolve, reject) => {
      const args = [
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        filePath,
      ];

      const ffprobe = spawn("ffprobe", args);
      let stdout = "";
      let stderr = "";

      ffprobe.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      ffprobe.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      ffprobe.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const info = JSON.parse(stdout);
          const videoStream = info.streams?.find(
            (s: any) => s.codec_type === "video"
          );

          resolve({
            codec: videoStream?.codec_name || videoStream?.codec_tag_string,
            duration: info.format?.duration ? parseFloat(info.format.duration) : undefined,
            width: videoStream?.width,
            height: videoStream?.height,
            bitrate: info.format?.bit_rate ? parseInt(info.format.bit_rate) : undefined,
          });
        } catch (parseError) {
          reject(new Error(`Failed to parse ffprobe output: ${parseError}`));
        }
      });

      ffprobe.on("error", (error) => {
        reject(new Error(`ffprobe not found or failed: ${error.message}`));
      });
    });
  }

  /**
   * Quick check for obviously incompatible files (no ffprobe needed)
   */
  quickValidate(originalFilename: string): { valid: boolean; error?: string } {
    const ext = path.extname(originalFilename).toLowerCase();
    
    // Allow .mov and other formats that will be automatically converted
    // The conversion service will handle these formats
    const willBeConverted = [".mov", ".avi", ".mkv", ".wmv"].includes(ext);
    if (willBeConverted) {
      return { valid: true }; // Will be converted automatically
    }

    // Reject other unsupported formats
    if (UNSUPPORTED_CONTAINERS.includes(ext)) {
      return {
        valid: false,
        error: `${ext.toUpperCase()} format is not supported. Please convert to MP4 (H.264 codec).`,
      };
    }

    return { valid: true };
  }
}

export const videoValidationService = new VideoValidationService();

