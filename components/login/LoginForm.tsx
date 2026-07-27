// 담당: 피드백/관리자팀

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import styles from "./login.module.css";

export function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();

    await login(email, password);

    const { user, authType } = useAuthStore.getState();
	    if (!user) return; // 실패 시 error는 store에 이미 세팅됨 → 화면에 표시됨
	
	    if (authType === "session") {
	      router.push("/admin");
	    } else if (authType === "jwt") {
	      router.push("/map");
	    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.brand}>공공안전지도</div>
      <p className={styles.subtitle}>로그인</p>

      <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
        <div className={styles.field}>
          <label htmlFor="login-email">email</label>
          <input
            id="login-email"
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="login-password">password</label>
          <input
            id="login-password"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "로그인 중…" : "로그인"}
        </button>
      </form>

      <p className={styles.hint}>
          관리자 계정은 세션으로, 일반 유저 계정은 JWT로 로그인됩니다.
      </p>
    </div>
  );
}
