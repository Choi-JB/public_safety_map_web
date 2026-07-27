import type{ApiResponse} from "./types";

// 담당: 공통기반
// 작성자 : 최정봉
// 내용 : 클라이언트 요청 전용 API (GET, POST, PATCH, DELETE)
//        로그인 이후 발급된 토큰/쿠키를 자동으로 실어 보내는 범용 클라이언트

import { useAuthStore } from "@/store/authStore";
import type { ApiResponse } from "./types";

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
  try {
    const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    const data = await parseResponse<{ access_token: string }>(res);
    useAuthStore.setState({ accessToken: data.access_token });
    return data.access_token;
  } catch {
    // refresh token도 만료/폐기된 경우 — 완전히 로그아웃 처리
    useAuthStore.setState({
      user: null,
      accessToken: null,
      sessionId: null,
      authType: null,
    });
    return null;
  }
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


/**
 * 요청 호출
 * @param path 요청 경로
 * @param init 요청 옵션
 * @returns 요청 결과 (JSON 파싱 결과)
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${getBaseUrl()}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

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
