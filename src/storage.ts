import { useEffect, useState } from "react";
import { storagePrefix } from "./constants";

export function readStoredState<T>(key: string, fallback: T, parse: (value: unknown, fallback: T) => T): T {
  try {
    const stored = window.localStorage.getItem(`${storagePrefix}:${key}`);

    if (stored === null) {
      return fallback;
    }

    return parse(JSON.parse(stored), fallback);
  } catch {
    return fallback;
  }
}

export function useStoredState<T>(key: string, fallback: T, parse: (value: unknown, fallback: T) => T) {
  const [value, setValue] = useState(() => readStoredState(key, fallback, parse));

  useEffect(() => {
    try {
      window.localStorage.setItem(`${storagePrefix}:${key}`, JSON.stringify(value));
    } catch (error) {
      console.warn(`Could not persist ${key}.`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}
