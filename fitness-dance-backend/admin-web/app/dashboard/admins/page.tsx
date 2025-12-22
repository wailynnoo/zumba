"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import adminService, { Admin, AdminRole } from "@/lib/services/adminService";
import ImageCropModal from "@/components/ImageCropModal";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Zod schema for form validation
const adminSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || val.length >= 8,
      { message: "Password must be at least 8 characters" }
    ),
  displayName: z.string().max(100).optional().or(z.literal("")),
  avatarUrl: z.string().optional().refine(
    (val) => !val || val === "" || val.startsWith("blob:") || z.string().url().safeParse(val).success,
    { message: "Must be a valid URL" }
  ),
  adminRoleId: z.string().uuid("Please select a role"),
  isActive: z.boolean().default(true),
});

type AdminFormData = z.infer<typeof adminSchema>;

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; admin: Admin | null }>({
    isOpen: false,
    admin: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [cropModal, setCropModal] = useState<{ isOpen: boolean; imageSrc: string; adminId?: string }>({
    isOpen: false,
    imageSrc: "",
  });
  const [passwordResetModal, setPasswordResetModal] = useState<{ isOpen: boolean; admin: Admin | null }>({
    isOpen: false,
    admin: null,
  });

  // Pagination, search, and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      avatarUrl: "",
      adminRoleId: "",
      isActive: true,
    },
  });

  const isEditing = !!editingAdmin;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch admin roles on mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const fetchedRoles = await adminService.getAdminRoles();
        setRoles(fetchedRoles);
      } catch (err: any) {
        console.error("Failed to fetch roles:", err);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
        console.error("API URL:", apiUrl);
        console.error("Error details:", {
          message: err.message,
          code: err.code,
          response: err.response?.data,
          status: err.response?.status,
        });
        
        // Show helpful error message for network errors
        if (err.code === "ERR_NETWORK" || err.code === "ECONNREFUSED") {
          setError(
            `Cannot connect to API server at ${apiUrl}. Please ensure the admin-api server is running.`
          );
        } else if (err.response?.status === 401) {
          setError("Authentication failed. Please log in again.");
        } else if (err.response?.status === 403) {
          setError("You don't have permission to view admin roles.");
        } else {
          setError(`Failed to fetch admin roles: ${err.response?.data?.message || err.message}`);
        }
        
        // Fallback: extract roles from admins if API fails
        const uniqueRoles = Array.from(
          new Map(admins.map((admin) => [admin.adminRole.id, admin.adminRole])).values()
        );
        setRoles(uniqueRoles);
      }
    };

    fetchRoles();
  }, []); // Only run on mount

  // Also update roles when admins change (as fallback)
  useEffect(() => {
    if (roles.length === 0 && admins.length > 0) {
      const uniqueRoles = Array.from(
        new Map(admins.map((admin) => [admin.adminRole.id, admin.adminRole])).values()
      );
      setRoles(uniqueRoles);
    }
  }, [admins, roles.length]);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await adminService.getAdmins({
        page: currentPage,
        limit: 20,
        isActive: statusFilter !== "all" ? statusFilter === "active" : undefined,
        adminRoleId: roleFilter !== "all" ? roleFilter : undefined,
        search: debouncedSearch.trim() || undefined,
      });

      setAdmins(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch admins");
      setAdmins([]);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, roleFilter, currentPage]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const onSubmit = async (data: AdminFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", errors);
    console.log("Is editing:", isEditing);
    console.log("Editing admin:", editingAdmin);
    
    try {
      setError("");
      setSuccess("");
      const payload: any = {
        email: data.email.trim(),
        displayName: data.displayName?.trim() || undefined,
        adminRoleId: data.adminRoleId,
        isActive: data.isActive,
      };

      if (editingAdmin) {
        // Update (password not included in update)
        // Only include avatarUrl if it's a valid URL (not empty, not blob URL, and not from pending upload)
        if (data.avatarUrl && data.avatarUrl.trim() && !data.avatarUrl.includes("blob:") && !pendingAvatarFile) {
          payload.avatarUrl = data.avatarUrl.trim();
        }
        
        await adminService.updateAdmin(editingAdmin.id, payload);
        
        // If there's a pending avatar file, upload it after the update
        if (pendingAvatarFile) {
          await adminService.uploadAdminAvatar(editingAdmin.id, pendingAvatarFile);
          setPendingAvatarFile(null);
        }
        
        setSuccess("Admin updated successfully");
      } else {
        // Create (password required)
        if (!data.password || data.password.length < 8) {
          setError("Password is required and must be at least 8 characters");
          setTimeout(() => setError(""), 5000);
          return;
        }
        payload.password = data.password;
        const newAdmin = await adminService.createAdmin(payload);
        setSuccess("Admin created successfully");
        
        // If there's a pending avatar file, upload it after creation
        if (pendingAvatarFile) {
          try {
            await adminService.uploadAdminAvatar(newAdmin.id, pendingAvatarFile);
            setPendingAvatarFile(null);
          } catch (avatarErr: any) {
            console.error("Failed to upload avatar after admin creation:", avatarErr);
            // Don't fail the whole operation if avatar upload fails
          }
        }
      }

      setIsModalOpen(false);
      reset();
      setEditingAdmin(null);
      setAvatarPreview(null);
      setPendingAvatarFile(null);
      await fetchAdmins();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to save admin";
      if (err.response?.data?.errors) {
        console.error("Backend validation errors:", err.response.data.errors);
      }
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleEdit = (admin: Admin) => {
    reset({
      email: admin.email,
      password: "", // Don't pre-fill password
      displayName: admin.displayName || "",
      avatarUrl: admin.avatarUrl || "",
      adminRoleId: admin.adminRoleId,
      isActive: admin.isActive,
    });
    setEditingAdmin(admin);
    setAvatarPreview(admin.avatarUrl || null);
    setIsModalOpen(true);
  };

  const handleFileSelect = (file: File, adminId?: string) => {
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      setTimeout(() => setError(""), 5000);
      return;
    }
    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed");
      setTimeout(() => setError(""), 5000);
      return;
    }
    // Create preview URL and show crop modal
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageSrc = e.target?.result as string;
      setCropModal({ isOpen: true, imageSrc, adminId });
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedFile: File) => {
    try {
      setUploadingAvatar(true);
      setError("");
      
      // If editing existing admin, upload directly
      if (cropModal.adminId) {
        const result = await adminService.uploadAdminAvatar(cropModal.adminId, croppedFile);
        // Update form with new avatar URL
        setValue("avatarUrl", result.avatarUrl || "");
        setAvatarPreview(result.avatarUrl);
        // Refresh the admin data to get the latest info
        const updatedAdmin = await adminService.getAdminById(cropModal.adminId);
        setEditingAdmin(updatedAdmin);
        setSuccess("Avatar uploaded successfully");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        // For new admin, create a preview URL and store file temporarily
        // We'll upload it after admin is created
        const previewUrl = URL.createObjectURL(croppedFile);
        setAvatarPreview(previewUrl);
        setPendingAvatarFile(croppedFile);
        // Don't set avatarUrl - we'll handle it after admin creation
        setValue("avatarUrl", "");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload avatar");
      setTimeout(() => setError(""), 5000);
    } finally {
      setUploadingAvatar(false);
      setCropModal({ isOpen: false, imageSrc: "" });
    }
  };

  const handleAvatarDelete = async () => {
    if (editingAdmin) {
      try {
        setError("");
        setSuccess("");
        await adminService.deleteAdminAvatar(editingAdmin.id);
        setValue("avatarUrl", "");
        setAvatarPreview(null);
        setSuccess("Avatar deleted successfully");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to delete avatar");
        setTimeout(() => setError(""), 5000);
      }
    } else {
      // For new admin, just clear preview
      setAvatarPreview(null);
      setValue("avatarUrl", "");
      setPendingAvatarFile(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.admin) return;

    try {
      setDeleteLoading(true);
      setError("");
      setSuccess("");
      await adminService.deleteAdmin(deleteConfirm.admin.id);
      setDeleteConfirm({ isOpen: false, admin: null });
      setSuccess("Admin deleted successfully");
      await fetchAdmins();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete admin");
      setTimeout(() => setError(""), 5000);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleStatus = async (admin: Admin) => {
    try {
      setToggleLoading(admin.id);
      setError("");
      setSuccess("");
      await adminService.toggleAdminStatus(admin.id);
      setSuccess(`Admin ${!admin.isActive ? "activated" : "deactivated"} successfully`);
      await fetchAdmins();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to toggle admin status");
      setTimeout(() => setError(""), 5000);
    } finally {
      setToggleLoading(null);
    }
  };

  const handlePasswordReset = async (newPassword: string) => {
    if (!passwordResetModal.admin) return;

    try {
      setError("");
      setSuccess("");
      await adminService.resetPassword(passwordResetModal.admin.id, { newPassword });
      setPasswordResetModal({ isOpen: false, admin: null });
      setSuccess("Password reset successfully");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password");
      setTimeout(() => setError(""), 5000);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Users</h1>
          <p className="text-gray-600 mt-1">Manage admin accounts and permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              reset();
              setEditingAdmin(null);
              setIsModalOpen(true);
            }}
            className="px-6 py-3 bg-gradient-zfit text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            + Add Admin
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email or name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BBD45] focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "all" | "active" | "inactive");
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BBD45] focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BBD45] focus:border-transparent"
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Admin List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading admins...</div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No admins found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-zfit flex items-center justify-center text-white font-semibold">
                          {admin.displayName?.[0]?.toUpperCase() || admin.email[0].toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {admin.displayName || "No name"}
                          </div>
                          <div className="text-sm text-gray-500">{admin.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {admin.adminRole.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(admin)}
                        disabled={toggleLoading === admin.id}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                          admin.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        } ${toggleLoading === admin.id ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
                      >
                        {toggleLoading === admin.id ? "..." : admin.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.createdBy ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {admin.createdBy.displayName || admin.createdBy.email}
                          </div>
                          <div className="text-xs text-gray-400">{admin.createdBy.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.lastLoginAt
                        ? new Date(admin.lastLoginAt).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(admin)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setPasswordResetModal({ isOpen: true, admin })}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, admin })}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} admins
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page === pagination.totalPages}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4"
          onClick={() => {
            setIsModalOpen(false);
            reset();
            setEditingAdmin(null);
            setAvatarPreview(null);
            setPendingAvatarFile(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? "Edit Admin" : "Create Admin"}
              </h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Display all form errors */}
              {Object.keys(errors).length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</p>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {errors.email && <li>Email: {errors.email.message}</li>}
                    {errors.password && <li>Password: {errors.password.message}</li>}
                    {errors.displayName && <li>Display Name: {errors.displayName.message}</li>}
                    {errors.avatarUrl && <li>Avatar URL: {errors.avatarUrl.message}</li>}
                    {errors.adminRoleId && <li>Role: {errors.adminRoleId.message}</li>}
                  </ul>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  {...register("email")}
                  type="email"
                  className={`w-full rounded-lg border-2 px-4 py-3 text-sm text-gray-900 transition-all ${
                    errors.email
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20"
                  } focus:outline-none focus:ring-4`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <input
                    {...register("password")}
                    type="password"
                    className={`w-full rounded-lg border-2 px-4 py-3 text-sm text-gray-900 transition-all ${
                      errors.password
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20"
                    } focus:outline-none focus:ring-4`}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <input
                  {...register("displayName")}
                  type="text"
                  className="w-full rounded-lg border-2 px-4 py-3 text-sm text-gray-900 border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20 focus:outline-none focus:ring-4 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
                <div className="flex items-center space-x-4">
                  {avatarPreview || watch("avatarUrl") ? (
                    <img
                      src={avatarPreview || watch("avatarUrl") || ""}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <label className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition-all cursor-pointer">
                        {uploadingAvatar ? "Uploading..." : "Upload Image"}
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Validate file size (5MB max)
                              if (file.size > 5 * 1024 * 1024) {
                                setError("File size must be less than 5MB");
                                setTimeout(() => setError(""), 5000);
                                return;
                              }
                              // Validate file type
                              const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
                              if (!validTypes.includes(file.type)) {
                                setError("Only JPEG, PNG, and WebP images are allowed");
                                setTimeout(() => setError(""), 5000);
                                return;
                              }
                              // Show crop modal
                              handleFileSelect(file, editingAdmin?.id);
                            }
                          }}
                          disabled={uploadingAvatar}
                        />
                      </label>
                      {(avatarPreview || watch("avatarUrl")) && (
                        <button
                          type="button"
                          onClick={handleAvatarDelete}
                          className="px-4 py-2 bg-red-100 border border-red-300 rounded-lg text-red-700 font-medium hover:bg-red-200 transition-all"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Supported formats: JPEG, PNG, WebP. Max size: 5MB
                    </p>
                    {/* Hidden input for URL (for external URLs if needed) */}
                    <input
                      {...register("avatarUrl")}
                      type="hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  {...register("adminRoleId")}
                  className={`w-full rounded-lg border-2 px-4 py-3 text-sm text-gray-900 transition-all ${
                    errors.adminRoleId
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20"
                  } focus:outline-none focus:ring-4`}
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                {errors.adminRoleId && (
                  <p className="text-red-500 text-sm mt-1">{errors.adminRoleId.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  {...register("isActive")}
                  type="checkbox"
                  className="h-4 w-4 text-[#6BBD45] focus:ring-[#6BBD45] border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Active</label>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                    setEditingAdmin(null);
                    setAvatarPreview(null);
                    setPendingAvatarFile(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-zfit text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4"
          onClick={() => setDeleteConfirm({ isOpen: false, admin: null })}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Admin</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete {deleteConfirm.admin?.email}? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, admin: null })}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {passwordResetModal.isOpen && (
        <PasswordResetModal
          admin={passwordResetModal.admin}
          onClose={() => setPasswordResetModal({ isOpen: false, admin: null })}
          onReset={handlePasswordReset}
        />
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

// Password Reset Modal Component
function PasswordResetModal({
  admin,
  onClose,
  onReset,
}: {
  admin: Admin | null;
  onClose: () => void;
  onReset: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    onReset(password);
    setPassword("");
    setConfirmPassword("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Reset Password</h3>
          <p className="text-gray-600 mb-6">
            Reset password for {admin?.email}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border-2 px-4 py-3 text-sm text-gray-900 border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20 focus:outline-none focus:ring-4 transition-all"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border-2 px-4 py-3 text-sm text-gray-900 border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20 focus:outline-none focus:ring-4 transition-all"
                required
                minLength={8}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-zfit text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Reset Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


