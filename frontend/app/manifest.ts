import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "EInvest — рынок Узбекистана", short_name: "EInvest", description: "Аналитика публичных компаний Узбекистана", start_url: "/", display: "standalone", background_color: "#080b10", theme_color: "#080b10", lang: "ru" };
}
