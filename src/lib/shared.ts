export const appName = "Ascendant";

/**
 * Canonical origin for absolute URLs (canonicals, og:url, sitemap entries).
 *
 * This must be the host that actually answers 200. Canonicals that point at a
 * redirecting alias are discarded by search engines, which then pick their own
 * canonical for every page.
 *
 * Set `VITE_SITE_URL` when the site moves to a custom domain; the `.vercel.app`
 * host stays as the fallback so local builds and previews keep working.
 */
function resolveSiteUrl(): string {
  const configured = (import.meta.env.VITE_SITE_URL ?? "").trim();
  const origin =
    configured === "" ? "https://astro-ascendant.vercel.app" : configured;
  return origin.replace(/\/+$/, "");
}

export const siteUrl = resolveSiteUrl();

export const docsRoute = "/docs";

export const gitConfig = {
  user: "astro-ascendant",
  repo: "ascendant-ts",
  branch: "main",
};

export const skillsGitConfig = {
  user: "astro-ascendant",
  repo: "skills",
  branch: "main",
};

export const ASCENDANT_VERSION = "1.0.1";
