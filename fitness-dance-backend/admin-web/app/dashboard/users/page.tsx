"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import userService, { User } from "@/lib/services/userService";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  // Refs to prevent duplicate fetches
  const hasFetchedRef = useRef(false);
  const fetchingRef = useRef(false);

  // Pagination, search, and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [verificationFilter, setVerificationFilter] = useState<"all" | "verified" | "unverified">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    if (fetchingRef.current || hasFetchedRef.current) return;
    fetchingRef.current = true;

    try {
      setLoading(true);
      setError("");

      const result = await userService.getUsers({
        page: currentPage,
        limit: 20,
        search: debouncedSearch.trim() || undefined,
        isActive: statusFilter !== "all" ? statusFilter === "active" : undefined,
        isEmailVerified: verificationFilter === "verified" ? true : verificationFilter === "unverified" ? false : undefined,
      });

      setUsers(result.data);
      setPagination(result.pagination);
      hasFetchedRef.current = true;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch users");
      setUsers([]);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [debouncedSearch, statusFilter, verificationFilter, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleViewUser = async (userId: string) => {
    try {
      setError("");
      const user = await userService.getUserById(userId);
      setViewingUser(user);
      setIsViewModalOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch user details");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      setToggleLoading(userId);
      setError("");
      setSuccess("");
      await userService.toggleUserStatus(userId);
      setSuccess("User status updated successfully");
      await fetchUsers();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to toggle user status");
      setTimeout(() => setError(""), 5000);
    } finally {
      setToggleLoading(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">View and manage user accounts</p>
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
              placeholder="Search by email, phone, or name..."
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

          {/* Verification Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Verification</label>
            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value as "all" | "verified" | "unverified");
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6BBD45] focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-zfit flex items-center justify-center text-white font-semibold">
                          {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || user.phoneNumber?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || "No name"}
                          </div>
                          <div className="text-sm text-gray-500">ID: {user.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email || "No email"}</div>
                      <div className="text-sm text-gray-500">{user.phoneNumber || "No phone"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {user.isEmailVerified && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Email ✓
                          </span>
                        )}
                        {user.isPhoneVerified && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Phone ✓
                          </span>
                        )}
                        {!user.isEmailVerified && !user.isPhoneVerified && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        disabled={toggleLoading === user.id}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        } ${toggleLoading === user.id ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
                      >
                        {toggleLoading === user.id ? "..." : user.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewUser(user.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
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
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
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

      {/* View User Modal */}
      {isViewModalOpen && viewingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4"
          onClick={() => {
            setIsViewModalOpen(false);
            setViewingUser(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {viewingUser.displayName || <span className="text-gray-400 italic">Not set</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {viewingUser.email || <span className="text-gray-400 italic">Not set</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {viewingUser.phoneNumber || <span className="text-gray-400 italic">Not set</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Verified</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    {viewingUser.isEmailVerified ? (
                      <span className="text-green-600 font-medium">
                        Yes {viewingUser.emailVerifiedAt && <span className="text-gray-500 text-sm">({formatDate(viewingUser.emailVerifiedAt)})</span>}
                      </span>
                    ) : (
                      <span className="text-red-600">No</span>
                    )}
                  </div>
                </div>
                {viewingUser._count && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Active Subscriptions</label>
                      <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {viewingUser._count.subscriptions || 0}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Playlists</label>
                      <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {viewingUser._count.playlists || 0}
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Login</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {viewingUser.lastLoginAt ? formatDate(viewingUser.lastLoginAt) : <span className="text-gray-400 italic">Never</span>}
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      viewingUser.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {viewingUser.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Verified</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    {viewingUser.isPhoneVerified ? (
                      <span className="text-green-600 font-medium">
                        Yes {viewingUser.phoneVerifiedAt && <span className="text-gray-500 text-sm">({formatDate(viewingUser.phoneVerifiedAt)})</span>}
                      </span>
                    ) : (
                      <span className="text-red-600">No</span>
                    )}
                  </div>
                </div>
                {viewingUser._count && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Payments</label>
                      <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {viewingUser._count.payments || 0}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Favorites</label>
                      <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {viewingUser._count.favorites || 0}
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Created At</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {formatDate(viewingUser.createdAt)}
                  </div>
                </div>
              </div>

              {/* Current Subscription - Full Width */}
              {viewingUser.subscriptions && viewingUser.subscriptions.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Subscription</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="font-medium text-gray-900">{viewingUser.subscriptions[0].subscriptionPlan.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      MMK {Number(viewingUser.subscriptions[0].subscriptionPlan.priceMmk).toLocaleString()} / {viewingUser.subscriptions[0].subscriptionPlan.durationMonths} months
                    </div>
                    <div className="text-sm text-gray-600">Status: <span className="font-medium">{viewingUser.subscriptions[0].status}</span></div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingUser(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

