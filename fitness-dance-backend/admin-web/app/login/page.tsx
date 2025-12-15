"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { setAuthTokens } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Check for session expiry or error messages
  useEffect(() => {
    const sessionExpired = searchParams.get("session");
    const errorParam = searchParams.get("error");
    
    if (sessionExpired === "expired") {
      setError("Your session has expired. Please log in again.");
    } else if (errorParam === "unauthorized") {
      setError("You are not authorized. Please log in again.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      // API returns: { success: true, message: "...", data: { tokens: { accessToken: "...", refreshToken: "..." } } }
      const tokens = response.data?.data?.tokens;
      const accessToken = tokens?.accessToken;
      const refreshToken = tokens?.refreshToken;
      
      if (accessToken && refreshToken) {
        // Store both tokens with expiry (default 30 minutes for access token)
        setAuthTokens(accessToken, refreshToken, 30 * 60);
        router.push("/dashboard");
      } else {
        setError("Login successful but no tokens received. Please try again.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 px-4 py-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-radial from-[#6BBD45]/6 to-transparent blur-3xl"></div>
        <div className="absolute -left-1/4 -bottom-1/4 h-[500px] w-[500px] rounded-full bg-gradient-radial from-[#9ACD32]/4 to-transparent blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Section */}
        <div className="mb-8 flex justify-center">
          {!logoError ? (
            <img
              src="/logo1.png"
              alt="ZFitDance Logo"
              className="h-16 w-auto object-contain drop-shadow-lg"
              onError={() => setLogoError(true)}
            />
          ) : (
            <img
              src="/icon1.png"
              alt="ZFitDance Logo"
              className="h-16 w-auto object-contain drop-shadow-lg"
            />
          )}
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-white/95 backdrop-blur-sm p-8 shadow-2xl ring-1 ring-[#6BBD45]/10 sm:p-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-500 sm:text-[0.9375rem]">
              Sign in to access your admin dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3.5">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border-2 border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-all duration-200 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/15"
                  placeholder="admin@zfitdance.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border-2 border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-all duration-200 focus:border-[#6BBD45] focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/15"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden rounded-lg bg-gradient-zfit px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#6BBD45]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#6BBD45]/25 focus:outline-none focus:ring-4 focus:ring-[#6BBD45]/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading && (
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {loading ? "Signing in..." : "Sign In"}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
