// 작성자: 최정봉
// 내용: hydrate 경고 방지용
// components/shared/AuthProvider.tsx  (기존 AuthHydrator 확장)
"use client";

import { useAuthStore } from "@/store/authStore";
import { createContext, useContext, useState, useEffect } from "react";


const AuthReadyContext = createContext(false);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  //const { authType } = useAuthStore.getState();

  //브라우저 첫 시작 시 관리자 세션이 있으면 제거
  // if (authType === "session") {
  //   useAuthStore.setState({
  //     user: null,
  //     authType: null,
  //     sessionId: null,
  //     accessToken: null,
  //   });
  // }

  useEffect(() => {
    useAuthStore.persist.rehydrate();
    setHydrated(useAuthStore.persist.hasHydrated());

    const unsub = useAuthStore.persist.onHydrate(() => 
    {
      setHydrated(true);
      const { authType, checkSession } = useAuthStore.getState();
      if (authType !== "jwt") {
        void checkSession();
      }
    });

    return unsub;
  }, []);

  if (!hydrated) return null; // 또는 스피너 — 전 앱이 복원 후에만 렌더

  return (
    <AuthReadyContext.Provider value={true}>
      {children}
    </AuthReadyContext.Provider>
  );
}

export function useAuthReady() {
  return useContext(AuthReadyContext);
}