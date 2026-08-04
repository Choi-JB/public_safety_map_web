// 담당: 공통기반
// 내용: 마이페이지 API

import { get } from "./client";

export type MyPageSummary = {
  reportCount: number;
  feedbackCount: number;
};

export type MyReport = {
  id: number | string;
  type: string | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string | null;
  expire_at: string | null;
};

export type MyFeedbackTag = {
  id: number;
  name: string;
};

export type MyFeedback = {
  id: number;
  comment: string | null;
  safety_feeling: string | null;
  img_url: string | null;
  created_at: string | null;
  grid_id: string | number | null;
  tags: MyFeedbackTag[];
};

/**
 * 마이페이지 요약 (제보/피드백 수)
 * @param userId 유저 ID
 */
export async function fetchMyPageSummary(userId: number): Promise<MyPageSummary> {
  return get<MyPageSummary>(`/mypage`);
}

/**
 * 마이페이지 제보 목록 (최신순)
 * query: page, limit  / 유저는 JWT로 식별
 */
export async function fetchMyPageReports(
  page: number,
  limit = 10,
): Promise<MyReport[]> {
  const qs = `?page=${encodeURIComponent(String(page))}&limit=${encodeURIComponent(String(limit))}`;
  const data = await get<MyReport[] | { reports: MyReport[] }>(
    `/mypage/report${qs}`,
  );

  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.reports)) return data.reports;
  return [];
}

/**
 * 마이페이지 피드백 목록 (최신순)
 * query: page, limit  / 유저는 JWT로 식별
 */
export async function fetchMyPageFeedbacks(
  page: number,
  limit = 10,
): Promise<MyFeedback[]> {
  const qs = `?page=${encodeURIComponent(String(page))}&limit=${encodeURIComponent(String(limit))}`;
  const data = await get<MyFeedback[] | { feedbacks: MyFeedback[] }>(
    `/mypage/feedback${qs}`,
  );

  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.feedbacks)) return data.feedbacks;
  return [];
}
