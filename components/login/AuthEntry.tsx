// 담당: 피드백/관리자팀

"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { LoginButton } from "./LoginButton";
import { UserMenu } from "./UserMenu";
import styles from "./login.module.css";

export function AuthEntry() {
  const user = useAuthStore((s) => s.user);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(useAuthStore.persist.hasHydrated());
    return useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);

  return (
    <div className={styles.mapAuthRoot}>
      {!hydrated ? (
        <div className={styles.mapAuthPlaceholder} aria-hidden />
      ) : user ? (
        <UserMenu />
      ) : (
        <LoginButton />
      )}
    </div>
  );
}
