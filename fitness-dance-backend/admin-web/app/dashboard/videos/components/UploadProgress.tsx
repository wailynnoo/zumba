"use client";

import { useEffect, useState } from "react";

interface UploadProgressProps {
  progress: number; // 0-100
  fileName?: string;
  fileSize?: number;
  isUploading: boolean;
  type?: "video" | "thumbnail" | "audio";
}

export default function UploadProgress({
  progress,
  fileName,
  fileSize,
  isUploading,
  type = "video",
}: UploadProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Animate progress bar
  useEffect(() => {
    if (isUploading) {
      const interval = setInterval(() => {
        setDisplayProgress((prev) => {
          if (prev < progress) {
            // Smooth increment towards actual progress
            const diff = progress - prev;
            return Math.min(prev + Math.max(diff * 0.1, 1), progress);
          }
          return prev;
        });
      }, 50);

      return () => clearInterval(interval);
    } else {
      setDisplayProgress(progress);
    }
  }, [progress, isUploading]);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getTypeLabel = () => {
    switch (type) {
      case "video":
        return "Video";
      case "thumbnail":
        return "Thumbnail";
      case "audio":
        return "Audio";
      default:
        return "File";
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case "video":
        return "bg-blue-500";
      case "thumbnail":
        return "bg-purple-500";
      case "audio":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (!isUploading && progress === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${getTypeColor()} animate-pulse`} />
          <span className="font-medium text-gray-700">
            {getTypeLabel()} {isUploading ? "Uploading" : "Uploaded"}
          </span>
          {fileName && (
            <span className="text-gray-500 text-xs truncate max-w-[200px]">{fileName}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {fileSize && (
            <span className="text-gray-500 text-xs">{formatFileSize(fileSize)}</span>
          )}
          <span className="font-semibold text-gray-900">{Math.round(displayProgress)}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full ${getTypeColor()} rounded-full transition-all duration-300 ease-out relative`}
          style={{ width: `${displayProgress}%` }}
        >
          {/* Animated shimmer effect */}
          {isUploading && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{
                animation: "shimmer 2s infinite",
              }}
            />
          )}
        </div>
      </div>

      {/* Speed indicator (optional, can be added later) */}
      {isUploading && progress > 0 && progress < 100 && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <svg
            className="w-3 h-3 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Uploading...
        </div>
      )}

      {/* Success indicator */}
      {!isUploading && progress === 100 && (
        <div className="text-xs text-green-600 flex items-center gap-1">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Upload complete!
        </div>
      )}
    </div>
  );
}

