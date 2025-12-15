"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTimeUntilExpiry, removeAuthTokens } from "@/lib/auth";

interface SessionExpiryWarningProps {
  warningThreshold?: number; // Show warning when less than X minutes remaining
}

export default function SessionExpiryWarning({ 
  warningThreshold = 5 // Default: warn at 5 minutes
}: SessionExpiryWarningProps) {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const checkSession = () => {
      const timeUntilExpiry = getTimeUntilExpiry();
      
      if (timeUntilExpiry === null) {
        setIsExpired(true);
        return;
      }

      const minutesRemaining = Math.floor(timeUntilExpiry / 60000);
      setTimeRemaining(minutesRemaining);

      // Show warning if less than threshold minutes remaining
      if (minutesRemaining > 0 && minutesRemaining <= warningThreshold) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }

      // Session expired
      if (timeUntilExpiry <= 0) {
        setIsExpired(true);
        setShowWarning(false);
        handleSessionExpired();
      }
    };

    // Check immediately
    checkSession();

    // Check every 30 seconds
    const interval = setInterval(checkSession, 30000);

    return () => clearInterval(interval);
  }, [warningThreshold, router]);

  const handleSessionExpired = () => {
    removeAuthTokens();
    router.push("/login?session=expired");
  };

  const handleExtendSession = async () => {
    try {
      const { getRefreshToken, setAuthTokens } = await import("@/lib/auth");
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        handleSessionExpired();
        return;
      }

      // Trigger a refresh by making an API call
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"}/api/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAuthTokens(
          data.data.accessToken,
          data.data.refreshToken,
          30 * 60
        );
        setShowWarning(false);
      } else {
        handleSessionExpired();
      }
    } catch (error) {
      handleSessionExpired();
    }
  };

  if (isExpired) {
    return null; // Will redirect
  }

  if (!showWarning || timeRemaining === null) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up">
      <div className="rounded-xl border-2 border-yellow-400 bg-yellow-50 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-yellow-600"
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
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-900">
              Session Expiring Soon
            </h3>
            <p className="mt-1 text-sm text-yellow-800">
              Your session will expire in {timeRemaining} minute{timeRemaining !== 1 ? "s" : ""}. 
              Click "Extend Session" to stay logged in.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleExtendSession}
                className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 transition-colors"
              >
                Extend Session
              </button>
              <button
                onClick={() => setShowWarning(false)}
                className="rounded-lg border border-yellow-300 bg-white px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-50 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

