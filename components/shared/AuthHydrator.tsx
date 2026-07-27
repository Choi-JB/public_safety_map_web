// 작성자 : 최정봉
// 내용 : hydrate 경고 방지용
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthHydrator() {
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);

  return null;
}