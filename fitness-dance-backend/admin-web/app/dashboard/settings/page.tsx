"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import settingsService, { SystemSetting } from "@/lib/services/settingsService";

// Schema for setting form
const settingSchema = z.object({
  key: z.string().min(1, "Key is required").max(100, "Key must be 100 characters or less"),
  value: z.string().optional(),
  type: z.enum(["string", "number", "boolean", "json"]),
  category: z.string().optional(),
  description: z.string().optional(),
});

type SettingFormData = z.infer<typeof settingSchema>;

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; setting: SystemSetting | null }>({
    isOpen: false,
    setting: null,
  });

  // Refs to prevent duplicate fetches
  const hasFetchedRef = useRef(false);
  const fetchingRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingFormData>({
    resolver: zodResolver(settingSchema),
    defaultValues: {
      key: "",
      value: "",
      type: "string",
      category: "",
      description: "",
    },
  });

  const isEditing = !!editingSetting;

  useEffect(() => {
    const fetchData = async () => {
      if (fetchingRef.current || hasFetchedRef.current) return;
      fetchingRef.current = true;

      try {
        setLoading(true);
        setError("");

        const [settingsData, categoriesData] = await Promise.all([
          settingsService.getSettings(selectedCategory === "all" ? undefined : selectedCategory),
          settingsService.getCategories(),
        ]);

        setSettings(settingsData);
        setCategories(categoriesData);
        hasFetchedRef.current = true;
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load settings");
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchData();
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      const [settingsData, categoriesData] = await Promise.all([
        settingsService.getSettings(selectedCategory === "all" ? undefined : selectedCategory),
        settingsService.getCategories(),
      ]);
      setSettings(settingsData);
      setCategories(categoriesData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load settings");
    }
  };

  const onSubmit = async (data: SettingFormData) => {
    try {
      setError("");
      setSuccess("");

      if (editingSetting) {
        await settingsService.updateSetting(editingSetting.key, {
          value: data.value || undefined,
          type: data.type,
          category: data.category || undefined,
          description: data.description || undefined,
        });
        setSuccess("Setting updated successfully");
      } else {
        await settingsService.createSetting({
          key: data.key,
          value: data.value,
          type: data.type,
          category: data.category,
          description: data.description,
        });
        setSuccess("Setting created successfully");
      }

      setIsModalOpen(false);
      reset();
      setEditingSetting(null);
      hasFetchedRef.current = false;
      await fetchData();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save setting");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleEdit = (setting: SystemSetting) => {
      reset({
      key: setting.key,
      value: setting.value || "",
      type: setting.type,
      category: setting.category || "",
      description: setting.description || "",
    });
    setEditingSetting(setting);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.setting) return;

    try {
      setError("");
      setSuccess("");
      await settingsService.deleteSetting(deleteConfirm.setting.key);
      setDeleteConfirm({ isOpen: false, setting: null });
      setSuccess("Setting deleted successfully");
      hasFetchedRef.current = false;
      await fetchData();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete setting");
      setTimeout(() => setError(""), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Manage system-wide configuration settings</p>
        </div>
        <button
          onClick={() => {
            reset();
            setEditingSetting(null);
            setIsModalOpen(true);
          }}
          className="px-6 py-3 bg-gradient-zfit text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105"
        >
          + Add Setting
        </button>
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

      {/* Category Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            hasFetchedRef.current = false;
          }}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BBD45] focus:border-transparent"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
          </div>

      {/* Settings List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading settings...</div>
        ) : settings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No settings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settings.map((setting) => (
                  <tr key={setting.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 font-mono">{setting.key}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {setting.value || <span className="text-gray-400 italic">No value</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {setting.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{setting.category || "—"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {setting.description || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(setting)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, setting })}
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
                    </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4"
          onClick={() => {
            setIsModalOpen(false);
            reset();
            setEditingSetting(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? "Edit Setting" : "Create Setting"}
              </h2>
                  </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key *</label>
                  <input
                    {...register("key")}
                    type="text"
                    className={`w-full rounded-lg border-2 px-4 py-3 text-sm font-mono text-gray-900 transition-all ${
                      errors.key
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20"
                    } focus:outline-none focus:ring-4`}
                    placeholder="e.g., app_name"
                  />
                  {errors.key && <p className="text-red-500 text-sm mt-1">{errors.key.message}</p>}
                </div>
              )}

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                <textarea
                  {...register("value")}
                  rows={3}
                  className="w-full rounded-lg border-2 px-4 py-3 text-sm text-gray-900 border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20 focus:outline-none focus:ring-4 transition-all"
                  placeholder="Enter setting value"
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  {...register("type")}
                  className="w-full rounded-lg border-2 px-4 py-3 text-sm text-gray-900 border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20 focus:outline-none focus:ring-4 transition-all"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="json">JSON</option>
                </select>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  {...register("category")}
                  type="text"
                  className="w-full rounded-lg border-2 px-4 py-3 text-sm text-gray-900 border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20 focus:outline-none focus:ring-4 transition-all"
                  placeholder="e.g., General, Payment, Email"
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  {...register("description")}
                  rows={2}
                  className="w-full rounded-lg border-2 px-4 py-3 text-sm text-gray-900 border-gray-200 focus:border-[#6BBD45] focus:ring-[#6BBD45]/20 focus:outline-none focus:ring-4 transition-all"
                  placeholder="Describe what this setting does"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                    setEditingSetting(null);
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
          onClick={() => setDeleteConfirm({ isOpen: false, setting: null })}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Setting</h3>
          <p className="text-gray-600 mb-6">
                Are you sure you want to delete the setting <strong>{deleteConfirm.setting?.key}</strong>? This action
                cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
              <button
                  onClick={() => setDeleteConfirm({ isOpen: false, setting: null })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                  Delete
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
