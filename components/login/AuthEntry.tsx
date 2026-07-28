// 담당: 피드백/관리자팀

"use client";

import { useAuthStore } from "@/store/authStore";
import { LoginButton } from "./LoginButton";
import { UserMenu } from "./UserMenu";
import styles from "./login.module.css";

export function AuthEntry() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className={styles.mapAuthRoot}>
      {user ? <UserMenu /> : <LoginButton />}
    </div>
  );
}
