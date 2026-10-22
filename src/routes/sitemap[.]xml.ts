import { source } from "@/lib/source";
import { siteUrl } from "@/lib/shared";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Generated so the sitemap cannot drift from the content tree. Every entry is
 * a canonical, indexable URL on the origin that actually serves this site.
 */
const staticPaths = ["/", "/chart", "/docs"] as const;

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const paths = new Set<string>(staticPaths);
        for (const page of source.getPages()) {
          paths.add(page.url);
        }

        const urls = [...paths]
          .map((path) => {
            const loc = path === "/" ? siteUrl : `${siteUrl}${path}`;
            return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
          })
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=0, s-maxage=3600",
          },
        });
      },
    },
  },
});
