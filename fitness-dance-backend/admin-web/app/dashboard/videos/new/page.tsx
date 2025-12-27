"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import videoService from "@/lib/services/videoService";
import categoryService from "@/lib/services/categoryService";
import collectionService from "@/lib/services/collectionService";
import videoStepService from "@/lib/services/videoStepService";
import UploadProgress from "../components/UploadProgress";
import VideoFrameSelector from "../components/VideoFrameSelector";

// Zod schema for form validation
const videoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  description: z.string().optional().or(z.literal("")),
  categoryId: z.string().uuid("Category is required"),
  subcategoryId: z.string().uuid().optional().nullable(),
  collectionId: z.string().uuid().optional().nullable(),
  videoType: z.enum(["premium", "free"]), // 'premium' = requires subscription, 'free' = no subscription needed
  hasAudioMode: z.boolean(),
  durationSeconds: z.number().int().positive().optional().nullable(),
  isPublished: z.boolean(),
  sortOrder: z.number().int(),
});

type VideoFormData = z.infer<typeof videoSchema>;

interface Category {
  id: string;
  name: string;
}

export default function NewVideoPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<{ id: string; name: string; categoryId: string }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // Tutorial video state
  const [selectedTutorialVideoFile, setSelectedTutorialVideoFile] = useState<File | null>(null);
  const [tutorialVideoPreview, setTutorialVideoPreview] = useState<string | null>(null);
  const [uploadingTutorialVideo, setUploadingTutorialVideo] = useState(false);
  const [tutorialVideoProgress, setTutorialVideoProgress] = useState(0);

  // File upload state
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [showFrameSelector, setShowFrameSelector] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  
  // Upload progress state
  const [videoProgress, setVideoProgress] = useState(0);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      subcategoryId: null,
      collectionId: null,
      videoType: "premium" as const,
      hasAudioMode: true,
      durationSeconds: null,
      isPublished: false,
      sortOrder: 0,
    },
  });

  // Fetch reference data
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setLoading(true);
        const cats = await categoryService.getCategories({ limit: 100 });
        setCategories(cats.data);
      } catch (err: any) {
        console.error("Error fetching reference data:", err);
        setError(err.response?.data?.message || "Failed to load form data");
      } finally {
        setLoading(false);
      }
    };
    fetchReferenceData();
  }, []);

  // Fetch collections when category changes
  useEffect(() => {
    const fetchCollections = async () => {
      if (!selectedCategoryId) {
        setCollections([]);
        return;
      }
      try {
        const result = await collectionService.getCollections({
          categoryId: selectedCategoryId,
          limit: 100,
        });
        setCollections(result.data || []);
      } catch (err) {
        console.error("Error fetching collections:", err);
        setCollections([]);
      }
    };
    fetchCollections();
  }, [selectedCategoryId]);

  // Watch categoryId to update collections
  const watchedCategoryId = watch("categoryId");
  useEffect(() => {
    setSelectedCategoryId(watchedCategoryId || "");
  }, [watchedCategoryId]);

  const onSubmit = async (data: VideoFormData) => {
    try {
      setError("");
      const payload = {
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId || undefined,
        collectionId: data.collectionId || undefined,
        videoType: data.videoType,
        hasAudioMode: data.hasAudioMode,
        durationSeconds: data.durationSeconds || undefined,
        isPublished: data.isPublished,
        sortOrder: data.sortOrder,
      };

      // Create video
      const newVideo = await videoService.createVideo(payload);
      const videoId = newVideo.id;

      // Upload tutorial video if provided
      if (selectedTutorialVideoFile) {
        setUploadingTutorialVideo(true);
        setTutorialVideoProgress(0);
        try {
          // Check if tutorial step already exists (stepNumber 1 with title "Tutorial")
          let tutorialStep;
          try {
            const existingSteps = await videoStepService.getVideoSteps(videoId);
            const existingTutorial = existingSteps.find(
              (step) => step.stepNumber === 1 && step.title === "Tutorial"
            );
            
            if (existingTutorial) {
              // Update existing tutorial step
              tutorialStep = existingTutorial;
            } else {
              // Create a new video step for the tutorial video
              tutorialStep = await videoStepService.createVideoStep(videoId, {
                stepNumber: 1,
                title: "Tutorial",
                description: undefined,
              });
            }
          } catch (createErr: any) {
            // If creation fails due to duplicate step number, try to find and use existing step
            if (createErr.response?.data?.message?.includes("already exists")) {
              const existingSteps = await videoStepService.getVideoSteps(videoId);
              const existingTutorial = existingSteps.find((step) => step.stepNumber === 1);
              if (existingTutorial) {
                tutorialStep = existingTutorial;
              } else {
                throw createErr;
              }
            } else {
              throw createErr;
            }
          }
          
          // Upload tutorial video to the step
          await videoStepService.uploadStepVideo(tutorialStep.id, selectedTutorialVideoFile, (progress) => {
            setTutorialVideoProgress(progress);
          });
        } catch (tutorialErr: any) {
          console.error("Error uploading tutorial video:", tutorialErr);
          setError(tutorialErr.response?.data?.message || "Failed to upload tutorial video");
          // Don't block navigation - tutorial video can be added later via edit page
        } finally {
          setUploadingTutorialVideo(false);
          setTutorialVideoProgress(0);
        }
      }

      // Upload files if selected
      console.log("[Videos Page] Checking for files to upload:", {
        hasVideoFile: !!selectedVideoFile,
        hasThumbnail: !!selectedThumbnail,
        hasAudio: !!selectedAudio,
        videoId,
      });

      if (selectedVideoFile) {
        setUploadingVideo(true);
        setVideoProgress(0);
        try {
          await videoService.uploadVideo(videoId, selectedVideoFile, (progress) => {
            setVideoProgress(progress);
          });
        } catch (uploadErr: any) {
          console.error("Video upload error:", uploadErr);
          setError(uploadErr.response?.data?.message || "Failed to upload video");
          setVideoProgress(0);
        } finally {
          setUploadingVideo(false);
        }
      }

      if (selectedThumbnail) {
        setUploadingThumbnail(true);
        setThumbnailProgress(0);
        try {
          const result = await videoService.uploadThumbnail(videoId, selectedThumbnail, (progress) => {
            setThumbnailProgress(progress);
          });
          // After upload, fetch signed URL if it's an R2 key
          if (result.thumbnailUrl && result.thumbnailUrl.startsWith("thumbnails/")) {
            try {
              const signedUrl = await videoService.getThumbnailUrl(videoId);
              setThumbnailPreview(signedUrl);
            } catch (err) {
              console.error("Error fetching thumbnail signed URL after upload:", err);
              setThumbnailPreview(result.thumbnailUrl); // Fallback
            }
          } else {
            setThumbnailPreview(result.thumbnailUrl);
          }
        } catch (uploadErr: any) {
          console.error("Thumbnail upload error:", uploadErr);
          setError(uploadErr.response?.data?.message || "Failed to upload thumbnail");
          setThumbnailProgress(0);
        } finally {
          setUploadingThumbnail(false);
        }
      }

      if (selectedAudio) {
        setUploadingAudio(true);
        setAudioProgress(0);
        try {
          await videoService.uploadAudio(videoId, selectedAudio, (progress) => {
            setAudioProgress(progress);
          });
        } catch (uploadErr: any) {
          console.error("Audio upload error:", uploadErr);
          setError(uploadErr.response?.data?.message || "Failed to upload audio");
          setAudioProgress(0);
        } finally {
          setUploadingAudio(false);
        }
      }

      // Navigate back to videos list
      router.push("/dashboard/videos");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to create video";
      if (err.response?.data?.errors) {
        console.error("Backend validation errors:", err.response.data.errors);
      }
      setError(errorMessage);
    }
  };

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file extension and MIME type
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
    const allowedMimeTypes = ["video/mp4", "video/webm", "video/mov", "video/quicktime", "video/avi", "video/x-msvideo", "video/mkv", "video/x-matroska"];
    
    const isValidExtension = fileExtension && allowedExtensions.includes(fileExtension);
    const isValidMimeType = allowedMimeTypes.includes(file.type);
    
    if (!isValidExtension || !isValidMimeType) {
      setError("Only MP4, WebM, MOV, AVI, and MKV videos are allowed");
      setTimeout(() => setError(""), 5000);
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setError("Video size must be less than 500MB");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setSelectedVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed");
      setTimeout(() => setError(""), 5000);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Thumbnail size must be less than 10MB");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setSelectedThumbnail(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFrameSelect = (frameFile: File) => {
    setSelectedThumbnail(frameFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(frameFile);
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/m4a", "audio/aac"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only MP3, WAV, OGG, M4A, and AAC audio files are allowed");
      setTimeout(() => setError(""), 5000);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("Audio size must be less than 50MB");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setSelectedAudio(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-gray-900">Create Video</h1>
          <p className="text-sm text-gray-500 mt-1">Add a new video to your collection</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/videos")}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                {...register("title")}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                {...register("categoryId")}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>}
            </div>

            {/* Collection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
              <select
                {...register("collectionId")}
                disabled={!selectedCategoryId}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">{selectedCategoryId ? "Select collection" : "Select category first"}</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Video Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video Type</label>
              <select
                {...register("videoType")}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20"
              >
                <option value="premium">Premium (Requires Subscription)</option>
                <option value="free">Free (No Subscription Required)</option>
              </select>
            </div>

            {/* Video File Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Video File</label>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoFileSelect}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20"
              />
              {videoPreview && (
                <div className="mt-2">
                  <video src={videoPreview} controls className="max-w-full h-48 rounded-lg" />
                </div>
              )}
              {(uploadingVideo || videoProgress > 0) && (
                <div className="mt-2">
                  <UploadProgress
                    progress={videoProgress}
                    fileName={selectedVideoFile?.name}
                    fileSize={selectedVideoFile?.size}
                    isUploading={uploadingVideo}
                    type="video"
                  />
                </div>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
              <div className="flex gap-2 mb-2">
                {selectedVideoFile && (
                  <button
                    type="button"
                    onClick={() => setShowFrameSelector(true)}
                    className="px-4 py-2 bg-[#6BBD45] text-white rounded-lg text-sm font-medium hover:bg-[#5A9E3A] transition-colors"
                  >
                    Select from Video
                  </button>
                )}
                <label className="flex-1 cursor-pointer">
                  <span className="block w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-700 text-center hover:border-[#6BBD45] hover:bg-[#6BBD45]/5 transition-colors">
                    Upload Image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    className="hidden"
                  />
                </label>
              </div>
              {thumbnailPreview && (
                <div className="mt-2">
                  <img src={thumbnailPreview} alt="Thumbnail" className="h-24 w-40 rounded-lg object-cover" />
                </div>
              )}
              {(uploadingThumbnail || thumbnailProgress > 0) && (
                <div className="mt-2">
                  <UploadProgress
                    progress={thumbnailProgress}
                    fileName={selectedThumbnail?.name}
                    fileSize={selectedThumbnail?.size}
                    isUploading={uploadingThumbnail}
                    type="thumbnail"
                  />
                </div>
              )}
            </div>

            {/* Audio Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audio File (Optional)</label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioSelect}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20"
              />
              {selectedAudio && <p className="mt-1 text-sm text-gray-600">{selectedAudio.name}</p>}
              {(uploadingAudio || audioProgress > 0) && (
                <div className="mt-2">
                  <UploadProgress
                    progress={audioProgress}
                    fileName={selectedAudio?.name}
                    fileSize={selectedAudio?.size}
                    isUploading={uploadingAudio}
                    type="audio"
                  />
                </div>
              )}
            </div>

            {/* Tutorial Video Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tutorial Video (Step-by-Step Breakdown) (Optional)</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  // Check file extension and MIME type
                  const fileExtension = file.name.toLowerCase().split('.').pop();
                  const allowedExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
                  const allowedMimeTypes = ["video/mp4", "video/webm", "video/mov", "video/quicktime", "video/avi", "video/x-msvideo", "video/mkv", "video/x-matroska"];
                  
                  const isValidExtension = fileExtension && allowedExtensions.includes(fileExtension);
                  const isValidMimeType = allowedMimeTypes.includes(file.type);
                  
                  if (!isValidExtension || !isValidMimeType) {
                    setError("Only MP4, WebM, MOV, AVI, and MKV videos are allowed");
                    setTimeout(() => setError(""), 5000);
                    return;
                  }

                  if (file.size > 500 * 1024 * 1024) {
                    setError("Video size must be less than 500MB");
                    setTimeout(() => setError(""), 5000);
                    return;
                  }

                  setSelectedTutorialVideoFile(file);
                  setTutorialVideoPreview(URL.createObjectURL(file));
                }}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20"
              />
              {tutorialVideoPreview && (
                <div className="mt-2">
                  <video src={tutorialVideoPreview} controls className="max-w-full h-48 rounded-lg" />
                </div>
              )}
              {(uploadingTutorialVideo || tutorialVideoProgress > 0) && (
                <div className="mt-2">
                  <UploadProgress
                    progress={tutorialVideoProgress}
                    fileName={selectedTutorialVideoFile?.name}
                    fileSize={selectedTutorialVideoFile?.size}
                    isUploading={uploadingTutorialVideo}
                    type="video"
                  />
                </div>
              )}
            </div>

            {/* Other Fields */}
            <div className="md:col-span-2 flex gap-4">
              <label className="flex items-center">
                <input
                  {...register("hasAudioMode")}
                  type="checkbox"
                  className="rounded border-gray-300 text-[#6BBD45] focus:ring-[#6BBD45]"
                />
                <span className="ml-2 text-sm text-gray-700">Has Audio Mode</span>
              </label>
              <label className="flex items-center">
                <input
                  {...register("isPublished")}
                  type="checkbox"
                  className="rounded border-gray-300 text-[#6BBD45] focus:ring-[#6BBD45]"
                />
                <span className="ml-2 text-sm text-gray-700">Published</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/videos")}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadingVideo || uploadingThumbnail || uploadingAudio || uploadingTutorialVideo}
              className="px-6 py-2 text-sm font-semibold text-white bg-gradient-zfit rounded-lg shadow-lg shadow-[#6BBD45]/20 hover:shadow-xl hover:shadow-[#6BBD45]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting || uploadingVideo || uploadingThumbnail || uploadingAudio || uploadingTutorialVideo
                ? "Creating..."
                : "Create Video"}
            </button>
          </div>
        </form>
      </div>

      {/* Video Frame Selector Modal */}
      {showFrameSelector && (
        <VideoFrameSelector
          videoFile={selectedVideoFile}
          onFrameSelect={handleFrameSelect}
          onClose={() => setShowFrameSelector(false)}
        />
      )}
    </div>
  );
}

