"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import videoService, { Video } from "@/lib/services/videoService";
import categoryService from "@/lib/services/categoryService";
import collectionService from "@/lib/services/collectionService";
import videoStepService, { VideoStep } from "@/lib/services/videoStepService";
import UploadProgress from "../../components/UploadProgress";
import VideoFrameSelector from "../../components/VideoFrameSelector";

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

export default function EditVideoPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.id as string;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<Video | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<{ id: string; name: string; categoryId: string }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteVideoFileConfirm, setShowDeleteVideoFileConfirm] = useState(false);
  const [deletingVideoFile, setDeletingVideoFile] = useState(false);
  const [showDeleteThumbnailConfirm, setShowDeleteThumbnailConfirm] = useState(false);
  const [deletingThumbnail, setDeletingThumbnail] = useState(false);
  const [showDeleteAudioConfirm, setShowDeleteAudioConfirm] = useState(false);
  const [deletingAudio, setDeletingAudio] = useState(false);
  
  // Tutorial video state
  const [tutorialStep, setTutorialStep] = useState<VideoStep | null>(null);
  const [selectedTutorialVideoFile, setSelectedTutorialVideoFile] = useState<File | null>(null);
  const [tutorialVideoPreview, setTutorialVideoPreview] = useState<string | null>(null);
  const [uploadingTutorialVideo, setUploadingTutorialVideo] = useState(false);
  const [tutorialVideoProgress, setTutorialVideoProgress] = useState(0);
  const [showDeleteTutorialConfirm, setShowDeleteTutorialConfirm] = useState(false);
  const [deletingTutorial, setDeletingTutorial] = useState(false);

  // File upload state
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [showFrameSelector, setShowFrameSelector] = useState(false);
  const [videoWatchUrl, setVideoWatchUrl] = useState<string | null>(null);
  
  // Upload progress state
  const [videoProgress, setVideoProgress] = useState(0);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
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

  // Watch categoryId changes to filter collections
  const watchedCategoryId = watch("categoryId");
  useEffect(() => {
    setSelectedCategoryId(watchedCategoryId || "");
  }, [watchedCategoryId]);

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

  // Fetch tutorial video step
  const fetchTutorialVideo = async () => {
    if (!videoId) return;
    try {
      const steps = await videoStepService.getVideoSteps(videoId);
      // Find tutorial step (stepNumber 1 with title "Tutorial")
      const tutorial = steps.find((step) => step.stepNumber === 1 && step.title === "Tutorial");
      setTutorialStep(tutorial || null);
      
      // If tutorial exists and has video, fetch signed URL for preview
      if (tutorial && (tutorial.videoUrl || tutorial.cloudflareVideoId)) {
        try {
          // Check if it's an R2 key (starts with "video-steps/" or has cloudflareVideoId)
          if (tutorial.videoUrl?.startsWith("video-steps/") || tutorial.cloudflareVideoId) {
            // Fetch signed URL for the tutorial video
            const signedUrl = await videoStepService.getStepVideoUrl(tutorial.id);
            setTutorialVideoPreview(signedUrl);
          } else if (tutorial.videoUrl && (tutorial.videoUrl.startsWith("http://") || tutorial.videoUrl.startsWith("https://"))) {
            // External URL or signed URL - use it directly
            setTutorialVideoPreview(tutorial.videoUrl);
          } else {
            setTutorialVideoPreview(null);
          }
        } catch (err) {
          console.error("Error loading tutorial video preview:", err);
          setTutorialVideoPreview(null);
        }
      } else {
        // Clear tutorial video preview if no tutorial video exists
        setTutorialVideoPreview(null);
      }
    } catch (err) {
      console.error("Error fetching tutorial video:", err);
      setTutorialStep(null);
    }
  };

  // Fetch video and reference data
  useEffect(() => {
    const fetchData = async () => {
      // Reset preview states when videoId changes (but keep video state until new data loads)
      setThumbnailPreview(null);
      setAudioPreview(null);
      setTutorialStep(null);
      setTutorialVideoPreview(null);
      setSelectedVideoFile(null);
      setSelectedThumbnail(null);
      setSelectedAudio(null);
      setSelectedTutorialVideoFile(null);
      setVideoPreview(null);
      try {
        setLoading(true);
        const [videoData, cats] = await Promise.all([
          videoService.getVideoById(videoId),
          categoryService.getCategories({ limit: 100 }),
        ]);

        setVideo(videoData);
        setCategories(cats.data);
        setSelectedCategoryId(videoData.categoryId);

        // Reset form with video data
        reset({
          title: videoData.title,
          description: videoData.description || "",
          categoryId: videoData.categoryId,
          subcategoryId: videoData.subcategoryId || null,
          collectionId: videoData.collectionId || null,
          videoType: videoData.videoType as "premium" | "free",
          hasAudioMode: videoData.hasAudioMode,
          durationSeconds: videoData.durationSeconds || null,
          isPublished: videoData.isPublished,
          sortOrder: videoData.sortOrder,
        });
        
        // Fetch collections for the category
        if (videoData.categoryId) {
          try {
            const result = await collectionService.getCollections({
              categoryId: videoData.categoryId,
              limit: 100,
            });
            setCollections(result.data || []);
          } catch (err) {
            console.error("Error fetching collections:", err);
          }
        }
        
        // Fetch tutorial video
        await fetchTutorialVideo();

        if (videoData.thumbnailUrl) {
          // Check if it's an old R2 public URL (bucket is now private, so these won't work)
          const isOldR2PublicUrl = 
            videoData.thumbnailUrl.includes(".r2.dev/") || 
            videoData.thumbnailUrl.includes(".r2.cloudflarestorage.com/");

          // If it's an R2 key or old public URL, fetch signed URL
          if (videoData.thumbnailUrl.startsWith("thumbnails/") || isOldR2PublicUrl) {
            try {
              const signedUrl = await videoService.getThumbnailUrl(videoData.id);
              setThumbnailPreview(signedUrl);
            } catch (error: any) {
              console.error("Error fetching thumbnail signed URL:", error);
              // If file not found (404), clear preview and thumbnailUrl - file was deleted from R2 but DB still has reference
              if (error?.response?.status === 404) {
                console.warn("Thumbnail file not found in R2, clearing preview and thumbnailUrl");
                setThumbnailPreview(null);
                setVideo((prev) => prev ? { ...prev, thumbnailUrl: null } : null);
              } else {
                setThumbnailPreview(null);
              }
            }
          } else if (videoData.thumbnailUrl.startsWith("http://") || videoData.thumbnailUrl.startsWith("https://")) {
            // External URL or signed URL - use it directly
            setThumbnailPreview(videoData.thumbnailUrl);
          } else {
            // Legacy: Use as-is
            setThumbnailPreview(videoData.thumbnailUrl);
          }
        } else {
          // Clear thumbnail preview if no thumbnail exists
          setThumbnailPreview(null);
        }
        if (videoData.cloudflareVideoId) {
          // Fetch signed URL for direct R2 access (faster than streaming through API)
          try {
            const watchUrl = await videoService.getVideoWatchUrl(videoData.id);
            setVideoPreview(watchUrl);
            setVideoWatchUrl(watchUrl); // Store for frame selector
          } catch (err: any) {
            console.error("Error fetching watch URL:", err);
            // If file not found (404), clear preview and cloudflareVideoId - file was deleted from R2 but DB still has reference
            if (err?.response?.status === 404) {
              console.warn("Video file not found in R2, clearing preview and cloudflareVideoId");
              setVideoPreview(null);
              // Clear cloudflareVideoId from video state so upload button shows
              setVideo((prev) => prev ? { ...prev, cloudflareVideoId: null } : null);
            } else {
              // For other errors, still try fallback (but likely will also fail)
              try {
                setVideoPreview(videoService.getVideoStreamUrl(videoData.id));
              } catch (fallbackErr) {
                console.error("Fallback also failed:", fallbackErr);
                setVideoPreview(null);
              }
            }
          }
        } else {
          // Clear video preview if no video file exists
          setVideoPreview(null);
        }

        // Fetch audio signed URL if audio exists
        if (videoData.audioUrl) {
          try {
            // Check if it's an R2 key or old public URL
            const isOldR2PublicUrl = 
              videoData.audioUrl.includes(".r2.dev/") || 
              videoData.audioUrl.includes(".r2.cloudflarestorage.com/");

            // If it's an R2 key or old public URL, fetch signed URL
            if (videoData.audioUrl.startsWith("audio/") || isOldR2PublicUrl) {
              try {
                const signedUrl = await videoService.getAudioUrl(videoData.id);
                setAudioPreview(signedUrl);
              } catch (error: any) {
                console.error("Error fetching audio signed URL:", error);
                // If file not found (404), clear preview and audioUrl - file was deleted from R2 but DB still has reference
                if (error?.response?.status === 404) {
                  console.warn("Audio file not found in R2, clearing preview and audioUrl");
                  setAudioPreview(null);
                  setVideo((prev) => prev ? { ...prev, audioUrl: null } : null);
                } else {
                  setAudioPreview(null);
                }
              }
            } else if (videoData.audioUrl.startsWith("http://") || videoData.audioUrl.startsWith("https://")) {
              // External URL or signed URL - use it directly
              setAudioPreview(videoData.audioUrl);
            } else {
              setAudioPreview(null);
            }
          } catch (err) {
            console.error("Error loading audio:", err);
            setAudioPreview(null);
          }
        } else {
          // Clear audio preview if no audio file exists
          setAudioPreview(null);
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || "Failed to load video");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [videoId, reset]);

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

      // Update video
      await videoService.updateVideo(videoId, payload);

      // Upload files if selected
      if (selectedVideoFile) {
        setUploadingVideo(true);
        setVideoProgress(0);
        try {
          const result = await videoService.uploadVideo(videoId, selectedVideoFile, (progress) => {
            setVideoProgress(progress);
          });
          
          // Update video state with new video data
          if (result.video) {
            setVideo(result.video);
          } else if (video) {
            // Extract R2 key from videoUrl if it's a full path
            const cloudflareVideoId = result.videoUrl.startsWith("videos/") 
              ? result.videoUrl 
              : result.videoUrl.split("/").pop() || result.videoUrl;
            setVideo({ ...video, cloudflareVideoId });
          }
          
            // After upload, fetch signed URL if it's an R2 key
            if (result.videoUrl && result.videoUrl.startsWith("videos/")) {
              try {
                const watchUrl = await videoService.getVideoWatchUrl(videoId);
                setVideoPreview(watchUrl);
                setVideoWatchUrl(watchUrl); // Store for frame selector
              } catch (err) {
                console.error("Error fetching video watch URL after upload:", err);
                setVideoPreview(result.videoUrl); // Fallback
                setVideoWatchUrl(result.videoUrl);
              }
            } else {
              setVideoPreview(result.videoUrl);
              setVideoWatchUrl(result.videoUrl);
            }
          
          // Clear selected video file after successful upload
          setSelectedVideoFile(null);
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
          
          // Update video state with new thumbnailUrl
          if (result.video) {
            setVideo(result.video);
          } else if (video) {
            setVideo({ ...video, thumbnailUrl: result.thumbnailUrl });
          }
          
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
          
          // Clear selected thumbnail after successful upload
          setSelectedThumbnail(null);
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
          const result = await videoService.uploadAudio(videoId, selectedAudio, (progress) => {
            setAudioProgress(progress);
          });
          // After upload, fetch signed URL if it's an R2 key
          if (result.audioUrl && result.audioUrl.startsWith("audio/")) {
            try {
              const signedUrl = await videoService.getAudioUrl(videoId);
              setAudioPreview(signedUrl);
            } catch (err) {
              console.error("Error fetching audio signed URL after upload:", err);
              setAudioPreview(null);
            }
          } else {
            setAudioPreview(result.audioUrl);
          }
        } catch (uploadErr: any) {
          console.error("Audio upload error:", uploadErr);
          setError(uploadErr.response?.data?.message || "Failed to upload audio");
          setAudioProgress(0);
        } finally {
          setUploadingAudio(false);
        }
      }

      // Upload tutorial video if provided
      if (selectedTutorialVideoFile) {
        setUploadingTutorialVideo(true);
        setTutorialVideoProgress(0);
        try {
          // Check if tutorial step already exists
          let tutorialStepToUse = tutorialStep;
          
          if (!tutorialStepToUse) {
            // Create a new tutorial step
            tutorialStepToUse = await videoStepService.createVideoStep(videoId, {
              stepNumber: 1,
              title: "Tutorial",
              description: undefined,
            });
            setTutorialStep(tutorialStepToUse);
          }
          
          // Upload tutorial video to the step
          await videoStepService.uploadStepVideo(tutorialStepToUse.id, selectedTutorialVideoFile, (progress) => {
            setTutorialVideoProgress(progress);
          });
          
          // Refresh tutorial video data
          await fetchTutorialVideo();
        } catch (tutorialErr: any) {
          console.error("Error uploading tutorial video:", tutorialErr);
          setError(tutorialErr.response?.data?.message || "Failed to upload tutorial video");
          setTutorialVideoProgress(0);
        } finally {
          setUploadingTutorialVideo(false);
          setTutorialVideoProgress(0);
        }
      }

      // Navigate back to videos list
      router.push("/dashboard/videos");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to update video";
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

  const handleDelete = async () => {
    if (!video) return;

    try {
      setDeleting(true);
      setError("");
      await videoService.deleteVideo(videoId);
      // Navigate back to videos list after successful deletion
      router.push("/dashboard/videos");
    } catch (err: any) {
      console.error("Error deleting video:", err);
      setError(err.response?.data?.message || "Failed to delete video");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteVideoFile = async () => {
    if (!video || !video.cloudflareVideoId) return;

    try {
      setDeletingVideoFile(true);
      setError("");
      await videoService.deleteVideoFile(videoId);
      // Clear video preview immediately
      setVideoPreview(null);
      setSelectedVideoFile(null);
      // Clear cache for this video's watch URL since it's been deleted
      const { clearVideoWatchUrlCache } = await import("@/lib/services/videoService");
      clearVideoWatchUrlCache(videoId);
      // Refetch video data to get updated state
      const updatedVideo = await videoService.getVideoById(videoId);
      setVideo(updatedVideo);
      // Ensure cloudflareVideoId is cleared in state
      if (updatedVideo) {
        setVideo({ ...updatedVideo, cloudflareVideoId: null });
      }
      setShowDeleteVideoFileConfirm(false);
    } catch (err: any) {
      console.error("Error deleting video file:", err);
      setError(err.response?.data?.message || "Failed to delete video file");
      setShowDeleteVideoFileConfirm(false);
    } finally {
      setDeletingVideoFile(false);
    }
  };

  const handleDeleteThumbnail = async () => {
    if (!video || !video.thumbnailUrl) return;

    try {
      setDeletingThumbnail(true);
      setError("");
      await videoService.deleteThumbnail(videoId);
      // Clear thumbnail preview immediately
      setThumbnailPreview(null);
      setSelectedThumbnail(null);
      // Refetch video data to get updated state
      const updatedVideo = await videoService.getVideoById(videoId);
      setVideo(updatedVideo);
      // Ensure thumbnailUrl is cleared in state
      if (updatedVideo) {
        setVideo({ ...updatedVideo, thumbnailUrl: null });
      }
      setShowDeleteThumbnailConfirm(false);
    } catch (err: any) {
      console.error("Error deleting thumbnail:", err);
      setError(err.response?.data?.message || "Failed to delete thumbnail");
      setShowDeleteThumbnailConfirm(false);
    } finally {
      setDeletingThumbnail(false);
    }
  };

  const handleDeleteAudio = async () => {
    if (!video || !video.audioUrl) return;

    try {
      setDeletingAudio(true);
      setError("");
      await videoService.deleteAudio(videoId);
      // Clear audio preview immediately
      setAudioPreview(null);
      setSelectedAudio(null);
      // Refetch video data to get updated state
      const updatedVideo = await videoService.getVideoById(videoId);
      setVideo(updatedVideo);
      // Ensure audioUrl is cleared in state
      if (updatedVideo) {
        setVideo({ ...updatedVideo, audioUrl: null });
      }
      setShowDeleteAudioConfirm(false);
    } catch (err: any) {
      console.error("Error deleting audio file:", err);
      setError(err.response?.data?.message || "Failed to delete audio file");
      setShowDeleteAudioConfirm(false);
    } finally {
      setDeletingAudio(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Video not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-gray-900">Edit Video</h1>
          <p className="text-sm text-gray-500 mt-1">Update video details</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="px-4 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Video
          </button>
          <button
            onClick={() => router.push("/dashboard/videos")}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
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
                <option value="">Select collection</option>
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
                <option value="premium">Premium</option>
                <option value="free">Free</option>
              </select>
            </div>

            {/* Video File Upload */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Video File</label>
                {video?.cloudflareVideoId && videoPreview && !selectedVideoFile && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteVideoFileConfirm(true)}
                    disabled={deletingVideoFile}
                    className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove Video
                  </button>
                )}
              </div>
              {(!video?.cloudflareVideoId || video?.cloudflareVideoId === "" || !videoPreview || selectedVideoFile) && (
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileSelect}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20"
                />
              )}
              {videoPreview && (video?.cloudflareVideoId || selectedVideoFile) && (
                <div className="mt-2">
                  <video 
                    src={videoPreview} 
                    controls 
                    className="max-w-full h-48 rounded-lg"
                    onError={(e) => {
                      console.error("Video failed to load, clearing preview");
                      setVideoPreview(null);
                    }}
                  />
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Thumbnail</label>
                {video?.thumbnailUrl && thumbnailPreview && !selectedThumbnail && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteThumbnailConfirm(true)}
                    disabled={deletingThumbnail}
                    className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove Thumbnail
                  </button>
                )}
              </div>
              {(!video?.thumbnailUrl || video?.thumbnailUrl === "" || !thumbnailPreview || selectedThumbnail) && (
                <div className="space-y-2">
                  <div className="flex gap-2">
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
                  {!selectedVideoFile && video?.cloudflareVideoId && (
                    <p className="text-xs text-gray-500">
                      💡 To select a thumbnail from video frames, upload a new video file above first.
                    </p>
                  )}
                </div>
              )}
              {thumbnailPreview && (video?.thumbnailUrl || selectedThumbnail) && (
                <div className="mt-2">
                  <img 
                    src={thumbnailPreview} 
                    alt="Thumbnail" 
                    className="h-24 w-40 rounded-lg object-cover"
                    onError={(e) => {
                      console.error("Thumbnail failed to load, clearing preview");
                      setThumbnailPreview(null);
                    }}
                  />
                  {selectedThumbnail && (
                    <p className="text-xs text-gray-500 mt-1">
                      New thumbnail selected: {selectedThumbnail.name}
                    </p>
                  )}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Audio File (Optional)</label>
                {video?.audioUrl && audioPreview && !selectedAudio && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteAudioConfirm(true)}
                    disabled={deletingAudio}
                    className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove Audio
                  </button>
                )}
              </div>
              {(!video?.audioUrl || video?.audioUrl === "" || !audioPreview || selectedAudio) && (
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioSelect}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20"
                />
              )}
              {selectedAudio && <p className="mt-1 text-sm text-gray-600">{selectedAudio.name}</p>}
              {audioPreview && video?.audioUrl && !selectedAudio && (
                <div className="mt-2">
                  <audio 
                    src={audioPreview} 
                    controls 
                    className="w-full rounded-lg"
                    onError={(e) => {
                      console.error("Audio failed to load, clearing preview");
                      setAudioPreview(null);
                    }}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Tutorial Video (Step-by-Step Breakdown) (Optional)</label>
                {tutorialStep && tutorialStep.videoUrl && !selectedTutorialVideoFile && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteTutorialConfirm(true)}
                    disabled={deletingTutorial}
                    className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove Tutorial Video
                  </button>
                )}
              </div>
              {(!tutorialStep || !tutorialStep.videoUrl || tutorialStep.videoUrl === "" || selectedTutorialVideoFile) && (
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
              )}
              {tutorialVideoPreview && (tutorialStep?.videoUrl || selectedTutorialVideoFile) && (
                <div className="mt-2">
                  <video 
                    src={tutorialVideoPreview} 
                    controls 
                    className="max-w-full h-48 rounded-lg"
                    onError={(e) => {
                      console.error("Tutorial video failed to load, clearing preview");
                      setTutorialVideoPreview(null);
                    }}
                  />
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
                ? "Updating..."
                : "Update Video"}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Tutorial Video Confirmation Modal */}
      {showDeleteTutorialConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
          onClick={() => !deletingTutorial && setShowDeleteTutorialConfirm(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Remove Tutorial Video</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to remove the tutorial video? This will delete the video file from Cloudflare R2, but you can upload a new tutorial video afterward.
              </p>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteTutorialConfirm(false)}
                disabled={deletingTutorial}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!tutorialStep) return;
                  try {
                    setDeletingTutorial(true);
                    setError("");
                    await videoStepService.deleteVideoStep(tutorialStep.id);
                    setTutorialStep(null);
                    setTutorialVideoPreview(null);
                    setShowDeleteTutorialConfirm(false);
                  } catch (err: any) {
                    console.error("Error deleting tutorial video:", err);
                    setError(err.response?.data?.message || "Failed to delete tutorial video");
                    setShowDeleteTutorialConfirm(false);
                  } finally {
                    setDeletingTutorial(false);
                  }
                }}
                disabled={deletingTutorial}
                className="px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingTutorial ? "Removing..." : "Remove Tutorial Video"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Video File Confirmation Modal */}
      {showDeleteVideoFileConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
          onClick={() => !deletingVideoFile && setShowDeleteVideoFileConfirm(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Remove Video File</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to remove the current video file? This will delete the file from Cloudflare R2, but you can upload a new video file afterward.
              </p>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteVideoFileConfirm(false)}
                disabled={deletingVideoFile}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVideoFile}
                disabled={deletingVideoFile}
                className="px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingVideoFile ? "Removing..." : "Remove Video"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Thumbnail Confirmation Modal */}
      {showDeleteThumbnailConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
          onClick={() => !deletingThumbnail && setShowDeleteThumbnailConfirm(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Remove Thumbnail</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to remove the current thumbnail? This will delete the file from Cloudflare R2, but you can upload a new thumbnail afterward.
              </p>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteThumbnailConfirm(false)}
                disabled={deletingThumbnail}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteThumbnail}
                disabled={deletingThumbnail}
                className="px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingThumbnail ? "Removing..." : "Remove Thumbnail"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Audio Confirmation Modal */}
      {showDeleteAudioConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
          onClick={() => !deletingAudio && setShowDeleteAudioConfirm(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Remove Audio File</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to remove the current audio file? This will delete the file from Cloudflare R2, but you can upload a new audio file afterward.
              </p>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteAudioConfirm(false)}
                disabled={deletingAudio}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAudio}
                disabled={deletingAudio}
                className="px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingAudio ? "Removing..." : "Remove Audio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Entire Video Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
          onClick={() => !deleting && setShowDeleteConfirm(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Video</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete "{video?.title}"? This action cannot be undone and will also delete the video file from Cloudflare R2.
              </p>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Frame Selector Modal */}
      {showFrameSelector && selectedVideoFile && (
        <VideoFrameSelector
          videoFile={selectedVideoFile}
          videoUrl={null}
          onFrameSelect={handleFrameSelect}
          onClose={() => setShowFrameSelector(false)}
        />
      )}
    </div>
  );
}

