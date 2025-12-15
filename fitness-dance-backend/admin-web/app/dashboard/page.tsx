"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 1248,
    totalCategories: 12,
    totalVideos: 342,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard stats
    // You can add API endpoints for stats later
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
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
      value: stats.totalCategories,
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
      value: stats.totalVideos,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      gradient: "from-[#6BBD45] to-[#9ACD32]",
      bgGradient: "from-[#6BBD45]/10 to-[#9ACD32]/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
                <p className={`text-4xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                  {card.value.toLocaleString()}
                </p>
                <div className="mt-4 flex items-center text-xs text-gray-400">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>+12% from last month</span>
                </div>
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
            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-gradient-zfit-subtle flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-[#6BBD45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">New category added</p>
                <p className="text-xs text-gray-500 mt-0.5">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-gradient-zfit-subtle flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-[#6BBD45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Video uploaded</p>
                <p className="text-xs text-gray-500 mt-0.5">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-gradient-zfit-subtle flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-[#6BBD45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">New user registered</p>
                <p className="text-xs text-gray-500 mt-0.5">1 day ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-zfit-subtle hover:bg-gradient-zfit text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 group">
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
            <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-zfit-subtle hover:bg-gradient-zfit text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 group">
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
            <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-zfit-subtle hover:bg-gradient-zfit text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 group">
              <div className="flex items-center space-x-3">
                <svg className="h-5 w-5 text-[#6BBD45] group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>View Reports</span>
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
