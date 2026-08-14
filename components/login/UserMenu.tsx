// 담당: 피드백/관리자팀

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import styles from "./login.module.css";
import { useMapStore } from "@/store/mapStore";

type AlarmPermission = NotificationPermission | "unsupported";

function readAlarmPermission(): AlarmPermission {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }
  return Notification.permission;
}

function alarmTooltip(permission: AlarmPermission) {
  if (permission === "granted") return "알림이 켜져 있습니다.";
  if (permission === "denied") {
    return "브라우저 설정에서 이 사이트 알림을 허용해 주세요.";
  }
  return "브라우저 앱 알림을 켜 주세요.";
}

function BellIcon({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!on && (
        <path
          d="M4 4l16 16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function UserMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const setSidePanelTab = useMapStore((s) => s.setSidePanelTab);
  const setSidePanelOpen = useMapStore((s) => s.setSidePanelOpen);

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [alarmPermission, setAlarmPermission] =
    useState<AlarmPermission>("default");
  const [alarmHover, setAlarmHover] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setAlarmPermission(readAlarmPermission());
    setAlarmHover(false);

    let status: PermissionStatus | null = null;
    let sync: (() => void) | null = null;
    let cancelled = false;
    if (navigator.permissions?.query) {
      void navigator.permissions
        .query({ name: "notifications" as PermissionName })
        .then((result) => {
          if (cancelled) return;
          status = result;
          sync = () => setAlarmPermission(readAlarmPermission());
          result.addEventListener("change", sync);
          sync();
        })
        .catch(() => {});
    }

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      cancelled = true;
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      if (status && sync) status.removeEventListener("change", sync);
    };
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    setOpen(false);
    try {
      await logout();
      router.push("/map");
    } finally {
      setLoggingOut(false);
    }
  }

  if (!user) return null;

  const nickname = user.nickname?.trim() || "사용자";

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        className={styles.mapAuthButton}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        내정보
      </button>

      {open && (
        <div className={styles.userMenuPanel} role="dialog" aria-label="내정보">
          <div className={styles.userMenuHeader}>
            <div className={styles.userMenuHeaderText}>
              <div className={styles.userMenuName}>{nickname}</div>
              {user.email != null && (
                <div className={styles.userMenuMeta}>{user.email}</div>
              )}
            </div>
            <div
              className={styles.userMenuAlarmWrap}
              onMouseEnter={() => setAlarmHover(true)}
              onMouseLeave={() => setAlarmHover(false)}
            >
              <span
                className={`${styles.userMenuAlarmBtn} ${
                  alarmPermission === "granted" ? styles.userMenuAlarmBtnOn : ""
                }`}
                aria-label={
                  alarmPermission === "granted"
                    ? "브라우저 알림 켜짐"
                    : "브라우저 알림 꺼짐"
                }
              >
                <BellIcon on={alarmPermission === "granted"} />
              </span>
              {alarmHover && (
                <div className={styles.userMenuAlarmTooltip} role="tooltip">
                  {alarmTooltip(alarmPermission)}
                </div>
              )}
            </div>
          </div>

          <div className={styles.userMenuActions}>
            {user.role === "ADMIN" ? (
              <button
                className={styles.userMenuAction}
                onClick={() => {
                  setOpen(false);
                  router.push("/admin");
                }}
              >
                관리자 <br/>
                페이지
              </button>
            ) : <button
              type="button"
              className={styles.userMenuAction}
              onClick={() => {
                setOpen(false);
                setSidePanelTab("mypage");
                setSidePanelOpen(true);
              }}
            >
              내 제보
            </button>
            }

            <button
              type="button"
              className={styles.userMenuAction}
              disabled={loggingOut}
              onClick={() => void handleLogout()}
            >
              {loggingOut ? "로그아웃 중…" : "로그아웃"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}