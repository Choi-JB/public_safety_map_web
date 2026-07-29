// 담당: 공통기반
// 작성자 : 최정봉
// 내용 : 로그인 API (로그인, 로그아웃 전용)
import type { ApiResponse } from "./types";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4100";
}

/** 로그인 유저 정보 */
export type LoginUser = {
  id: number;
  nickname: string | null;
  role: string;
  email: string;
};

/** 로그인 결과 */
export type LoginResult =
  | { authType: "session"; user: LoginUser }
  | { access_token: string; user: LoginUser };

/**
 * 로그인 API
 * @param email 이메일
 * @param password 비밀번호
 * @returns 로그인 결과
 */
export async function loginApi(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${getBaseUrl()}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  let json: ApiResponse<LoginResult>;
  try {
    json = (await res.json()) as ApiResponse<LoginResult>;
  } catch {
    throw new Error("서버 응답을 파싱하지 못했습니다.");
  }

  if (!res.ok || ("success" in json && json.success === false)) {
    const message =
      "message" in json && json.message ? json.message : `로그인 실패 (${res.status})`;
    throw new Error(message);
  }

  if ("data" in json) {
    return json.data;
  }

  throw new Error("로그인 응답이 올바르지 않습니다.");
}

export type RegisterPayload = {
  email: string;
  password: string;
  nickname: string;
};

/**
 * 회원가입 API
 */
export async function registerApi(payload: RegisterPayload): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let json: ApiResponse<unknown>;
  try {
    json = (await res.json()) as ApiResponse<unknown>;
  } catch {
    throw new Error("서버 응답을 파싱하지 못했습니다.");
  }

  if (!res.ok || ("success" in json && json.success === false)) {
    const message =
      "message" in json && json.message
        ? json.message
        : `회원가입 실패 (${res.status})`;
    throw new Error(message);
  }
}

/** 로그아웃 API (일반 유저 JWT 폐기, 관리자 세션 종료) */
export async function logoutApi(): Promise<void> {
    const res = await fetch(`${getBaseUrl()}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  
    let json: ApiResponse<null>;
    try {
      json = (await res.json()) as ApiResponse<null>;
    } catch {
      throw new Error("서버 응답을 파싱하지 못했습니다.");
    }
  
    if (!res.ok || ("success" in json && json.success === false)) {
      const message =
        "message" in json && json.message ? json.message : `로그아웃 실패 (${res.status})`;
      throw new Error(message);
    }
  }