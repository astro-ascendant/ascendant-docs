import { createFileRoute } from "@tanstack/react-router";
import { siteUrl } from "@/lib/shared";
import { source, getLLMText } from "@/lib/source";

export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: async () => {
        const scan = source.getPages().map(getLLMText);
        const scanned = await Promise.all(scan);
        // Serve canonical absolute URLs so LLM crawlers never guess the origin.
        return new Response(scanned.join("\n\n").replaceAll("](/", `](${siteUrl}/`));
      },
    },
  },
});
