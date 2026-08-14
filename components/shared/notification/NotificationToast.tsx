"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeNotificationToast } from "./toastEvents";
import styles from "./notification.module.css";

const TOAST_MS = 5000;

export function NotificationToast() {
  const [title, setTitle] = useState<string | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeNotificationToast((nextTitle) => {
      setTitle(nextTitle);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setTitle(null), TOAST_MS);
    });

    return () => {
      unsubscribe();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  function handleClose() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setTitle(null);
  }

  if (!title) return null;

  return (
    <div className={styles.toastRoot} role="status" aria-live="polite">
      <div className={styles.toast}>
        <span className={styles.toastTitle}>{title}</span>
        <button
          type="button"
          className={styles.toastClose}
          aria-label="알림 닫기"
          onClick={handleClose}
        >
          ×
        </button>
      </div>
    </div>
  );
}
