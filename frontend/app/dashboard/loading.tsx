import { PageHeader, Panel } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <>
      <PageHeader title="Главная" subtitle="Загружаем рынок, новости и AI-идеи дня для инвесторов из Узбекистана." />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-24 rounded-2xl border border-[#dbe4ef] bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="h-3 w-24 rounded-full bg-[#e2e8f0]" />
            <div className="mt-4 h-5 w-32 rounded-full bg-[#dbe4ef]" />
            <div className="mt-3 h-3 w-40 rounded-full bg-[#e2e8f0]" />
          </div>
        ))}
      </div>

      <Panel title="Рынок">
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_180px_120px]">
          <div className="h-11 rounded-2xl bg-[#eef2f7]" />
          <div className="h-11 rounded-2xl bg-[#eef2f7]" />
          <div className="h-11 rounded-2xl bg-[#dbe4ef]" />
        </div>
        <div className="overflow-hidden rounded-3xl border border-[#dbe4ef] bg-white">
          <div className="grid grid-cols-[48px_52px_1.4fr_repeat(5,0.8fr)] gap-3 border-b border-[#e2e8f0] bg-[#f8fafc] p-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-3 rounded-full bg-[#e2e8f0]" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, row) => (
            <div key={row} className="grid grid-cols-[48px_52px_1.4fr_repeat(5,0.8fr)] items-center gap-3 border-b border-[#eef2f7] p-3 last:border-b-0">
              <div className="h-3 rounded-full bg-[#eef2f7]" />
              <div className="size-10 rounded-2xl bg-[#e2e8f0]" />
              <div>
                <div className="h-4 w-40 rounded-full bg-[#e2e8f0]" />
                <div className="mt-2 h-3 w-20 rounded-full bg-[#eef2f7]" />
              </div>
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-4 rounded-full bg-[#eef2f7]" />
              ))}
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
