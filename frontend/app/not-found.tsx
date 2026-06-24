import Link from "next/link";

export const dynamic = "force-static";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Страница не найдена</h1>
        <Link href="/dashboard" className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]">
          На дашборд
        </Link>
      </div>
    </div>
  );
}
