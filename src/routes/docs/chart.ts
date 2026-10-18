import { createFileRoute } from "@tanstack/react-router";
import { siteUrl } from "@/lib/shared";

/**
 * The live site still serves a prerendered /docs/chart calculator page. That
 * page moved to the standalone /chart route, so the old URL must hand its
 * accumulated search signals over as a permanent redirect instead of 404ing.
 * A static route beats the /docs/$ splat for this exact path.
 */
export const Route = createFileRoute("/docs/chart")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(null, {
          status: 301,
          headers: { location: `${siteUrl}/chart` },
        });
      },
    },
  },
});
