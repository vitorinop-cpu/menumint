"use client";

import { useCallback, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** True after hydration; false during SSR. */
export function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** window.location.origin on the client, "" during SSR. */
export function useOrigin() {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );
}

const LOCAL_EVENT = "mm-local-storage";

/** Hydration-safe localStorage value (null during SSR). */
export function useLocalStorage(key: string): [string | null, (value: string) => void] {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener("storage", cb);
    window.addEventListener(LOCAL_EVENT, cb);
    return () => {
      window.removeEventListener("storage", cb);
      window.removeEventListener(LOCAL_EVENT, cb);
    };
  }, []);
  const value = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key) ?? "",
    () => null,
  );
  const set = useCallback(
    (v: string) => {
      localStorage.setItem(key, v);
      window.dispatchEvent(new Event(LOCAL_EVENT));
    },
    [key],
  );
  return [value, set];
}
