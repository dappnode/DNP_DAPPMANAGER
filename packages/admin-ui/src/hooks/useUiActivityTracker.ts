import { useEffect, useRef, useCallback } from "react";
import { api } from "api";

// Configuration
const ACTIVITY_TIMEOUT_MS = 60 * 1000; // 1 minute - user becomes inactive after this
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds - how often to report activity

/**
 * Hook to track user activity in the UI and report it to the backend.
 * Tracks mouse movements, clicks, keyboard input, and touch events.
 * Reports activity status every 30 seconds to the backend for Prometheus metrics.
 */
export function useUiActivityTracker(): void {
  const isActiveRef = useRef(true);
  const lastActivityRef = useRef(Date.now());
  const sessionStartRef = useRef(Math.floor(Date.now() / 1000));
  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset activity timeout on user interaction
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    isActiveRef.current = true;

    // Clear existing timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    // Set new timeout to mark user as inactive
    activityTimeoutRef.current = setTimeout(() => {
      isActiveRef.current = false;
    }, ACTIVITY_TIMEOUT_MS);
  }, []);

  // Report activity to the backend
  const reportActivity = useCallback(async () => {
    try {
      await api.uiActivityUpdate({
        isActive: isActiveRef.current,
        sessionStartTimestamp: sessionStartRef.current
      });
    } catch (error) {
      console.error("Failed to report UI activity:", error);
    }
  }, []);

  useEffect(() => {
    // Initialize session start time
    sessionStartRef.current = Math.floor(Date.now() / 1000);

    // Set up activity event listeners
    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial activity timeout
    activityTimeoutRef.current = setTimeout(() => {
      isActiveRef.current = false;
    }, ACTIVITY_TIMEOUT_MS);

    // Start heartbeat interval to report activity
    const heartbeatInterval = setInterval(reportActivity, HEARTBEAT_INTERVAL_MS);

    // Report initial activity
    reportActivity();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      clearInterval(heartbeatInterval);

      // Report inactive status on unmount (session end)
      api
        .uiActivityUpdate({
          isActive: false,
          sessionStartTimestamp: sessionStartRef.current
        })
        .catch(console.error);
    };
  }, [handleActivity, reportActivity]);
}
