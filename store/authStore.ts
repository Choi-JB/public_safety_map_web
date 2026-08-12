// 담당: 공통기반
// 작성자 : 최정봉
// 
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loginApi, logoutApi, type LoginResult } from "@/lib/api/auth";
import { fetchAdminMe } from "@/lib/api/admin";

/** 유저 정보 */
export type AuthUser = {
  id: number | null;
  nickname: string | null;
  role: string | null;
  email: string | null;
};

/** 인증 상태 */
type AuthState = {
  user: AuthUser | null;
  /** 일반 유저 JWT */
  accessToken: string | null;
  /** 관리자 세션 식별용 */
  sessionId: string | null;
  loading: boolean;
  error: string | null;
  authType: "jwt" | "session" | null;

  clearError: () => void;
  /**
   * 세션 확인
   * @returns 세션 확인 결과
   * 지금 이 브라우저에 유효한 관리자 세션 쿠키가 있는지 확인
   */
  checkSession: () => Promise<boolean>;
  /**
   * 로그인
   * - 일반 유저: JWT 발급/저장
   * - 관리자: 세션 발급/저장
   */
  login: (email: string, password: string) => Promise<void>;
  /**
   * 로그아웃
   */
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist((set, get) => ({
    user: null,
    accessToken: null,
    sessionId: null,
    loading: false,
    error: null,
    authType: null,
    clearError: () => set({ error: null }),

    login: async (email, password) => {
      set({ loading: true, error: null });
      try {
        const result: LoginResult = await loginApi(email, password);

        if ("authType" in result) {
          // 관리자 — 세션(httpOnly 쿠키)으로 인증됨.
          // 쿠키 값 자체는 JS에서 읽을 수 없어 "active" 마커만 저장.
          set({
            loading: false,
            user: result.user,
            accessToken: null,
            sessionId: "active",
            authType: "session"
          });

        } else {
          // 일반 유저 — JWT
          set({
            loading: false,
            user: result.user,
            accessToken: result.access_token,
            sessionId: null,
            authType: "jwt"
          });
        }
      } catch (err) {
        set({
          loading: false,
          user: null,
          accessToken: null,
          sessionId: null,
          error: err instanceof Error ? err.message : "로그인에 실패했습니다."
        });
      }
    },

    logout: async () => {
      /**
       * 서버에 폐기 요청
       *  - 관리자: 세션 종료 destroy
       *  - 일반 유저: refresh token 폐기
       */
      try{
        await logoutApi();
      } catch (err) {
        console.error("[logout]", err);
      }
      
      /**
       * 상태 초기화
       */
      set({
        user: null,
        accessToken: null,
        sessionId: null,
        authType: null,
        error: null,
        loading: false,
      });
    },
    checkSession: async () => {
      try {
        const me = await fetchAdminMe();
        set((prev) => ({
          user: { 
            id: Number(me.id), 
            nickname: me.nickname ?? prev.user?.nickname ?? null, 
            role: me.role, 
            email: me.email ?? prev.user?.email ?? null
         },
          authType: "session",
          sessionId: "active",
        }));
        return true;
      } catch {
        const {authType, accessToken} = get();
        if(authType === "jwt" && accessToken) {
          return false;
        }
        set({
          user: null,
          authType: null,
          sessionId: null,
          accessToken: null,
          error: "세션이 만료되었습니다. 다시 로그인해주세요."
        });
        return false;
      }
    },
  }), {
    name: "auth-storage",
    skipHydration: true,
    partialize: (state) => ({
      accessToken: state.accessToken,
      user: state.user,
      authType: state.authType,
    }),
  }));
