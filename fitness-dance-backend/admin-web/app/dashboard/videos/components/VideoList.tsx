"use client";

import { Video } from "@/lib/services/videoService";

interface VideoListProps {
  videos: Video[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  thumbnailUrls: Record<string, string>; // videoId -> signedUrl
  onEdit: (video: Video) => void;
  onDelete: (video: Video) => void;
  onTogglePublished: (id: string) => void;
  onPageChange: (page: number) => void;
  onCreateNew: () => void;
}

// Component to display video thumbnail with R2 support
function VideoThumbnail({ video, thumbnailUrl }: { video: Video; thumbnailUrl?: string }) {
  // Use pre-fetched thumbnail URL if available, otherwise check if it's already a valid URL
  const displayUrl = thumbnailUrl || 
    (video.thumbnailUrl && (video.thumbnailUrl.startsWith("http://") || video.thumbnailUrl.startsWith("https://"))
      ? video.thumbnailUrl
      : null);

  if (!displayUrl) {
    return (
      <div className="h-16 w-28 rounded-lg bg-gray-200 flex items-center justify-center">
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={displayUrl}
      alt={video.title}
      className="h-16 w-28 rounded-lg object-cover"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

export default function VideoList({
  videos,
  loading,
  pagination,
  thumbnailUrls,
  onEdit,
  onDelete,
  onTogglePublished,
  onPageChange,
  onCreateNew,
}: VideoListProps) {
  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading videos...</div>
      </div>
    );
  }

  return (
    <>
      {/* Videos Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Thumbnail
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {videos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg
                      className="h-12 w-12 text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <p>No videos found</p>
                    <button
                      onClick={onCreateNew}
                      className="mt-4 text-sm text-[#6BBD45] hover:text-[#5A9E3A] font-medium"
                    >
                      Create your first video
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              videos.map((video) => (
                <tr key={video.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {video.thumbnailUrl ? (
                      <VideoThumbnail video={video} thumbnailUrl={thumbnailUrls[video.id]} />
                    ) : (
                      <div className="h-16 w-28 rounded-lg bg-gray-200 flex items-center justify-center">
                        <svg
                          className="h-8 w-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{video.title}</div>
                    {video.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">{video.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{video.category?.name || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => onTogglePublished(video.id)}
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        video.isPublished
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      {video.isPublished ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(video)}
                        className="rounded-lg px-3 py-1 text-[#6BBD45] font-medium transition-colors hover:bg-[#6BBD45]/10 hover:text-[#5A9E3A]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(video)}
                        className="rounded-lg px-3 py-1 text-red-600 font-medium transition-colors hover:bg-red-50 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-4">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} videos
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}

