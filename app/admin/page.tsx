// 담당: 피드백/관리자팀
// 작성자 : 최정봉

"use client";

import { AdminShell } from "@/components/admin/AdminShell";

import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const checkSession = useAuthStore((state) => state.checkSession);
  const authType = useAuthStore((state) => state.authType);

  const [checking, setChecking] = useState(true);

  useEffect(() => {

    //JWT 유저 또는 미로그인 -> admin 페이지 접근 불가
    // if(authType !== "session"){
    //   router.replace(user ? "/map" : "/login");
    //   return;
    // } ->  신뢰할 수 없는 타이밍에 확인하여 삭제

    let cancelled = false;

    //현재 브라우저에 유효한 관리자 세션 쿠키가 있는지 확인 없으면 로그인 페이지로 이동
    checkSession().then((ok)=>{
      if(!ok){
        // const reason = useAuthStore.getState().error;
        // if(reason){
        //   alert(reason);
        // }
        router.push("/login");
        return;
      }
      setChecking(false); //성공했을 때만 화면 표시
    })

    return () => {
      cancelled = true;
    }
  }, [ checkSession, router]);

  if (authType !== "session" || checking) return null;

  return <AdminShell />;
}
