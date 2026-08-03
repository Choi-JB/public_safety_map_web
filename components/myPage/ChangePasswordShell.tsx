// 담당: 공통 — 비밀번호 변경 페이지 셸

"use client";

import { useRouter } from "next/navigation";
import { ChangePasswordForm } from "./ChangePasswordForm";
import styles from "./myPage.module.css";

export function ChangePasswordShell() {
  const router = useRouter();

  return (
    <main className={styles.page}>
      <ChangePasswordForm
        onCancel={() => router.back()}
        onSuccess={(message) => {
          alert(message ?? "비밀번호가 변경되었습니다.");
          router.back();
        }}
      />
    </main>
  );
}
