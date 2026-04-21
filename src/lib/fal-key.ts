"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "comic-studio.fal_key";

export function useFalKey() {
  const [key, setKeyState] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) ?? "";
      setKeyState(stored);
    } catch {}
    setLoaded(true);
  }, []);

  const setKey = useCallback((next: string) => {
    setKeyState(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, next);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return { key, setKey, hasKey: key.length > 0, loaded };
}

export function looksLikeFalKey(value: string) {
  return /^[a-f0-9-]{20,}:[a-z0-9]{20,}$/i.test(value.trim());
}
