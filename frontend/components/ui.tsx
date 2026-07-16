import { TrendingDown, TrendingUp } from "lucide-react";
import type { LiveSourceStatus } from "@/lib/data";

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <header className="page-heading enter"><div><p className="eyebrow">EINVEST RESEARCH</p><h1>{title}</h1><p>{subtitle}</p></div><span className="as-of">ДАННЫЕ · ПО ДОСТУПНЫМ ИСТОЧНИКАМ</span></header>;
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{title || action ? <div className="panel-header">{title ? <h2>{title}</h2> : <span />}{action}</div> : null}<div className="panel-body">{children}</div></section>;
}

export function ChangeBadge({ value }: { value: number }) {
  const positive = value > 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return <span className={`badge ${value === 0 ? "" : positive ? "positive" : "negative"}`}>{value === 0 ? null : <Icon size={12} />}{positive ? "+" : ""}{value.toFixed(2)}%</span>;
}

const statusLabels: Record<LiveSourceStatus, string> = { live: "Онлайн", delayed: "С задержкой", stale: "Устарело", offline: "Недоступно", fallback: "Резерв", needs_license: "Нужна лицензия" };
export function SourceStatusBadge({ status, source }: { status?: LiveSourceStatus; source?: string }) {
  const resolved = status ?? "fallback";
  return <span className={`badge ${resolved === "live" ? "live" : ""}`} title={source}><i />{source ? `${source} · ` : ""}{statusLabels[resolved]}</span>;
}

export function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="metric-tile"><p className="metric-label">{label}</p><p className="metric-value">{value}</p>{detail ? <p className="metric-detail">{detail}</p> : null}</div>;
}
