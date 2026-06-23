import { TrendingDown, TrendingUp } from "lucide-react";

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-[#111827]">{title}</h1>
        <p className="mt-1 text-sm text-[#667085]">{subtitle}</p>
      </div>
      <div className="rounded-md border border-[#dde3eb] bg-white px-3 py-2 text-xs text-[#667085]">
        Данные демо. Не инвестиционная рекомендация.
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
    <section className={`rounded-md border border-[#dde3eb] bg-white ${className}`}>
      {(title || action) && (
        <div className="flex min-h-12 items-center justify-between border-b border-[#dde3eb] px-4">
          {title ? <h2 className="text-sm font-semibold">{title}</h2> : <span />}
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ChangeBadge({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${positive ? "bg-[#e8f8f0] text-[#0f9f6e]" : "bg-[#fdecec] text-[#dc2626]"}`}>
      <Icon size={13} />
      {positive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#dde3eb] bg-[#fbfcfe] p-3">
      <p className="text-xs text-[#667085]">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}
