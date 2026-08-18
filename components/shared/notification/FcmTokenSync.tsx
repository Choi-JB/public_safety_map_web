"use client";

import { useEffect, useRef, useState } from "react";
import { registerFcmToken } from "@/lib/api/notification";
import { getFcmToken, listenForegroundMessage } from "@/lib/firebase/messaging";
import { useAuthStore } from "@/store/authStore";

function readPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * 알림 권한이 허용되면 로그인 여부와 관계없이 FCM 토큰을 서버에 저장한다.
 * 로그인/로그아웃 시 같은 토큰을 다시 보내 서버가 유저 연결을 갱신하게 한다.
 */
export function FcmTokenSync() {
  const userId = useAuthStore((s) => s.user?.id);
  const accessToken = useAuthStore((s) => s.accessToken);
  const authType = useAuthStore((s) => s.authType);
  const [permission, setPermission] = useState(readPermission);
  const lastSentRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof Notification === "undefined") return;

    setPermission(Notification.permission);

    if (!navigator.permissions?.query) return;

    let status: PermissionStatus | null = null;
    let sync: (() => void) | null = null;
    let cancelled = false;

    void navigator.permissions
      .query({ name: "notifications" as PermissionName })
      .then((result) => {
        if (cancelled) return;
        status = result;
        sync = () => setPermission(Notification.permission);
        result.addEventListener("change", sync);
        sync();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (status && sync) status.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (permission !== "granted") {
      lastSentRef.current = null;
      return;
    }

    let cancelled = false;
    let unsubscribeForeground: (() => void) | undefined;

    (async () => {
      try {
        //관리자일때만 fcm 토큰 등록
        if (authType !== "session") {
          lastSentRef.current = null;
          return;
        }

        const fcmToken = await getFcmToken();
        if (!fcmToken || cancelled) return;

        const sentKey = `${userId ?? "guest"}:${fcmToken}`;
        if (lastSentRef.current !== sentKey) {
          await registerFcmToken(fcmToken);
          lastSentRef.current = sentKey;
        }

        if (cancelled) return;
        unsubscribeForeground = listenForegroundMessage();
      } catch (err) {
        console.error("[FcmTokenSync]", err);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribeForeground?.();
    };
  }, [userId, accessToken, authType, permission]);

  return null;
}
