"use client";

import * as React from "react";

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdating: boolean;
  error: Error | null;
  update: () => Promise<void>;
  unregister: () => Promise<void>;
}

export function useServiceWorker(): ServiceWorkerState {
  const [isSupported, setIsSupported] = React.useState(false);
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const registrationRef = React.useRef<ServiceWorkerRegistration | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    setIsSupported(true);

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        registrationRef.current = registration;
        setIsRegistered(true);

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            setIsUpdating(true);
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                setIsUpdating(false);
              }
            });
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to register service worker"));
      }
    };

    registerSW();
  }, []);

  const update = React.useCallback(async () => {
    if (!registrationRef.current) return;
    setIsUpdating(true);
    try {
      await registrationRef.current.update();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to update service worker"));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const unregister = React.useCallback(async () => {
    if (!registrationRef.current) return;
    try {
      await registrationRef.current.unregister();
      setIsRegistered(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to unregister service worker"));
    }
  }, []);

  return {
    isSupported,
    isRegistered,
    isUpdating,
    error,
    update,
    unregister,
  };
}
