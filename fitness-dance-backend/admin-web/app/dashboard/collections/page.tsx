"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import collectionService from "@/lib/services/collectionService";
import categoryService from "@/lib/services/categoryService";
import type { Category } from "@/lib/services/categoryService";
import type { Collection } from "@/lib/services/collectionService";
import ImageCropModal from "@/components/ImageCropModal";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Zod schema for form validation
const collectionSchema = z.object({
  categoryId: z.string().uuid("Category is required"),
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  slug: z.string().optional(),
  description: z.string().default(""),
  thumbnailUrl: z.string().default(""),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; collection: Collection | null }>({
    isOpen: false,
    collection: null,
  });

  // Pagination, search, and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropModal, setCropModal] = useState<{ isOpen: boolean; imageSrc: string }>({
    isOpen: false,
    imageSrc: "",
  });
  
  // Signed URLs cache for R2 images
  const [imageUrlCache, setImageUrlCache] = useState<Record<string, string>>({});

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      categoryId: "",
      name: "",
      slug: "",
      description: "",
      thumbnailUrl: "",
      isFeatured: false,
      isActive: true,
      sortOrder: 0,
    },
  });

  // Watch name to auto-generate slug
  const nameValue = watch("name");
  const isEditing = !!editingCollection;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Auto-generate slug from name (only when creating, not editing)
  useEffect(() => {
    if (!isEditing && nameValue) {
      const slug = nameValue
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("slug", slug);
    }
  }, [nameValue, isEditing, setValue]);

  // Fetch categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await categoryService.getCategories({ limit: 100 });
        setCategories(result.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const result = await collectionService.getCollections({
        page: currentPage,
        limit: 20,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        isActive: statusFilter !== "all" ? statusFilter === "active" : undefined,
        search: debouncedSearch.trim() || undefined,
      });
      
      setCollections(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch collections");
      setCollections([]);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, categoryFilter, currentPage]);

  // Fetch collections when filters change
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Helper function to get thumbnail URL (handles R2 keys and legacy URLs)
  const getThumbnailUrl = useCallback(async (collection: Collection): Promise<string | null> => {
    if (!collection.thumbnailUrl) return null;
    
    // If it's already a full URL (signed URL or legacy URL), return as is
    if (collection.thumbnailUrl.startsWith("http://") || collection.thumbnailUrl.startsWith("https://")) {
      return collection.thumbnailUrl;
    }
    
    // If it's an R2 key (starts with collections/ or thumbnails/), fetch signed URL
    if (collection.thumbnailUrl.startsWith("collections/") || collection.thumbnailUrl.startsWith("thumbnails/")) {
      // Check cache first
      if (imageUrlCache[collection.id]) {
        return imageUrlCache[collection.id];
      }
      
      try {
        const signedUrl = await collectionService.getThumbnailUrl(collection.id);
        setImageUrlCache((prev) => ({ ...prev, [collection.id]: signedUrl }));
        return signedUrl;
      } catch (error) {
        console.error("Error fetching signed URL for collection thumbnail:", error);
        return null;
      }
    }
    
    return collection.thumbnailUrl;
  }, [imageUrlCache]);
  
  // Component to display collection thumbnail with R2 support
  const CollectionThumbnail = ({ collection }: { collection: Collection }) => {
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      getThumbnailUrl(collection).then((url) => {
        setThumbnailUrl(url);
        setLoading(false);
      });
    }, [collection, getThumbnailUrl]);
    
    if (loading || !thumbnailUrl) {
      return (
        <div className="h-16 w-28 rounded-lg bg-gray-200 flex items-center justify-center">
          <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      );
    }
    
    return (
      <img
        src={thumbnailUrl}
        alt={collection.name}
        className="h-16 w-28 rounded-lg object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  };

  const onSubmit = async (data: CollectionFormData) => {
    try {
      const payload = {
        categoryId: data.categoryId,
        name: data.name.trim(),
        slug: data.slug?.trim() || undefined,
        description: data.description?.trim() || undefined,
        thumbnailUrl: data.thumbnailUrl?.trim() || undefined,
        isFeatured: data.isFeatured,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      };

      let collectionId: string;

      if (editingCollection) {
        // Update
        const updated = await collectionService.updateCollection(editingCollection.id, payload);
        collectionId = updated.id;
        
        // Upload image if selected
        if (selectedImage) {
          setUploadingImage(true);
          try {
            await collectionService.uploadCollectionThumbnail(collectionId, selectedImage);
            // Clear cache for this collection to force refresh
            setImageUrlCache((prev) => {
              const newCache = { ...prev };
              delete newCache[collectionId];
              return newCache;
            });
          } catch (uploadErr: any) {
            console.error("Image upload error:", uploadErr);
            setError(uploadErr.response?.data?.message || "Failed to upload thumbnail");
            setTimeout(() => setError(""), 5000);
          } finally {
            setUploadingImage(false);
          }
        }
      } else {
        // Create
        const newCollection = await collectionService.createCollection(payload);
        collectionId = newCollection.id;
        
        // Upload image if selected
        if (selectedImage) {
          setUploadingImage(true);
          try {
            await collectionService.uploadCollectionThumbnail(collectionId, selectedImage);
            // Clear cache for this collection to force refresh
            setImageUrlCache((prev) => {
              const newCache = { ...prev };
              delete newCache[collectionId];
              return newCache;
            });
          } catch (uploadErr: any) {
            console.error("Image upload error:", uploadErr);
            setError(uploadErr.response?.data?.message || "Failed to upload thumbnail");
            setTimeout(() => setError(""), 5000);
          } finally {
            setUploadingImage(false);
          }
        }
      }

      setIsModalOpen(false);
      reset();
      setEditingCollection(null);
      setSelectedImage(null);
      setImagePreview(null);
      await fetchCollections();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to save collection";
      if (err.response?.data?.errors) {
        console.error("Backend validation errors:", err.response.data.errors);
      } else {
        setError(errorMessage);
        setTimeout(() => setError(""), 5000);
      }
    }
  };

  const handleEdit = async (collection: Collection) => {
    const collectionData = collection as any;
    
    reset({
      categoryId: String(collectionData.categoryId || ""),
      name: String(collectionData.name || ""),
      slug: String(collectionData.slug || ""),
      description: String(collectionData.description || ""),
      thumbnailUrl: String(collectionData.thumbnailUrl || ""),
      isFeatured: Boolean(collectionData.isFeatured ?? false),
      isActive: Boolean(collectionData.isActive ?? true),
      sortOrder: Number(collectionData.sortOrder ?? 0),
    });
    
    // Set image preview if collection has thumbnail
    if (collection.thumbnailUrl) {
      if (collection.thumbnailUrl.startsWith("collections/") || collection.thumbnailUrl.startsWith("thumbnails/")) {
        try {
          const signedUrl = await collectionService.getThumbnailUrl(collection.id);
          setImagePreview(signedUrl);
          setImageUrlCache((prev) => ({ ...prev, [collection.id]: signedUrl }));
        } catch (error) {
          console.error("Error fetching signed URL for preview:", error);
          setImagePreview(null);
        }
      } else if (collection.thumbnailUrl.startsWith("http://") || collection.thumbnailUrl.startsWith("https://")) {
        setImagePreview(collection.thumbnailUrl);
      } else {
        setImagePreview(collection.thumbnailUrl);
      }
    } else {
      setImagePreview(null);
    }
    setSelectedImage(null);
    
    setEditingCollection(collection);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (collection: Collection) => {
    setDeleteConfirm({ isOpen: true, collection });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.collection) return;

    try {
      await collectionService.deleteCollection(deleteConfirm.collection!.id);
      setDeleteConfirm({ isOpen: false, collection: null });
      await fetchCollections();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete collection");
      setTimeout(() => setError(""), 5000);
      setDeleteConfirm({ isOpen: false, collection: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, collection: null });
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await collectionService.toggleCollectionStatus(id);
      await fetchCollections();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update collection status");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      await collectionService.toggleFeaturedStatus(id);
      await fetchCollections();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update featured status");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStatusFilterChange = (status: "all" | "active" | "inactive") => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (categoryId: string) => {
    setCategoryFilter(categoryId);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
  };

  const openCreateModal = () => {
    setEditingCollection(null);
    reset({
      categoryId: categoryFilter !== "all" ? categoryFilter : "",
      name: "",
      slug: "",
      description: "",
      thumbnailUrl: "",
      isFeatured: false,
      isActive: true,
      sortOrder: 0,
    });
    setSelectedImage(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCollection(null);
    setSelectedImage(null);
    setImagePreview(null);
    setTimeout(() => {
      reset({
        categoryId: "",
        name: "",
        slug: "",
        description: "",
        thumbnailUrl: "",
        isFeatured: false,
        isActive: true,
        sortOrder: 0,
      });
    }, 100);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed");
      setTimeout(() => setError(""), 5000);
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      setTimeout(() => setError(""), 5000);
      return;
    }

    // Create preview URL and show crop modal
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageSrc = e.target?.result as string;
      setCropModal({ isOpen: true, imageSrc });
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedFile: File) => {
    setSelectedImage(croppedFile);
    
    // Create preview from cropped file
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(croppedFile);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (loading && collections.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading collections...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-gray-900">
            Collections
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your video collections</p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-xl bg-gradient-zfit px-6 py-3 font-semibold text-white shadow-lg shadow-[#6BBD45]/20 transition-all hover:shadow-xl hover:shadow-[#6BBD45]/30"
        >
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Collection
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
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search collections..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BBD45] focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryFilterChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BBD45] focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:w-40">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as "all" | "active" | "inactive")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BBD45] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collections Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thumbnail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Videos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {collections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No collections found
                  </td>
                </tr>
              ) : (
                collections.map((collection) => (
                  <tr key={collection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CollectionThumbnail key={`${collection.id}-${collection.thumbnailUrl}`} collection={collection} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{collection.name}</div>
                      {collection.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{collection.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{collection.category?.name || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{collection._count?.videos || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(collection.id)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          collection.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {collection.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleFeatured(collection.id)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          collection.isFeatured
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {collection.isFeatured ? "Featured" : "Not Featured"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(collection)}
                          className="text-[#6BBD45] hover:text-[#5aa837]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(collection)}
                          className="text-red-600 hover:text-red-800"
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
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} collections
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCollection ? "Edit Collection" : "Create Collection"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* Category */}
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="categoryId"
                    {...register("categoryId")}
                    className={`w-full rounded-lg border-2 px-4 py-3 text-sm text-gray-900 transition-all ${
                      errors.categoryId
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20"
                    } focus:outline-none focus:ring-4`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    {...register("name")}
                    className={`w-full rounded-lg border-2 px-4 py-3 text-sm text-gray-900 transition-all ${
                      errors.name
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20"
                    } focus:outline-none focus:ring-4`}
                    placeholder="e.g., Summer Collection"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Slug */}
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (auto-generated)
                  </label>
                  <input
                    type="text"
                    id="slug"
                    {...register("slug")}
                    className={`w-full rounded-lg border-2 px-4 py-3 text-sm font-mono text-gray-900 transition-all ${
                      errors.slug
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20"
                    } focus:outline-none focus:ring-4`}
                    placeholder="e.g., summer-collection"
                  />
                  {errors.slug && (
                    <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Auto-generated from name
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    {...register("description")}
                    rows={3}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20 transition-all"
                    placeholder="Brief description of this collection..."
                  />
                </div>

                {/* Thumbnail Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail Image
                  </label>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mb-4 relative w-full aspect-square max-w-xs mx-auto">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* File Input - Only show if no image is selected/previewed */}
                  {!imagePreview && (
                    <div className="flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="thumbnail"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="thumbnail"
                        className="flex-1 cursor-pointer rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-center hover:border-[#6BBD45] hover:bg-[#6BBD45]/5 transition-colors"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600">Click to upload image</span>
                          <span className="text-xs text-gray-500">JPEG, PNG, WebP (max 5MB)</span>
                        </div>
                      </label>
                    </div>
                  )}
                  
                  {/* Show change image button if preview exists */}
                  {imagePreview && (
                    <div className="flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="thumbnail"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="thumbnail"
                        className="cursor-pointer rounded-lg border-2 border-gray-300 px-4 py-2 text-center text-sm text-gray-700 hover:border-[#6BBD45] hover:bg-[#6BBD45]/5 transition-colors"
                      >
                        Change Image
                      </label>
                    </div>
                  )}
                </div>

                {/* Featured */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register("isFeatured")}
                    className="h-4 w-4 text-[#6BBD45] focus:ring-[#6BBD45] border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Featured Collection
                  </label>
                </div>

                {/* Active */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register("isActive")}
                    className="h-4 w-4 text-[#6BBD45] focus:ring-[#6BBD45] border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Active
                  </label>
                </div>

                {/* Sort Order */}
                <div>
                  <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    id="sortOrder"
                    {...register("sortOrder", { valueAsNumber: true })}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20 transition-all"
                    placeholder="0"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-gradient-zfit text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : editingCollection ? "Update" : "Create"}
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
          onClick={handleDeleteCancel}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Collection</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deleteConfirm.collection?.name}"? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      {cropModal.isOpen && (
        <ImageCropModal
          imageSrc={cropModal.imageSrc}
          onClose={() => setCropModal({ isOpen: false, imageSrc: "" })}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}
    </div>
  );
}

