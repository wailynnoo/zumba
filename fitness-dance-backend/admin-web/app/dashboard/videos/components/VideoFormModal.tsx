"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Video } from "@/lib/services/videoService";
import { useRef, useEffect } from "react";

// Zod schema for form validation
const videoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  description: z.string().optional().or(z.literal("")),
  categoryId: z.string().uuid("Category is required"),
  subcategoryId: z.string().uuid().optional().nullable(),
  collectionId: z.string().uuid().optional().nullable(),
  danceStyleId: z.string().uuid("Dance style is required"),
  intensityLevelId: z.string().uuid("Intensity level is required"),
  videoType: z.enum(["premium", "youtube_short"]),
  youtubeVideoId: z.string().optional().or(z.literal("")),
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

interface VideoFormModalProps {
  isOpen: boolean;
  editingVideo: Video | null;
  categories: Category[];
  danceStyles: { id: string; name: string }[];
  intensityLevels: { id: string; name: string }[];
  selectedVideoFile: File | null;
  selectedThumbnail: File | null;
  selectedAudio: File | null;
  videoPreview: string | null;
  thumbnailPreview: string | null;
  uploadingVideo: boolean;
  uploadingThumbnail: boolean;
  uploadingAudio: boolean;
  onClose: () => void;
  onSubmit: (data: VideoFormData) => Promise<void>;
  onVideoFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onThumbnailSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAudioSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function VideoFormModal({
  isOpen,
  editingVideo,
  categories,
  danceStyles,
  intensityLevels,
  selectedVideoFile,
  selectedThumbnail,
  selectedAudio,
  videoPreview,
  thumbnailPreview,
  uploadingVideo,
  uploadingThumbnail,
  uploadingAudio,
  onClose,
  onSubmit,
  onVideoFileSelect,
  onThumbnailSelect,
  onAudioSelect,
}: VideoFormModalProps) {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      subcategoryId: null,
      collectionId: null,
      danceStyleId: "",
      intensityLevelId: "",
      videoType: "premium" as const,
      youtubeVideoId: "",
      hasAudioMode: true,
      durationSeconds: null,
      isPublished: false,
      sortOrder: 0,
    },
  });

  // Reset form when editingVideo changes
  useEffect(() => {
    if (editingVideo) {
      reset({
        title: editingVideo.title,
        description: editingVideo.description || "",
        categoryId: editingVideo.categoryId,
        subcategoryId: editingVideo.subcategoryId || null,
        collectionId: editingVideo.collectionId || null,
        danceStyleId: editingVideo.danceStyleId,
        intensityLevelId: editingVideo.intensityLevelId,
        videoType: editingVideo.videoType,
        youtubeVideoId: editingVideo.youtubeVideoId || "",
        hasAudioMode: editingVideo.hasAudioMode,
        durationSeconds: editingVideo.durationSeconds || null,
        isPublished: editingVideo.isPublished,
        sortOrder: editingVideo.sortOrder,
      });
    } else {
      reset({
        title: "",
        description: "",
        categoryId: "",
        subcategoryId: null,
        collectionId: null,
        danceStyleId: "",
        intensityLevelId: "",
        videoType: "premium" as const,
        youtubeVideoId: "",
        hasAudioMode: true,
        durationSeconds: null,
        isPublished: false,
        sortOrder: 0,
      });
    }
  }, [editingVideo, reset]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingVideo ? "Edit Video" : "Create Video"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 pt-6 pb-4">
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

              {/* Dance Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dance Style *</label>
                <select
                  {...register("danceStyleId")}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20"
                >
                  <option value="">Select dance style</option>
                  {danceStyles.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.name}
                    </option>
                  ))}
                </select>
                {errors.danceStyleId && (
                  <p className="mt-1 text-sm text-red-600">{errors.danceStyleId.message}</p>
                )}
              </div>

              {/* Intensity Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intensity Level *</label>
                <select
                  {...register("intensityLevelId")}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20"
                >
                  <option value="">Select intensity level</option>
                  {intensityLevels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
                {errors.intensityLevelId && (
                  <p className="mt-1 text-sm text-red-600">{errors.intensityLevelId.message}</p>
                )}
              </div>

              {/* Video Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video Type</label>
                <select
                  {...register("videoType")}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20"
                >
                  <option value="premium">Premium</option>
                  <option value="youtube_short">YouTube Short</option>
                </select>
              </div>

              {/* YouTube Video ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Video ID</label>
                <input
                  {...register("youtubeVideoId")}
                  type="text"
                  placeholder="Optional"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20"
                />
              </div>

              {/* Video File Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Video File</label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={onVideoFileSelect}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20"
                />
                {videoPreview && (
                  <div className="mt-2">
                    <video src={videoPreview} controls className="max-w-full h-48 rounded-lg" />
                  </div>
                )}
                {uploadingVideo && <p className="mt-1 text-sm text-blue-600">Uploading video...</p>}
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onThumbnailSelect}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20"
                />
                {thumbnailPreview && (
                  <div className="mt-2">
                    <img src={thumbnailPreview} alt="Thumbnail" className="h-24 w-40 rounded-lg object-cover" />
                  </div>
                )}
                {uploadingThumbnail && <p className="mt-1 text-sm text-blue-600">Uploading thumbnail...</p>}
              </div>

              {/* Audio Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audio File (Optional)</label>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={onAudioSelect}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20"
                />
                {selectedAudio && <p className="mt-1 text-sm text-gray-600">{selectedAudio.name}</p>}
                {uploadingAudio && <p className="mt-1 text-sm text-blue-600">Uploading audio...</p>}
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
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadingVideo || uploadingThumbnail || uploadingAudio}
              className="px-6 py-2 text-sm font-semibold text-white bg-gradient-zfit rounded-lg shadow-lg shadow-[#6BBD45]/20 hover:shadow-xl hover:shadow-[#6BBD45]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting || uploadingVideo || uploadingThumbnail || uploadingAudio
                ? "Saving..."
                : editingVideo
                  ? "Update Video"
                  : "Create Video"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

