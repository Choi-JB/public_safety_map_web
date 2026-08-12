// 담당: 피드백/관리자팀

"use client";

import { SignupForm } from "./SignupForm";
import styles from "@/components/login/login.module.css";

export function SignupShell() {
  return (
    <main className={styles.page}>
      <SignupForm />
    </main>
  );
}
