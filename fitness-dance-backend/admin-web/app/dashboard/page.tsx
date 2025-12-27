"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import analyticsService, { DashboardStats, RecentActivity } from "@/lib/services/analyticsService";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Refs to prevent duplicate fetches in Strict Mode
  const hasFetchedRef = useRef(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate requests - only fetch once
    if (hasFetchedRef.current || fetchingRef.current) return;

    const fetchDashboardData = async () => {
      fetchingRef.current = true;
      try {
        setLoading(true);
        setError("");
        const [statsData, activityData] = await Promise.all([
          analyticsService.getDashboardStats(),
          analyticsService.getRecentActivity(10),
        ]);
        setStats(statsData);
        setRecentActivity(activityData);
        hasFetchedRef.current = true;
      } catch (err: any) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchDashboardData();
  }, []);

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string, action: string) => {
    if (type === "video") {
      return (
        <svg className="h-5 w-5 text-[#6BBD45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }
    if (type === "category") {
      return (
        <svg className="h-5 w-5 text-[#6BBD45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
    }
    if (type === "collection") {
      return (
        <svg className="h-5 w-5 text-[#6BBD45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    }
    if (type === "user") {
      return (
        <svg className="h-5 w-5 text-[#6BBD45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5 text-[#6BBD45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    );
  };

  const getActivityText = (activity: RecentActivity) => {
    const actionText = activity.action === "created" ? "created" : activity.action === "updated" ? "updated" : "deleted";
    const typeText = activity.type === "video" ? "video" : activity.type === "category" ? "category" : activity.type === "collection" ? "collection" : "user";
    return `${activity.title} ${actionText}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.users.total,
      subtitle: `${stats.users.active} active`,
      growth: stats.users.growthPercentage,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
    },
    {
      title: "Total Categories",
      value: stats.categories.total,
      subtitle: `${stats.categories.active} active`,
      growth: null,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
    },
    {
      title: "Total Videos",
      value: stats.videos.total,
      subtitle: `${stats.videos.published} published`,
      growth: null,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      gradient: "from-[#6BBD45] to-[#9ACD32]",
      bgGradient: "from-[#6BBD45]/10 to-[#9ACD32]/10",
    },
    {
      title: "Total Collections",
      value: stats.collections.total,
      subtitle: `${stats.collections.active} active`,
      growth: null,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50",
    },
    {
      title: "Active Subscriptions",
      value: stats.subscriptions.active,
      subtitle: `${stats.subscriptions.total} total`,
      growth: null,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
    },
    {
      title: "Total Revenue",
      value: `MMK ${stats.revenue.total.toLocaleString()}`,
      subtitle: `MMK ${stats.revenue.thisMonth.toLocaleString()} this month`,
      growth: stats.revenue.growthPercentage,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: "from-indigo-500 to-purple-500",
      bgGradient: "from-indigo-50 to-purple-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
                <p className={`text-4xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                  {typeof card.value === "string" ? card.value : card.value.toLocaleString()}
                </p>
                {card.subtitle && (
                  <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
                )}
                {card.growth !== null && (
                  <div className="mt-4 flex items-center text-xs text-gray-400">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>{card.growth >= 0 ? "+" : ""}{card.growth.toFixed(1)}% from last month</span>
                  </div>
                )}
              </div>
              <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${card.bgGradient} flex items-center justify-center text-gray-700 group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
            </div>
            {/* Decorative gradient line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`}></div>
          </div>
        ))}
      </div>

      {/* Additional Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-[#6BBD45] font-medium hover:text-[#5A9E3A] transition-colors">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No recent activity</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-zfit-subtle flex items-center justify-center flex-shrink-0">
                    {getActivityIcon(activity.type, activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {getActivityText(activity)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/dashboard/categories")}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-zfit-subtle hover:bg-gradient-zfit text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <svg className="h-5 w-5 text-[#6BBD45] group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add New Category</span>
              </div>
              <svg className="h-5 w-5 text-gray-400 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => router.push("/dashboard/videos/new")}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-zfit-subtle hover:bg-gradient-zfit text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <svg className="h-5 w-5 text-[#6BBD45] group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Upload Video</span>
              </div>
              <svg className="h-5 w-5 text-gray-400 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => router.push("/dashboard/collections")}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-zfit-subtle hover:bg-gradient-zfit text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <svg className="h-5 w-5 text-[#6BBD45] group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Manage Collections</span>
              </div>
              <svg className="h-5 w-5 text-gray-400 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
