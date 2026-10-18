import { source } from "@/lib/source";
import { siteUrl } from "@/lib/shared";
import { createFileRoute } from "@tanstack/react-router";
import { llms } from "fumadocs-core/source";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        // Serve canonical absolute URLs so LLM crawlers never guess the origin.
        const text = await llms(source).index();
        return new Response(text.replaceAll("](/", `](${siteUrl}/`));
      },
    },
  },
});
