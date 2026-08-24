// 담당: 피드백/관리자팀

"use client";

import { useState } from "react";
import { ChangePasswordForm } from "@/components/myPage/ChangePasswordForm";
import styles from "../admin.module.css";

export function SettingPanel() {
  const [changingPassword, setChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (changingPassword) {
    return (
      <div className={styles.panelRoot}>
        <div className={styles.panelHeader}>비밀번호 변경</div>
        <div className={styles.panelBodyScroll}>
          <ChangePasswordForm
            showBrand={false}
            onCancel={() => setChangingPassword(false)}
            onSuccess={(message) => {
              setSuccessMessage(message ?? "Demo 버전에서는 비밀번호 변경이 불가능합니다.");
              setChangingPassword(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panelRoot}>
      <div className={styles.panelHeader}>설정</div>
      <div className={styles.panelBodyScroll}>
        {successMessage && (
          <div className={`${styles.notice} ${styles.noticeOk}`}>
            {successMessage}
            <button
              type="button"
              className={styles.button}
              style={{ marginLeft: 8 }}
              onClick={() => setSuccessMessage(null)}
            >
              닫기
            </button>
          </div>
        )}
        <div className={styles.formActions}>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => {
              setSuccessMessage(null);
              setChangingPassword(true);
            }}
          >
            비밀번호 변경
          </button>
        </div>
      </div>
    </div>
  );
}
