"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import videoService, { Video } from "@/lib/services/videoService";
import VideoList from "./components/VideoList";
import categoryService from "@/lib/services/categoryService";
import collectionService from "@/lib/services/collectionService";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function VideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; video: Video | null }>({
    isOpen: false,
    video: null,
  });

  // Pagination, search, and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "unpublished">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [videoTypeFilter, setVideoTypeFilter] = useState<"all" | "premium" | "free">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Reference data for filters
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [collections, setCollections] = useState<Array<{ id: string; name: string }>>([]);

  // Thumbnail URLs cache (videoId -> signedUrl)
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  // Fetch categories and collections for filters
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [catsResult, collectionsResult] = await Promise.all([
          categoryService.getCategories({ limit: 100 }),
          collectionService.getCollections({ limit: 100 }),
        ]);
        setCategories(catsResult.data.map(cat => ({ id: cat.id, name: cat.name })));
        setCollections(collectionsResult.data.map(col => ({ id: col.id, name: col.name })));
      } catch (err) {
        console.error("Error fetching reference data:", err);
      }
    };
    fetchReferenceData();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, collectionFilter, videoTypeFilter]);

  // Fetch videos
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const result = await videoService.getVideos({
        page: currentPage,
        limit: 20,
        isPublished: statusFilter !== "all" ? statusFilter === "published" : undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        collectionId: collectionFilter !== "all" ? collectionFilter : undefined,
        videoType: videoTypeFilter !== "all" ? videoTypeFilter : undefined,
        search: debouncedSearch.trim() || undefined,
      });
      
      setVideos(result.data);
      setPagination(result.pagination);

      // Fetch all thumbnail URLs in batch (fixes N+1 query problem)
      const videosWithThumbnails = result.data.filter(v => v.thumbnailUrl);
      if (videosWithThumbnails.length > 0) {
        const videoIds = videosWithThumbnails.map(v => v.id);
        const batchUrls = await videoService.getBatchThumbnailUrls(videoIds);
        setThumbnailUrls(prev => ({ ...prev, ...batchUrls }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch videos");
      setVideos([]);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, categoryFilter, collectionFilter, videoTypeFilter, currentPage]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleEdit = (video: Video) => {
    router.push(`/dashboard/videos/edit/${video.id}`);
  };

  const handleDeleteClick = (video: Video) => {
    setDeleteConfirm({ isOpen: true, video });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.video) return;

    try {
      await videoService.deleteVideo(deleteConfirm.video.id);
      setDeleteConfirm({ isOpen: false, video: null });
      await fetchVideos();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete video");
      setTimeout(() => setError(""), 5000);
      setDeleteConfirm({ isOpen: false, video: null });
    }
  };

  const handleTogglePublished = async (id: string) => {
    try {
      await videoService.togglePublishedStatus(id);
      await fetchVideos();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update video status");
      setTimeout(() => setError(""), 5000);
    }
  };

  const openCreateModal = () => {
    router.push("/dashboard/videos/new");
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-gray-900">Videos</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your video content</p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-xl bg-gradient-zfit px-6 py-3 font-semibold text-white shadow-lg shadow-[#6BBD45]/20 transition-all hover:shadow-xl hover:shadow-[#6BBD45]/30"
        >
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Video
          </span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search videos by title, description, category, collection..."
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 pl-10 pr-10 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20 transition-all"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "published" | "unpublished")}
                className="rounded-lg border-2 border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20 transition-all"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border-2 border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20 transition-all min-w-[150px]"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Collection:</label>
              <select
                value={collectionFilter}
                onChange={(e) => setCollectionFilter(e.target.value)}
                className="rounded-lg border-2 border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20 transition-all min-w-[150px]"
              >
                <option value="all">All Collections</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Type:</label>
              <select
                value={videoTypeFilter}
                onChange={(e) => setVideoTypeFilter(e.target.value as "all" | "premium" | "free")}
                className="rounded-lg border-2 border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20 transition-all"
              >
                <option value="all">All Types</option>
                <option value="premium">Premium</option>
                <option value="free">Free</option>
              </select>
            </div>

            {(searchTerm || statusFilter !== "all" || categoryFilter !== "all" || collectionFilter !== "all" || videoTypeFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                  setCollectionFilter("all");
                  setVideoTypeFilter("all");
                }}
                className="ml-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Search Results Count */}
          {debouncedSearch && (
            <div className="text-sm text-gray-600">
              Found {pagination.total} video{pagination.total !== 1 ? "s" : ""} matching "{debouncedSearch}"
            </div>
          )}
        </div>
      </div>

      {/* Videos List */}
      <VideoList
        videos={videos}
        loading={loading}
        pagination={pagination}
        thumbnailUrls={thumbnailUrls}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onTogglePublished={handleTogglePublished}
        onPageChange={setCurrentPage}
        onCreateNew={openCreateModal}
      />


      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
          onClick={() => setDeleteConfirm({ isOpen: false, video: null })}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Video</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete "{deleteConfirm.video?.title}"? This action cannot be undone.
              </p>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, video: null })}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

