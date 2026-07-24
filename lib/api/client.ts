import type{ApiResponse} from "./types";

// 담당: 공통기반
// 후에 authorization 헤더 추가 필요할 시 기입

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is missing");
  return base.replace(/\/$/, "");
}
async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new Error(`Invalid JSON (${res.status}) ${path}`);
  }
  if (!res.ok || !json.success) {
    const message =
      !json.success && json.message
        ? json.message
        : `Request failed (${res.status}) ${path}`;
    throw new Error(message);
  }
  return json.data;
}



  export async function get<T>(path: string): Promise<T> {
    //GET 요청
    return request<T>(path,{method: "GET"});
  }

  export async function post<T>(path: string, body?: unknown): Promise<T> {
    //POST 요청
    return request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  export async function patch<T>(path: string, body?: unknown): Promise<T> {
    //PATCH 요청
    return request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  export async function del<T>(path: string): Promise<T> {
    //DELETE 요청
    return request<T>(path, { method: "DELETE" });
  }
