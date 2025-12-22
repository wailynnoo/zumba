"use client";

import { useEffect, useState } from "react";
import adminService, { Admin } from "@/lib/services/adminService";
import { getAccessToken } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ImageCropModal from "@/components/ImageCropModal";

// Schema for profile update
const profileSchema = z.object({
  displayName: z.string().max(100).optional().or(z.literal("")),
  avatarUrl: z.union([
    z.string().url("Must be a valid URL"),
    z.literal(""),
  ]).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Simple JWT decode function (for getting payload only, no verification)
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

export default function ProfilePage() {
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropModal, setCropModal] = useState<{ isOpen: boolean; imageSrc: string }>({
    isOpen: false,
    imageSrc: "",
  });
  const [changePasswordModal, setChangePasswordModal] = useState<{ isOpen: boolean }>({
    isOpen: false,
  });
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  // React Hook Form for profile editing
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      avatarUrl: "",
    },
  });

  // Get current admin ID from token
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      try {
        const decoded = decodeJWT(token);
        setCurrentAdminId(decoded?.adminId || null);
      } catch (err) {
        console.error("Failed to decode token:", err);
      }
    }
  }, []);

  // Fetch current admin details
  const fetchCurrentAdmin = async () => {
    if (!currentAdminId) return;

    try {
      setLoading(true);
      setError("");
      const admin = await adminService.getAdminById(currentAdminId);
      setCurrentAdmin(admin);
      // Reset form with current values
      reset({
        displayName: admin.displayName || "",
        avatarUrl: admin.avatarUrl || "",
      });
    } catch (err: any) {
      console.error("Failed to fetch admin:", err);
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentAdminId) {
      fetchCurrentAdmin();
    }
  }, [currentAdminId]);

  const handleChangePassword = async (oldPassword: string, newPassword: string) => {
    if (!currentAdminId) return;

    try {
      setError("");
      setSuccess("");
      await adminService.changePassword(currentAdminId, { oldPassword, newPassword });
      setChangePasswordModal({ isOpen: false });
      setSuccess("Password changed successfully");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to change password");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleEditProfile = () => {
    if (currentAdmin) {
      reset({
        displayName: currentAdmin.displayName || "",
        avatarUrl: currentAdmin.avatarUrl || "",
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    if (currentAdmin) {
      reset({
        displayName: currentAdmin.displayName || "",
        avatarUrl: currentAdmin.avatarUrl || "",
      });
      setIsEditing(false);
    }
  };

  const handleFileSelect = (file: File) => {
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
      setCropModal({ isOpen: true, imageSrc });
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedFile: File) => {
    if (!currentAdminId) return;

    try {
      setUploadingAvatar(true);
      setError("");
      setSuccess("");
      const result = await adminService.uploadAdminAvatar(currentAdminId, croppedFile);
      setCurrentAdmin(result.admin);
      // Update form with new avatar URL
      reset({
        displayName: result.admin.displayName || "",
        avatarUrl: result.avatarUrl || "",
      });
      setSuccess("Avatar uploaded successfully");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload avatar");
      setTimeout(() => setError(""), 5000);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!currentAdminId) return;

    try {
      setError("");
      setSuccess("");
      const admin = await adminService.deleteAdminAvatar(currentAdminId);
      setCurrentAdmin(admin);
      // Update form
      reset({
        displayName: admin.displayName || "",
        avatarUrl: "",
      });
      setSuccess("Avatar deleted successfully");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete avatar");
      setTimeout(() => setError(""), 5000);
    }
  };

  const onSubmitProfile = async (data: ProfileFormData) => {
    if (!currentAdminId) return;

    try {
      setError("");
      setSuccess("");
      const updateData: any = {};
      if (data.displayName !== undefined) {
        updateData.displayName = data.displayName.trim() || null;
      }
      // Note: avatarUrl is now handled via file upload, not through this form

      await adminService.updateAdmin(currentAdminId, updateData);
      setIsEditing(false);
      setSuccess("Profile updated successfully");
      await fetchCurrentAdmin(); // Refresh profile data
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
      setTimeout(() => setError(""), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account information and security</p>
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

      {/* Profile Information */}
      {currentAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
            {!isEditing && (
              <button
                onClick={handleEditProfile}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Avatar Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
                  <div className="flex items-center space-x-4">
                    {currentAdmin?.avatarUrl ? (
                      <img
                        src={currentAdmin.avatarUrl}
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
                                handleFileSelect(file);
                              }
                            }}
                            disabled={uploadingAvatar}
                          />
                        </label>
                        {currentAdmin?.avatarUrl && (
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
                    </div>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                  <input
                    type="text"
                    {...register("displayName")}
                    placeholder="Enter display name"
                    className="w-full rounded-lg border-2 px-4 py-3 text-sm text-gray-900 border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20 focus:outline-none focus:ring-4 transition-all"
                  />
                  {errors.displayName && (
                    <p className="text-red-500 text-sm mt-1">{errors.displayName.message}</p>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                    {currentAdmin.email} (cannot be changed)
                  </div>
                </div>

                {/* Role (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                    {currentAdmin.adminRole.name} (cannot be changed)
                  </div>
                </div>

                {/* Status (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        currentAdmin.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {currentAdmin.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Last Login (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Login</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                    {currentAdmin.lastLoginAt
                      ? new Date(currentAdmin.lastLoginAt).toLocaleString()
                      : "Never"}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-zfit text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Avatar Display */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
                <div className="flex items-center space-x-4">
                  {currentAdmin.avatarUrl ? (
                    <img
                      src={currentAdmin.avatarUrl}
                      alt="Profile avatar"
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
                            handleFileSelect(file);
                          }
                        }}
                        disabled={uploadingAvatar}
                      />
                    </label>
                    {currentAdmin.avatarUrl && (
                      <button
                        type="button"
                        onClick={handleAvatarDelete}
                        className="px-4 py-2 bg-red-100 border border-red-300 rounded-lg text-red-700 font-medium hover:bg-red-200 transition-all"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: JPEG, PNG, WebP. Max size: 5MB
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {currentAdmin.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {currentAdmin.displayName || "Not set"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {currentAdmin.adminRole.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      currentAdmin.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {currentAdmin.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Login</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {currentAdmin.lastLoginAt
                    ? new Date(currentAdmin.lastLoginAt).toLocaleString()
                    : "Never"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Created At</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {currentAdmin.createdAt
                    ? new Date(currentAdmin.createdAt).toLocaleString()
                    : "N/A"}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Security</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Password</h3>
            <p className="text-sm text-gray-600 mt-1">
              Change your password to keep your account secure
            </p>
          </div>
          <button
            onClick={() => setChangePasswordModal({ isOpen: true })}
            className="px-6 py-2 bg-gradient-zfit text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {changePasswordModal.isOpen && (
        <ChangePasswordModal
          onClose={() => setChangePasswordModal({ isOpen: false })}
          onChangePassword={handleChangePassword}
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

// Change Password Modal Component
function ChangePasswordModal({
  onClose,
  onChangePassword,
}: {
  onClose: () => void;
  onChangePassword: (oldPassword: string, newPassword: string) => void;
}) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (oldPassword.length === 0) {
      setError("Old password is required");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (oldPassword === newPassword) {
      setError("New password must be different from old password");
      return;
    }

    onChangePassword(oldPassword, newPassword);
    setOldPassword("");
    setNewPassword("");
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
          <h3 className="text-lg font-bold text-gray-900 mb-4">Change Password</h3>
          <p className="text-gray-600 mb-6">
            Change your account password
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Old Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full rounded-lg border-2 px-4 py-3 text-sm text-gray-900 border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20 focus:outline-none focus:ring-4 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border-2 px-4 py-3 text-sm text-gray-900 border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20 focus:outline-none focus:ring-4 transition-all"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
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
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

