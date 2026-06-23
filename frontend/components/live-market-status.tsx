"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Database, Radio, WifiOff } from "lucide-react";
import { SourceStatusBadge } from "@/components/ui";
import type { MarketDataSource } from "@/lib/data";
import { getWebSocketUrl, normalizeQuoteMessages, type BackendQuoteMessage, type LiveQuote } from "@/lib/live-market";

type ConnectionState = "connecting" | "live" | "offline";

export function LiveMarketStatus({ sources, symbols }: { sources: MarketDataSource[]; symbols: string[] }) {
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const uniqueSymbols = useMemo(() => Array.from(new Set(symbols.map((symbol) => symbol.toUpperCase()))).slice(0, 12), [symbols]);

  useEffect(() => {
    if (!uniqueSymbols.length) {
      setConnection("offline");
      return;
    }

    const query = `?symbols=${encodeURIComponent(uniqueSymbols.join(","))}`;
    const socket = new WebSocket(getWebSocketUrl(`/ws/quotes${query}`));
    let closedByEffect = false;

    socket.addEventListener("open", () => {
      setConnection("live");
      socket.send(JSON.stringify({ type: "subscribe", symbols: uniqueSymbols }));
    });

    socket.addEventListener("message", (event) => {
      try {
        const incoming = normalizeQuoteMessages(JSON.parse(event.data) as BackendQuoteMessage);
        if (!incoming.length) return;

        setQuotes((current) => {
          const next = { ...current };
          for (const quote of incoming) next[quote.ticker] = quote;
          return next;
        });
        setLastUpdate(new Date());
        setConnection("live");
      } catch {
        setConnection("offline");
      }
    });

    socket.addEventListener("close", () => {
      if (!closedByEffect) setConnection("offline");
    });

    socket.addEventListener("error", () => {
      setConnection("offline");
    });

    return () => {
      closedByEffect = true;
      socket.close();
    };
  }, [uniqueSymbols]);

  const latestQuotes = Object.values(quotes).slice(0, 4);
  const activeSources = sources.filter((source) => source.status === "live" || source.status === "delayed").length;
  const connectionLabel = connection === "live" ? "Live refresh" : connection === "connecting" ? "Connecting" : "Awaiting backend";
  const ConnectionIcon = connection === "offline" ? WifiOff : Radio;

  return (
    <section className="mb-4 rounded-lg border border-[#dbe4ef] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex h-8 items-center gap-2 rounded-md border border-[#dbe4ef] bg-[#f8fafc] px-3 text-xs font-semibold text-[#0f172a]">
            <ConnectionIcon size={15} className={connection === "live" ? "text-[#16a34a]" : "text-[#64748b]"} />
            {connectionLabel}
          </div>
          <div className="inline-flex h-8 items-center gap-2 rounded-md border border-[#dbe4ef] bg-[#f8fafc] px-3 text-xs font-medium text-[#475569]">
            <Database size={15} />
            {activeSources}/{sources.length} sources active
          </div>
          {lastUpdate ? (
            <div className="tabular-data inline-flex h-8 items-center gap-2 rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-3 text-xs font-semibold text-[#166534]">
              <Activity size={15} />
              {lastUpdate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sources.slice(0, 4).map((source) => (
            <SourceStatusBadge key={source.id} source={source.name} status={source.status} />
          ))}
        </div>
      </div>

      {latestQuotes.length ? (
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {latestQuotes.map((quote) => (
            <div key={quote.ticker} className="flex items-center justify-between rounded-md border border-[#dbe4ef] bg-[#f8fafc] px-3 py-2">
              <div>
                <p className="tabular-data text-xs font-semibold text-[#1e40af]">{quote.ticker}</p>
                <p className="tabular-data text-sm font-semibold text-[#0f172a]">{formatQuotePrice(quote.price, quote.currency)}</p>
              </div>
              <SourceStatusBadge source={quote.source} status={quote.sourceStatus} />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function formatQuotePrice(price: number, currency?: string) {
  if (currency === "RUB") return `${price.toFixed(2)} RUB`;
  if (currency === "UZS") return `${price.toLocaleString("en-US")} UZS`;
  return `$${price.toFixed(2)}`;
}
