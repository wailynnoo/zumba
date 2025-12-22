"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

interface ImageCropModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedImageFile: File) => void;
  aspectRatio?: number;
}

export default function ImageCropModal({
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 1, // Square by default for avatars
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Verify image loads when imageSrc changes
  useEffect(() => {
    if (!imageSrc) {
      setImageError("No image provided");
      return;
    }

    setImageError(null);
    setImageLoaded(false);
    setCroppedAreaPixels(null);

    // Preload image to verify it's valid
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageLoaded(true);
      setImageError(null);
      imageRef.current = img;
    };
    img.onerror = () => {
      setImageError("Failed to load image. Please try a different image.");
      setImageLoaded(false);
      imageRef.current = null;
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      // Ensure we have valid dimensions
      if (croppedAreaPixels && croppedAreaPixels.width > 0 && croppedAreaPixels.height > 0) {
        console.log("Crop area updated:", croppedAreaPixels);
        setCroppedAreaPixels(croppedAreaPixels);
      }
    },
    []
  );

  // Force initial crop calculation when image loads
  useEffect(() => {
    if (imageLoaded && !croppedAreaPixels) {
      // Small delay to ensure Cropper has rendered, then trigger crop calculation
      const timer = setTimeout(() => {
        // Trigger a tiny crop change to force onCropComplete to fire
        setCrop((prev) => ({ x: prev.x === 0 ? 0.001 : 0, y: prev.y }));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [imageLoaded, croppedAreaPixels]);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous"; // Allow CORS for data URLs
      image.addEventListener("load", () => {
        resolve(image);
      });
      image.addEventListener("error", (error) => {
        console.error("Image load error:", error);
        reject(new Error("Failed to load image"));
      });
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    imageElement?: HTMLImageElement
  ): Promise<Blob> => {
    console.log("Getting cropped image with crop area:", pixelCrop);
    
    const image = imageElement || await createImage(imageSrc);
    console.log("Image loaded, dimensions:", image.naturalWidth, "x", image.naturalHeight);
    
    // Ensure we have valid dimensions
    if (pixelCrop.width <= 0 || pixelCrop.height <= 0) {
      throw new Error(`Invalid crop dimensions: ${pixelCrop.width}x${pixelCrop.height}`);
    }

    // Manual canvas approach
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    // Ensure crop coordinates are within image bounds
    const cropX = Math.max(0, Math.min(Math.round(pixelCrop.x), image.naturalWidth));
    const cropY = Math.max(0, Math.min(Math.round(pixelCrop.y), image.naturalHeight));
    const cropWidth = Math.min(Math.round(pixelCrop.width), image.naturalWidth - cropX);
    const cropHeight = Math.min(Math.round(pixelCrop.height), image.naturalHeight - cropY);

    if (cropWidth <= 0 || cropHeight <= 0) {
      throw new Error(`Invalid calculated crop: ${cropWidth}x${cropHeight} at ${cropX},${cropY}`);
    }

    // Set canvas size to match the cropped area
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Draw the cropped portion of the image
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size > 0) {
            console.log("Blob created successfully using manual canvas, size:", blob.size);
            resolve(blob);
          } else {
            reject(new Error("Canvas is empty or invalid - blob creation failed"));
          }
        },
        "image/jpeg",
        0.95
      );
    });
  };

  const handleSave = async () => {
    if (!imageLoaded) {
      setImageError("Image is still loading, please wait");
      return;
    }

    if (!croppedAreaPixels) {
      setImageError("Please wait for the crop area to be calculated");
      return;
    }

    if (croppedAreaPixels.width <= 0 || croppedAreaPixels.height <= 0) {
      setImageError("Invalid crop area. Please adjust the image.");
      return;
    }

    try {
      setIsProcessing(true);
      setImageError(null);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels, imageRef.current || undefined);
      
      // Convert blob to File
      const file = new File([croppedImageBlob], "avatar.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      onCropComplete(file);
      onClose();
    } catch (error: any) {
      console.error("Error cropping image:", error);
      setImageError(error.message || "Failed to crop image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Crop Image</h3>
          <p className="text-sm text-gray-600 mt-1">
            Adjust the image to your preference
          </p>
          {imageError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {imageError}
            </div>
          )}
        </div>

        <div style={{ position: "relative", width: "100%", height: "400px", background: "#1a1a2e" }}>
          {imageError ? (
            <div className="flex items-center justify-center h-full text-red-500">
              <div className="text-center">
                <p className="font-medium">Failed to load image</p>
                <p className="text-sm mt-1">{imageError}</p>
              </div>
            </div>
          ) : !imageLoaded ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Loading image...</p>
              </div>
            </div>
          ) : imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteCallback}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>No image selected</p>
            </div>
          )}
        </div>
        
        {/* Warning shown outside cropper area */}
        {imageLoaded && !croppedAreaPixels && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 text-sm text-center">
            Drag or zoom the image to set the crop area
          </div>
        )}

        <div className="p-6 border-t border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zoom: {Math.round(zoom * 100)}%
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing || !croppedAreaPixels || !imageLoaded}
              className="px-6 py-2 bg-gradient-zfit text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

