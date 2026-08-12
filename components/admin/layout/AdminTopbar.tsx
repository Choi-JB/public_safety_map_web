// 담당: 피드백/관리자팀

"use client";

import type { AdminTab } from "@/lib/api/admin";
import styles from "../admin.module.css";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useAdminStore } from "@/store/adminStore";


const TABS: { id: AdminTab; label: string }[] = [
  { id: "dashboard", label: "대시보드" },
  { id: "reports", label: "제보 관리" },
  { id: "feedbacks", label: "피드백 관리" },
  { id: "city-events", label: "도시정보" },
  { id: "markers", label: "마커 등록" },
  { id: "chat", label: "채팅 관리" },
  { id: "settings", label: "설정" },
];

export function AdminTopbar() {
  const tab = useAdminStore((s) => s.tab);
  const setTab = useAdminStore((s) => s.setTab);

  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const { user } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };
  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>공공안전지도 관리자</div>
      <nav className={styles.tabs} aria-label="관리자 메뉴">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.tab} ${tab === item.id ? styles.tabActive : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className={styles.userMeta}>
        <span>{user?.nickname}</span>
        <button type="button" className={styles.button} onClick={handleLogout} >
          로그아웃
        </button>
      </div>
    </header>
  );
}
