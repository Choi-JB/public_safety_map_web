// 담당: 피드백/관리자팀

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import styles from "./login.module.css";

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.35" />
      <path
        d="M9 9l6 6M15 9l-6 6"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4M9.9 5.2A10.4 10.4 0 0112 5c6.5 0 10 7 10 7a17.4 17.4 0 01-4.1 4.7M6.1 6.1A17.5 17.5 0 002 12s3.5 7 10 7a10.5 10.5 0 004.1-.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();

    await login(email, password);

    const { user } = useAuthStore.getState();
    if (!user) return;

    router.push("/map");
  }

  return (
    <>
      <h1 className={styles.brand}>공공안전지도</h1>

      <div className={styles.card}>
        <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
          <div className={styles.field}>
            <label htmlFor="login-email">아이디 또는 전화번호</label>
            <div className={styles.inputRow}>
              <input
                id="login-email"
                type="text"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {email ? (
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="입력 지우기"
                  onClick={() => setEmail("")}
                >
                  <ClearIcon />
                </button>
              ) : null}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password">비밀번호</label>
            <div className={styles.inputRow}>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                onClick={() => setShowPassword((v) => !v)}
              >
                <EyeIcon open={showPassword} />
              </button>
              {password ? (
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="입력 지우기"
                  onClick={() => setPassword("")}
                >
                  <ClearIcon />
                </button>
              ) : null}
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "로그인 중…" : "로그인"}
          </button>
        </form>
      </div>

      <div className={styles.signup}>
        <Link href="/signup" className={styles.signupLink}>
          회원가입
        </Link>
      </div>

      <p className={styles.hint}>
        관리자 계정은 세션으로, 일반 유저 계정은 JWT로 로그인됩니다.
        (배포 때는 이 문구 삭제)
      </p>
    </>
  );
}
