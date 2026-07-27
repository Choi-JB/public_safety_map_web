// 담당: 피드백/관리자팀

"use client";

import Link from "next/link";
import styles from "./login.module.css";

export function LoginButton() {
  return (
    <Link href="/login" className={styles.mapAuthButton}>
      로그인
    </Link>
  );
}
