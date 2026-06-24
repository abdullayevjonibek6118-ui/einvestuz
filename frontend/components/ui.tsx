import { TrendingDown, TrendingUp } from "lucide-react";
import type { LiveSourceStatus } from "@/lib/data";

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5 overflow-hidden rounded-3xl border border-[#dbe4ef] bg-white/88 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] backdrop-blur sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-[#0f172a]">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#475569]">{subtitle}</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-3 py-2 text-xs font-medium text-[#9a3412]">
          <span className="size-2 rounded-full bg-[#f59e0b]" />
          Образовательная аналитика, не инвестрекомендация
        </div>
      </div>
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-3xl border border-[#dbe4ef] bg-white/92 shadow-[0_14px_45px_rgba(15,23,42,0.06)] backdrop-blur ${className}`}>
      {(title || action) && (
        <div className="flex min-h-14 items-center justify-between border-b border-[#e2e8f0] bg-[#f8fafc]/75 px-4">
          {title ? <h2 className="text-sm font-semibold text-[#0f172a]">{title}</h2> : <span />}
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ChangeBadge({ value }: { value: number }) {
  const neutral = Math.abs(value) < 0.005;
  const positive = value > 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={`tabular-data inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${neutral ? "bg-[#f1f5f9] text-[#475569]" : positive ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#fee2e2] text-[#b91c1c]"}`}>
      {neutral ? <span className="h-px w-3 rounded bg-current" /> : <Icon size={13} />}
      {positive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

const sourceStatusStyles: Record<LiveSourceStatus, string> = {
  live: "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]",
  delayed: "border-[#bfdbfe] bg-[#eff6ff] text-[#1e40af]",
  stale: "border-[#fed7aa] bg-[#fff7ed] text-[#9a3412]",
  offline: "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
  fallback: "border-[#dbe4ef] bg-[#f8fafc] text-[#475569]",
  needs_license: "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9]",
};

const sourceStatusLabels: Record<LiveSourceStatus, string> = {
  live: "Онлайн",
  delayed: "С задержкой",
  stale: "Устарело",
  offline: "Недоступно",
  fallback: "Резерв",
  needs_license: "Нужна лицензия",
};

export function SourceStatusBadge({ status, source }: { status?: LiveSourceStatus; source?: string }) {
  const resolved = status ?? "fallback";

  return (
    <span className={`inline-flex h-6 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-semibold ${sourceStatusStyles[resolved]}`}>
      <span className={`size-1.5 rounded-full ${resolved === "live" ? "bg-[#16a34a]" : resolved === "offline" ? "bg-[#dc2626]" : resolved === "needs_license" ? "bg-[#7c3aed]" : "bg-current"}`} />
      {source ? `${source} · ${sourceStatusLabels[resolved]}` : sourceStatusLabels[resolved]}
    </span>
  );
}

export function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-[#dbe4ef] bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-medium text-[#475569]">{label}</p>
      <p className="tabular-data mt-1 text-base font-semibold text-[#0f172a]">{value}</p>
      {detail ? <p className="mt-1 text-[11px] leading-4 text-[#64748b]">{detail}</p> : null}
    </div>
  );
}
