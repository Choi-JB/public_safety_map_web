// 담당: 피드백/관리자팀

"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyCount } from "@/lib/api/admin";

type Props = {
  reportsDaily: DailyCount[];
  feedbacksDaily: DailyCount[];
};

/** "2026-08-11..." → "08/11" */
function formatDateLabel(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!match) return String(value);
  return `${match[2]}/${match[3]}`;
}

export function DailyTrendChart({ reportsDaily, feedbacksDaily }: Props) {
  const data = reportsDaily.map((r, i) => ({
    date: formatDateLabel(r.date),
    제보: Number(r.count),
    피드백: Number(feedbacksDaily[i]?.count ?? 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ec" />
        <XAxis dataKey="date" stroke="#6b7785" fontSize={12} />
        <YAxis allowDecimals={false} stroke="#6b7785" fontSize={12} width={28} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="제보"
          stroke="#dc2626"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="피드백"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
