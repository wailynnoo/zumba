"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import categoryService from "@/lib/services/categoryService";
import { getFullImageUrl } from "@/lib/utils/imageUrl";
import ImageCropModal from "@/components/ImageCropModal";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Zod schema for form validation
const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug must be 100 characters or less").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().default(""),
  iconUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; category: Category | null }>({
    isOpen: false,
    category: null,
  });

  // Pagination, search, and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
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
  // Track which category IDs we're currently fetching to prevent duplicate requests
  const fetchingRef = useRef<Set<string>>(new Set());

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      iconUrl: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  // Watch name to auto-generate slug
  const nameValue = watch("name");
  const isEditing = !!editingCategory;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on new search
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

  // Auto-generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const result = await categoryService.getCategories({
        page: currentPage,
        limit: 20,
        isActive: statusFilter !== "all" ? statusFilter === "active" : undefined,
        search: debouncedSearch.trim() || undefined,
      });
      
      setCategories(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch categories");
      setCategories([]);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, currentPage]);

  // Fetch categories when filters change
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch all category image URLs in batch after categories are loaded
  useEffect(() => {
    if (loading || categories.length === 0) return;

    const fetchAllImageUrls = async () => {
      // Filter categories that need signed URLs (R2 keys)
      // Check both cache and fetching ref to avoid duplicate requests
      const categoriesNeedingUrls = categories.filter(
        (cat) =>
          cat.iconUrl &&
          cat.iconUrl.startsWith("categories/") &&
          !imageUrlCache[cat.id] &&
          !fetchingRef.current.has(cat.id) &&
          !cat.iconUrl.startsWith("http://") &&
          !cat.iconUrl.startsWith("https://")
      );

      if (categoriesNeedingUrls.length === 0) return;

      // Mark all as being fetched
      categoriesNeedingUrls.forEach((cat) => {
        fetchingRef.current.add(cat.id);
      });

      try {
        // Fetch all image URLs in parallel
        const urlPromises = categoriesNeedingUrls.map(async (cat) => {
          try {
            const signedUrl = await categoryService.getCategoryImageUrl(cat.id);
            return { categoryId: cat.id, url: signedUrl };
          } catch (error) {
            console.error(`Error fetching signed URL for category ${cat.id}:`, error);
            return null;
          }
        });

        const results = await Promise.all(urlPromises);
        
        // Update cache with all fetched URLs at once
        const newCacheEntries: Record<string, string> = {};
        results.forEach((result) => {
          if (result) {
            newCacheEntries[result.categoryId] = result.url;
            // Remove from fetching set
            fetchingRef.current.delete(result.categoryId);
          }
        });

        if (Object.keys(newCacheEntries).length > 0) {
          setImageUrlCache((prev) => ({ ...prev, ...newCacheEntries }));
        }
      } catch (error) {
        // On error, remove from fetching set
        categoriesNeedingUrls.forEach((cat) => {
          fetchingRef.current.delete(cat.id);
        });
      }
    };

    fetchAllImageUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.map(c => `${c.id}:${c.iconUrl || ''}`).join(','), loading]); // Re-fetch when category IDs or iconUrls change
  
  // Component to display category image with R2 support
  const CategoryImage = ({ category }: { category: Category }) => {
    // Get image URL from cache or construct it directly
    const getDisplayUrl = (): string | null => {
      if (!category.iconUrl) return null;
      
      // If it's already a full URL (signed URL or legacy URL), return as is
      if (category.iconUrl.startsWith("http://") || category.iconUrl.startsWith("https://")) {
        return category.iconUrl;
      }
      
      // If it's an R2 key, check cache first
      if (category.iconUrl.startsWith("categories/")) {
        return imageUrlCache[category.id] || null;
      }
      
      // Legacy: Use getFullImageUrl for old local file paths
      return getFullImageUrl(category.iconUrl);
    };

    const displayUrl = getDisplayUrl();
    
    if (!displayUrl) {
      return null;
    }
    
    return (
      <img
        src={displayUrl}
        alt={category.name}
        className="h-10 w-10 rounded-lg object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const payload = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description?.trim() || undefined,
        // iconUrl is set via image upload, not manually
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      };

      if (editingCategory) {
        // Update
        await categoryService.updateCategory(editingCategory.id, payload);
        
        // Upload image if selected
        if (selectedImage) {
          setUploadingImage(true);
          try {
            await categoryService.uploadCategoryImage(editingCategory.id, selectedImage);
            // Clear the image URL cache for this category to force refresh
            setImageUrlCache((prev) => {
              const newCache = { ...prev };
              delete newCache[editingCategory.id];
              return newCache;
            });
            // Refresh category data to get the uploaded image URL
            const updatedCategory = await categoryService.getCategoryById(editingCategory.id);
            // Set server image as preview
            if (updatedCategory.iconUrl) {
              if (updatedCategory.iconUrl.startsWith("categories/")) {
                try {
                  const signedUrl = await categoryService.getCategoryImageUrl(updatedCategory.id);
                  setImagePreview(signedUrl);
                  // Update cache with new signed URL
                  setImageUrlCache((prev) => ({ ...prev, [editingCategory.id]: signedUrl }));
                } catch (error) {
                  console.error("Error fetching signed URL:", error);
                }
              } else {
                setImagePreview(updatedCategory.iconUrl);
              }
            }
            // Clear selected image (server image is now shown)
            setSelectedImage(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          } catch (uploadErr: any) {
            console.error("Image upload error:", uploadErr);
            setError(uploadErr.response?.data?.message || "Failed to upload image");
            setTimeout(() => setError(""), 5000);
          } finally {
            setUploadingImage(false);
          }
        }
      } else {
        // Create
        const newCategory = await categoryService.createCategory(payload);
        
        // Upload image if selected
        if (selectedImage) {
          setUploadingImage(true);
          try {
            await categoryService.uploadCategoryImage(newCategory.id, selectedImage);
            // Refresh category data to get the uploaded image URL
            const updatedCategory = await categoryService.getCategoryById(newCategory.id);
            // Set server image as preview
            if (updatedCategory.iconUrl) {
              if (updatedCategory.iconUrl.startsWith("categories/")) {
                try {
                  const signedUrl = await categoryService.getCategoryImageUrl(updatedCategory.id);
                  setImagePreview(signedUrl);
                  // Update cache with new signed URL
                  setImageUrlCache((prev) => ({ ...prev, [updatedCategory.id]: signedUrl }));
                } catch (error) {
                  console.error("Error fetching signed URL:", error);
                }
              } else {
                setImagePreview(updatedCategory.iconUrl);
              }
            }
            // Clear selected image (server image is now shown)
            setSelectedImage(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          } catch (uploadErr: any) {
            console.error("Image upload error:", uploadErr);
            setError(uploadErr.response?.data?.message || "Failed to upload image");
            setTimeout(() => setError(""), 5000);
          } finally {
            setUploadingImage(false);
          }
        }
      }

      setIsModalOpen(false);
      reset();
      setEditingCategory(null);
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Clear cache and refresh categories to show updated images
      setImageUrlCache({});
      await fetchCategories();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to save category";
      if (err.response?.data?.errors) {
        // Validation errors from backend
        console.error("Backend validation errors:", err.response.data.errors);
      } else {
        setError(errorMessage);
        setTimeout(() => setError(""), 5000);
      }
    }
  };

  const handleEdit = async (category: Category) => {
    console.log("Editing category object:", category); // Debug
    
    // Handle both camelCase and snake_case from API
    const categoryData = category as any;
    
    // Set form values using react-hook-form's reset
    reset({
      name: String(categoryData.name || ""),
      slug: String(categoryData.slug || ""),
      description: String(categoryData.description || ""),
      iconUrl: "", // Managed via image upload, not manual input
      isActive: Boolean(categoryData.isActive ?? categoryData.is_active ?? true),
      sortOrder: Number(categoryData.sortOrder ?? categoryData.sort_order ?? 0),
    });
    
    // Set image preview if category has image
    if (category.iconUrl) {
      // If it's an R2 key, fetch signed URL
      if (category.iconUrl.startsWith("categories/")) {
        try {
          const signedUrl = await categoryService.getCategoryImageUrl(category.id);
          setImagePreview(signedUrl);
          setImageUrlCache((prev) => ({ ...prev, [category.id]: signedUrl }));
        } catch (error) {
          console.error("Error fetching signed URL for preview:", error);
          setImagePreview(null);
        }
      } else if (category.iconUrl.startsWith("http://") || category.iconUrl.startsWith("https://")) {
        // Already a full URL (signed URL or external)
        setImagePreview(category.iconUrl);
      } else {
        // Legacy: Use getFullImageUrl for old local file paths
        setImagePreview(getFullImageUrl(category.iconUrl) || category.iconUrl);
      }
    } else {
      setImagePreview(null);
    }
    setSelectedImage(null);
    
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setDeleteConfirm({ isOpen: true, category });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.category) return;

    try {
      await api.delete(`/api/categories/${deleteConfirm.category.id}`);
      setDeleteConfirm({ isOpen: false, category: null });
      await fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete category");
      setTimeout(() => setError(""), 5000);
      setDeleteConfirm({ isOpen: false, category: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, category: null });
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/api/categories/${id}/toggle-status`);
      await fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update category status");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStatusFilterChange = (status: "all" | "active" | "inactive") => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({
      name: "",
      slug: "",
      description: "",
      iconUrl: "",
      isActive: true,
      sortOrder: 0,
    });
    setSelectedImage(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setSelectedImage(null);
    setImagePreview(null);
    // Reset form after modal closes to ensure clean state
    setTimeout(() => {
      reset({
        name: "",
        slug: "",
        description: "",
        iconUrl: "",
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

  const handleDeleteImage = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      await categoryService.deleteCategoryImage(categoryId);
      await fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete image");
      setTimeout(() => setError(""), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-gray-900">
            Categories
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your video categories</p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-xl bg-gradient-zfit px-6 py-3 font-semibold text-white shadow-lg shadow-[#6BBD45]/20 transition-all hover:shadow-xl hover:shadow-[#6BBD45]/30"
        >
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Category
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
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search categories by name, slug, or description..."
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 pl-10 pr-10 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20 transition-all"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as "all" | "active" | "inactive")}
              className="rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20 transition-all"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mt-3 text-sm text-gray-600">
            Showing {categories.length} of {pagination.total} categories
            {debouncedSearch && (
              <span className="ml-2">
                for "<span className="font-medium">{debouncedSearch}</span>"
              </span>
            )}
          </div>
        )}
      </div>

      {/* Categories Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Description
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
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg className="h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <p>No categories found</p>
                    <button
                      onClick={openCreateModal}
                      className="mt-4 text-sm text-[#6BBD45] hover:text-[#5A9E3A] font-medium"
                    >
                      Create your first category
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      {category.iconUrl && (
                        <CategoryImage 
                          key={`${category.id}-${category.iconUrl}`}
                          category={category} 
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {category.slug}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {category.description || (
                      <span className="text-gray-400 italic">No description</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(category.id, category.isActive)}
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        category.isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }`}
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="rounded-lg px-3 py-1 text-[#6BBD45] font-medium transition-colors hover:bg-[#6BBD45]/10 hover:text-[#5A9E3A]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(category)}
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

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-4">
          <div className="text-sm text-gray-700">
            Page <span className="font-medium">{pagination.page}</span> of{" "}
            <span className="font-medium">{pagination.totalPages}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? "bg-[#6BBD45] text-white"
                        : "text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages || loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

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
                {editingCategory ? "Edit Category" : "Create Category"}
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
                  placeholder="e.g., Zumba Fitness"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  Slug <span className="text-red-500">*</span>
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
                  placeholder="e.g., zumba-fitness"
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Lowercase letters, numbers, and hyphens only
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
                  placeholder="Brief description of this category..."
                />
              </div>

              {/* Category Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Image
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
                      id="image"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="image"
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
                      id="image"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="image"
                      className="cursor-pointer rounded-lg border-2 border-gray-300 px-4 py-2 text-center text-sm text-gray-700 hover:border-[#6BBD45] hover:bg-[#6BBD45]/5 transition-colors"
                    >
                      Change Image
                    </label>
                  </div>
                )}

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
                <p className="mt-1 text-xs text-gray-500">Lower numbers appear first</p>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register("isActive")}
                  className="h-4 w-4 text-[#6BBD45] focus:ring-[#6BBD45] border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                  Active (visible to users)
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingImage}
                  className="px-6 py-2 text-sm font-semibold text-white bg-gradient-zfit rounded-lg shadow-lg shadow-[#6BBD45]/20 hover:shadow-xl hover:shadow-[#6BBD45]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {uploadingImage
                    ? "Uploading Image..."
                    : isSubmitting
                    ? "Saving..."
                    : editingCategory
                    ? "Update Category"
                    : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && deleteConfirm.category && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4"
          onClick={handleDeleteCancel}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <div className="flex items-center justify-center pt-8 pb-4">
              <div className="rounded-full bg-red-100 p-4">
                <svg
                  className="h-12 w-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Category?</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteConfirm.category.name}"</span>?
              </p>
              <p className="text-sm text-red-600 mb-6">
                This action cannot be undone. All associated data will be permanently deleted.
              </p>

              {/* Actions */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-600/30"
                >
                  Delete Category
                </button>
              </div>
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
