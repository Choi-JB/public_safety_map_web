// 담당: 공통기반
// 작성자 : 최정봉
// 내용 : 클라이언트 요청 전용 API (GET, POST, PATCH, DELETE)
//        로그인 이후 발급된 토큰/쿠키를 자동으로 실어 보내는 범용 클라이언트

import { useAuthStore } from "@/store/authStore";
import type { ApiResponse } from "./types";

let refreshPromise: Promise<string | null> | null = null;

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4100";
}

/** 응답을 공통 포맷으로 파싱, 실패 시 에러 throw */
async function parseResponse<T>(res: Response): Promise<T> {
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new Error("서버 응답을 파싱하지 못했습니다.");
  }

  if (!res.ok || ("success" in json && json.success === false)) {
    const message =
      "message" in json && json.message ? json.message : `요청 실패 (${res.status})`;
    throw new Error(message);
  }

  if ("data" in json) {
    return json.data as T;
  }

  return undefined as T;
}

/** access token 만료 시, refresh token(httpOnly 쿠키)으로 새 access token 조용히 재발급 */
async function refreshAccessToken(): Promise<string | null> {
  //동시 요청 방지
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      const data = await parseResponse<{ access_token: string }>(res);
      useAuthStore.setState({ accessToken: data.access_token });
      return data.access_token;
    } catch {
      useAuthStore.setState({
        user: null,
        accessToken: null,
        sessionId: null,
        authType: null,
      });
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

/** 요청 옵션 빌드 */
function buildFetchOptions(init: RequestInit | undefined, accessToken: string | null): RequestInit {
  return {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  };
}

function isUnauthorized(res: Response, message: string) {
  return (
    res.status === 401 ||
    message.includes("토큰") ||
    message.includes("만료") ||
    message.includes("unauthorized")
  );
}

/**
 * 요청 호출
 * @param path 요청 경로
 * @param init 요청 옵션
 * @returns 요청 결과 (JSON 파싱 결과)
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // /auth/refresh 자체는 재시도 루프 방지
  const skipRefresh = path.startsWith("/auth/refresh");
  const doFetch = async (token: string | null): Promise<{ res: Response; json: ApiResponse<T> }> => {
    const res = await fetch(`${getBaseUrl()}${path}`, buildFetchOptions(init, token));
    // json 파싱...
    let json: ApiResponse<T>;
    try {
      json = (await res.json()) as ApiResponse<T>;
    } catch {
      throw new Error("서버 응답을 파싱하지 못했습니다.");
    }
    return { res, json };
  };

  let accessToken = useAuthStore.getState().accessToken;
  // 최초 요청
  let { res, json }: { res: Response; json: ApiResponse<T> } = await doFetch(accessToken);
  // 실패 + JWT 유저 + refresh 가능하면 갱신 후 1회 재시도
  const failed = !res.ok || ("success" in json && json.success === false);
  const message =
    "message" in json && json.message ? json.message : `요청 실패 (${res.status})`;
  if (failed && !skipRefresh && isUnauthorized(res, message)) {
    const authType = useAuthStore.getState().authType;
    if (authType === "jwt") {
      const newToken = await refreshAccessToken(); // 실패 시 내부에서 store clear
      if (!newToken) {
        throw new Error("로그인이 만료되었습니다. 다시 로그인해 주세요.");
      }
      ({ res, json } = await doFetch(newToken));
    }
  }
  // 재시도 후에도 실패면 throw
  if (!res.ok || ("success" in json && json.success === false)) {
    const msg =
      "message" in json && json.message ? json.message : `요청 실패 (${res.status})`;
    throw new Error(msg);
  }
  return "data" in json ? (json.data as T) : (undefined as T);
}

export async function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}
