"use client";

import { useState, useRef, useEffect } from "react";

interface VideoFrameSelectorProps {
  videoFile: File | null;
  videoUrl?: string | null; // For existing videos
  onFrameSelect: (frameFile: File) => void;
  onClose: () => void;
}

export default function VideoFrameSelector({
  videoFile,
  videoUrl,
  onFrameSelect,
  onClose,
}: VideoFrameSelectorProps) {
  const [frames, setFrames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (videoFile || videoUrl) {
      extractFrames();
    }

    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.src) {
        if (videoRef.current.src.startsWith("blob:")) {
          URL.revokeObjectURL(videoRef.current.src);
        }
      }
    };
  }, [videoFile, videoUrl]);

  const extractFrames = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas ref not available");
      return;
    }

    setLoading(true);
    setFrames([]);
    setError(null);
    let objectUrl: string | null = null;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Set video source
      if (videoFile) {
        // Verify file type
        if (!videoFile.type.startsWith('video/')) {
          throw new Error(`File type "${videoFile.type}" is not a video. Please select a video file.`);
        }
        // Use the file directly - this should work for most video formats
        objectUrl = URL.createObjectURL(videoFile);
        video.src = objectUrl;
      } else if (videoUrl) {
        // For URLs, especially signed URLs, we need to handle CORS and format issues
        // Note: Frame extraction from URLs may fail due to browser format support or CORS
        // It works best with uploaded video files
        try {
          const response = await fetch(videoUrl, {
            method: 'GET',
            mode: 'cors',
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
          }
          
          const blob = await response.blob();
          // Check if blob is a video type
          if (!blob.type.startsWith('video/')) {
            console.warn(`Blob type is ${blob.type}, expected video/*`);
            // Try to proceed anyway - some servers don't set content-type correctly
          }
          
          objectUrl = URL.createObjectURL(blob);
          video.src = objectUrl;
        } catch (fetchError: any) {
          console.warn("Failed to fetch video as blob, trying direct URL:", fetchError);
          // Fallback to direct URL (might have CORS or format issues)
          video.src = videoUrl;
          video.crossOrigin = "anonymous";
        }
      } else {
        throw new Error("No video file or URL provided");
      }

      // Wait for video metadata to load
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Video load timeout"));
        }, 30000); // 30 second timeout

        const onLoadedMetadata = () => {
          clearTimeout(timeout);
          if (isNaN(video.duration) || video.duration === 0) {
            reject(new Error("Invalid video duration"));
            return;
          }
          if (video.videoWidth === 0 || video.videoHeight === 0) {
            reject(new Error("Invalid video dimensions"));
            return;
          }
          video.currentTime = 0;
          video.removeEventListener("loadedmetadata", onLoadedMetadata);
          video.removeEventListener("error", onError);
          resolve();
        };

        const onError = (e: Event) => {
          clearTimeout(timeout);
          video.removeEventListener("loadedmetadata", onLoadedMetadata);
          video.removeEventListener("error", onError);
          
          const error = video.error;
          let errorMessage = "Unknown error";
          
          if (error) {
            switch (error.code) {
              case MediaError.MEDIA_ERR_ABORTED:
                errorMessage = "Video loading was aborted";
                break;
              case MediaError.MEDIA_ERR_NETWORK:
                errorMessage = "Network error while loading video";
                break;
              case MediaError.MEDIA_ERR_DECODE:
                errorMessage = videoUrl 
                  ? "Video format not supported. Frame extraction works best with uploaded video files. Please upload a video file or use a thumbnail image instead."
                  : "Video format not supported or corrupted. Please try a different video file or upload a thumbnail image instead.";
                break;
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = videoUrl
                  ? "Video format not supported by browser. Frame extraction from existing videos may not work due to format limitations. Please upload a video file or use a thumbnail image instead."
                  : "Video format not supported by browser. Please try a different video file or upload a thumbnail image instead.";
                break;
              default:
                errorMessage = error.message || `Error code: ${error.code}`;
            }
          }
          
          reject(new Error(`Video load error: ${errorMessage}`));
        };

        video.addEventListener("loadedmetadata", onLoadedMetadata);
        video.addEventListener("error", onError);

        // If already loaded, resolve immediately
        if (video.readyState >= 1) {
          onLoadedMetadata();
        }
      });

      // Wait for video to be ready to play
      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) {
          resolve();
        } else {
          video.addEventListener("canplay", () => resolve(), { once: true });
        }
      });

      // Extract frames at different time points
      const duration = video.duration;
      if (isNaN(duration) || duration <= 0) {
        throw new Error(`Invalid video duration: ${duration}`);
      }

      const frameCount = 12; // Extract 12 frames
      const extractedFrames: string[] = [];

      // Set canvas size to match video aspect ratio
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error(`Invalid video dimensions: ${canvas.width}x${canvas.height}`);
      }

      // Seek to beginning first
      video.currentTime = 0;
      await new Promise<void>((resolve) => {
        video.addEventListener("seeked", () => resolve(), { once: true });
      });

      for (let i = 0; i < frameCount; i++) {
        const time = (duration / (frameCount + 1)) * (i + 1);
        
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            video.removeEventListener("seeked", onSeeked);
            video.removeEventListener("error", onError);
            reject(new Error(`Timeout seeking to ${time}s`));
          }, 5000);

          const onSeeked = () => {
            clearTimeout(timeout);
            try {
              // Draw current frame to canvas
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              // Convert canvas to data URL
              const frameDataUrl = canvas.toDataURL("image/jpeg", 0.9);
              if (frameDataUrl && frameDataUrl !== "data:,") {
                extractedFrames.push(frameDataUrl);
              } else {
                console.warn(`Failed to extract frame at ${time}s`);
              }
              
              video.removeEventListener("seeked", onSeeked);
              video.removeEventListener("error", onError);
              resolve();
            } catch (drawError) {
              video.removeEventListener("seeked", onSeeked);
              video.removeEventListener("error", onError);
              reject(drawError);
            }
          };

          const onError = () => {
            clearTimeout(timeout);
            video.removeEventListener("seeked", onSeeked);
            video.removeEventListener("error", onError);
            reject(new Error(`Error seeking to ${time}s`));
          };
          
          video.addEventListener("seeked", onSeeked);
          video.addEventListener("error", onError);
          video.currentTime = time;
        });
      }

      if (extractedFrames.length === 0) {
        throw new Error("No frames were extracted from the video");
      }

      setFrames(extractedFrames);
    } catch (error: any) {
      console.error("Error extracting frames:", error);
      
      // Log detailed error information for debugging
      const errorDetails: any = {
        message: error?.message,
        videoFile: videoFile?.name,
        videoUrl: videoUrl ? (videoUrl.length > 100 ? videoUrl.substring(0, 100) + "..." : videoUrl) : null,
      };
      
      if (videoRef.current) {
        errorDetails.videoReadyState = videoRef.current.readyState;
        errorDetails.videoDuration = videoRef.current.duration;
        errorDetails.videoWidth = videoRef.current.videoWidth;
        errorDetails.videoHeight = videoRef.current.videoHeight;
        if (videoRef.current.error) {
          errorDetails.videoErrorCode = videoRef.current.error.code;
          errorDetails.videoErrorMessage = videoRef.current.error.message;
        }
      }
      
      console.error("Error details:", errorDetails);
      
      // Set error message for UI display
      let userErrorMessage = error?.message || "Failed to extract frames from video.";
      
      // Add helpful suggestion based on error type
      if (error?.message?.includes("format not supported") || error?.message?.includes("MEDIA_ERR")) {
        if (videoUrl) {
          userErrorMessage = "Frame extraction from existing videos may not work due to browser format limitations. For best results, please upload a new video file or use a thumbnail image instead.";
        } else {
          userErrorMessage = "The video format is not supported by your browser. Please try a different video file (MP4 with H.264 codec recommended) or upload a thumbnail image instead.";
        }
      }
      
      setError(userErrorMessage);
    } finally {
      // Cleanup object URL
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setLoading(false);
    }
  };

  const handleFrameSelect = (index: number) => {
    setSelectedFrameIndex(index);
  };

  // Convert data URL to blob
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleConfirm = () => {
    if (selectedFrameIndex === null) return;

    const selectedFrameDataUrl = frames[selectedFrameIndex];
    const blob = dataUrlToBlob(selectedFrameDataUrl);
    const file = new File([blob], "thumbnail.jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    onFrameSelect(file);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Select Thumbnail from Video</h3>
          <p className="text-sm text-gray-600 mt-1">
            Choose a frame from the video to use as thumbnail
          </p>
          {videoUrl && !videoFile && (
            <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              ⚠️ Frame extraction from existing videos may not work due to browser format limitations. For best results, upload a new video file or use a thumbnail image.
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center max-w-md">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-semibold mb-2">Error</p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6BBD45] mx-auto mb-4"></div>
                <p className="text-gray-600">Extracting frames from video...</p>
              </div>
            </div>
          ) : frames.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {frames.map((frame, index) => (
                  <div
                    key={index}
                    onClick={() => handleFrameSelect(index)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedFrameIndex === index
                        ? "border-[#6BBD45] ring-4 ring-[#6BBD45]/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={frame}
                      alt={`Frame ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    {selectedFrameIndex === index && (
                      <div className="absolute inset-0 bg-[#6BBD45]/20 flex items-center justify-center">
                        <div className="bg-[#6BBD45] text-white rounded-full p-2">
                          <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>No frames available</p>
            </div>
          )}

          {/* Hidden video and canvas elements */}
          <video
            ref={videoRef}
            className="hidden"
            preload="auto"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedFrameIndex === null || loading}
            className="px-6 py-2 bg-gradient-zfit text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Use Selected Frame
          </button>
        </div>
      </div>
    </div>
  );
}

