// 담당: 피드백/관리자팀

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import styles from "./login.module.css";

export function UserMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authType = useAuthStore((s) => s.authType);
  const logout = useAuthStore((s) => s.logout);

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

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
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
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
  const roleLabel =
    authType === "session" || user.role === "ADMIN" ? "(관리자)" : "";

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
          <div className={styles.userMenuName}>{nickname} {roleLabel} </div>
          <div className={styles.userMenuMeta}>
            {user.email != null ? ` · ${user.email}` : null}
          </div>

          {authType === "session" && (
            <Link
              href="/admin"
              className={styles.userMenuLink}
              onClick={() => setOpen(false)}
            >
              관리자 페이지
            </Link>
          )}

          <button
            type="button"
            className={styles.userMenuLogout}
            disabled={loggingOut}
            onClick={() => void handleLogout()}
          >
            {loggingOut ? "로그아웃 중…" : "로그아웃"}
          </button>
        </div>
      )}
    </div>
  );
}
