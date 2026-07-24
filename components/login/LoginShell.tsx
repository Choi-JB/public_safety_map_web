// 담당: 피드백/관리자팀

"use client";

import { LoginForm } from "./LoginForm";
import styles from "./login.module.css";

export function LoginShell() {
  return (
    <main className={styles.page}>
      <LoginForm />
    </main>
  );
}
