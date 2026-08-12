// 담당: 피드백/관리자팀

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerApi } from "@/lib/api/auth";
import styles from "@/components/login/login.module.css";

const EMAIL_MAX = 50;
const NICKNAME_MAX = 19; // 20자 미만

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

export function SignupForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedNickname = nickname.trim();

    if (trimmedEmail.length === 0 || trimmedEmail.length > EMAIL_MAX) {
      setError(`이메일은 1~${EMAIL_MAX}자로 입력해 주세요.`);
      return;
    }

    if (trimmedNickname.length === 0 || trimmedNickname.length >= 20) {
      setError("닉네임은 20자 미만으로 입력해 주세요.");
      return;
    }

    if (!password) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      await registerApi({
        email: trimmedEmail,
        password,
        nickname: trimmedNickname,
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className={styles.brand}>공공안전지도</h1>

      <div className={styles.card}>
        <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
          <div className={styles.field}>
            <label htmlFor="signup-email">이메일 email</label>
            <div className={styles.inputRow}>
              <input
                id="signup-email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                maxLength={EMAIL_MAX}
                onChange={(e) => setEmail(e.target.value.slice(0, EMAIL_MAX))}
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
            <label htmlFor="signup-password">비밀번호</label>
            <div className={styles.inputRow}>
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
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

          <div className={styles.field}>
            <label htmlFor="signup-password-confirm">비밀번호 확인</label>
            <div className={styles.inputRow}>
              <input
                id="signup-password-confirm"
                type={showPasswordConfirm ? "text" : "password"}
                name="passwordConfirm"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={
                  showPasswordConfirm ? "비밀번호 숨기기" : "비밀번호 보기"
                }
                onClick={() => setShowPasswordConfirm((v) => !v)}
              >
                <EyeIcon open={showPasswordConfirm} />
              </button>
              {passwordConfirm ? (
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="입력 지우기"
                  onClick={() => setPasswordConfirm("")}
                >
                  <ClearIcon />
                </button>
              ) : null}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="signup-nickname">닉네임</label>
            <div className={styles.inputRow}>
              <input
                id="signup-nickname"
                type="text"
                name="nickname"
                autoComplete="nickname"
                value={nickname}
                maxLength={NICKNAME_MAX}
                onChange={(e) =>
                  setNickname(e.target.value.slice(0, NICKNAME_MAX))
                }
                required
              />
              {nickname ? (
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="입력 지우기"
                  onClick={() => setNickname("")}
                >
                  <ClearIcon />
                </button>
              ) : null}
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "가입 중…" : "회원가입"}
          </button>
        </form>
      </div>

      <div className={styles.signup}>
        <Link href="/login" className={styles.signupLink}>
          로그인
        </Link>
      </div>
    </>
  );
}
