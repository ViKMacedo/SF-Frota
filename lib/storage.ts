export function saveStorage(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

export function getStorage(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const item = localStorage.getItem(key);
  if (!item) {
    return null;
  }

  return JSON.parse(item);
}

export function removeStorage(key: string) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(key);
}
