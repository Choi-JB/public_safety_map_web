import { createClient } from "@/lib/supabase/client";

export type ChatReportStatus = "PENDING" | "RESOLVED" | "REJECTED";

export type ChatReport = {
  idx: number;
  message_idx: number | null;
  rooms_id: number;
  reporter_id: string | null;
  reported_id: string | null;
  content_snapshot: string | null;
  reason: string | null;
  status: ChatReportStatus;
  created_at?: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
};

export type ReportMessageInput = {
  messageIdx: number;
  roomsId: number;
  reporterId: string;
  reportedId: string;
  contentSnapshot: string;
  reason?: string;
};

/** 유저: 메시지 신고 */
export async function reportMessage(input: ReportMessageInput): Promise<void> {
  const supabase = createClient();

  const reporterId = input.reporterId.trim();
  const reportedId = input.reportedId.trim();
  if (!reporterId || !reportedId) {
    throw new Error("신고자/피신고자 정보가 없습니다.");
  }
  if (reporterId === reportedId) {
    throw new Error("자신의 메시지는 신고할 수 없습니다.");
  }

  // 같은 사람이 같은 메시지 중복 신고 방지
  const { data: existing } = await supabase
    .from("chat_reports")
    .select("idx")
    .eq("message_idx", input.messageIdx)
    .eq("reporter_id", reporterId)
    .maybeSingle();

  if (existing) {
    throw new Error("이미 신고한 메시지입니다.");
  }

  const { error } = await supabase.from("chat_reports").insert({
    message_idx: input.messageIdx,
    rooms_id: input.roomsId,
    reporter_id: reporterId,
    reported_id: reportedId,
    content_snapshot: input.contentSnapshot,
    reason: input.reason?.trim() || null,
    status: "PENDING",
  });

  if (error) throw error;
}

/** 관리자: 신고 목록 */
export async function fetchChatReports(opts?: {
  status?: ChatReportStatus | "ALL";
}): Promise<ChatReport[]> {
  const supabase = createClient();
  let q = supabase
    .from("chat_reports")
    .select(
      "idx, message_idx, rooms_id, reporter_id, reported_id, content_snapshot, reason, status, created_at, resolved_at, resolved_by"
    )
    .order("created_at", { ascending: false });

  if (opts?.status && opts.status !== "ALL") {
    q = q.eq("status", opts.status);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ChatReport[];
}

/** 관리자: 신고 상태 변경 */
export async function updateChatReportStatus(input: {
  reportIdx: number;
  status: ChatReportStatus;
  resolvedBy: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("chat_reports")
    .update({
      status: input.status,
      resolved_at: new Date().toISOString(),
      resolved_by: input.resolvedBy.trim() || null,
    })
    .eq("idx", input.reportIdx);

  if (error) throw error;
}