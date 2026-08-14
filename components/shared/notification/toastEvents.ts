type ToastListener = (title: string) => void;

const listeners = new Set<ToastListener>();

export function showNotificationToast(title: string) {
  const text = title.trim() || "알림";
  listeners.forEach((listener) => listener(text));
}

export function subscribeNotificationToast(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
