// 담당: 공통 — 비밀번호 변경 폼 (관리자 설정 · 일반 유저 마이페이지 공용)

"use client";

import { useState, type FormEvent } from "react";
import { changePassword } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import styles from "./myPage.module.css";

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

export type ChangePasswordFormPayload = {
  currentPassword: string;
  newPassword: string;
};

type Props = {
  showBrand?: boolean;
  onCancel?: () => void;
  onSuccess?: (message?: string) => void;
  /** 실제 변경 API.  /auth/change-pw 호출 */
  onSubmitPassword?: (payload: ChangePasswordFormPayload) => Promise<void>;
};

export function ChangePasswordForm({
  showBrand = true,
  onCancel,
  onSuccess,
  onSubmitPassword,
}: Props) {
  const email = useAuthStore((s) => s.user?.email ?? null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.");
      return;
    }
    if (!currentPassword) {
      setError("기존 비밀번호를 입력해 주세요.");
      return;
    }
    if (!newPassword) {
      setError("새 비밀번호를 입력해 주세요.");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (currentPassword === newPassword) {
      setError("기존 비밀번호와 같습니다.");
      return;
    }

    setLoading(true);
    try {
      if (onSubmitPassword) {
        await onSubmitPassword({ currentPassword, newPassword });
        onSuccess?.("비밀번호가 변경되었습니다.");
      } else {
        await changePassword({
          email,
          password: currentPassword,
          newPassword,
        });
        onSuccess?.("비밀번호가 변경되었습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.root}>
      {showBrand && <h1 className={styles.brand}>공공안전지도</h1>}

      <div className={styles.card}>
        <h2 className={styles.formTitle}>비밀번호 변경</h2>
        <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="change-current-password">
              기존 비밀번호
            </label>
            <div className={styles.inputRow}>
              <input
                id="change-current-password"
                className={styles.input}
                type={showCurrent ? "text" : "password"}
                name="currentPassword"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={showCurrent ? "비밀번호 숨기기" : "비밀번호 보기"}
                onClick={() => setShowCurrent((v) => !v)}
              >
                <EyeIcon open={showCurrent} />
              </button>
              {currentPassword ? (
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="입력 지우기"
                  onClick={() => setCurrentPassword("")}
                >
                  <ClearIcon />
                </button>
              ) : null}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="change-new-password">
              새 비밀번호
            </label>
            <div className={styles.inputRow}>
              <input
                id="change-new-password"
                className={styles.input}
                type={showNew ? "text" : "password"}
                name="newPassword"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={showNew ? "비밀번호 숨기기" : "비밀번호 보기"}
                onClick={() => setShowNew((v) => !v)}
              >
                <EyeIcon open={showNew} />
              </button>
              {newPassword ? (
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="입력 지우기"
                  onClick={() => setNewPassword("")}
                >
                  <ClearIcon />
                </button>
              ) : null}
            </div>
          </div>

          <div className={styles.field}>
            <label
              className={styles.fieldLabel}
              htmlFor="change-new-password-confirm"
            >
              새 비밀번호 확인
            </label>
            <div className={styles.inputRow}>
              <input
                id="change-new-password-confirm"
                className={styles.input}
                type={showConfirm ? "text" : "password"}
                name="newPasswordConfirm"
                autoComplete="new-password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={showConfirm ? "비밀번호 숨기기" : "비밀번호 보기"}
                onClick={() => setShowConfirm((v) => !v)}
              >
                <EyeIcon open={showConfirm} />
              </button>
              {newPasswordConfirm ? (
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="입력 지우기"
                  onClick={() => setNewPasswordConfirm("")}
                >
                  <ClearIcon />
                </button>
              ) : null}
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={onCancel}
              disabled={loading}
            >
              취소
            </button>
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "변경 중…" : "변경"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
