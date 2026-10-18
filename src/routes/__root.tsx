import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import appCss from "@/styles/app.css?url";
import { RootProvider } from "fumadocs-ui/provider/tanstack";
import { Banner } from "fumadocs-ui/components/banner";
import { ArrowRightIcon } from "@phosphor-icons/react";
import favicon from "../../assets/favicon.png";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Ascendant",
      },
      {
        name: "description",
        content:
          "Guided astrology workflows for AI agents, backed by local typed Python calculations and inspectable evidence.",
      },
      {
        property: "og:title",
        content: "Ascendant - AI Skills and SDK for Astrology",
      },
      {
        property: "og:description",
        content:
          "Guided astrology workflows for AI agents, backed by local typed Python calculations and inspectable evidence.",
      },
      {
        property: "og:image",
        content: "https://ascendant-docs.vercel.app/solar-system.jpg",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:image",
        content: "https://ascendant-docs.vercel.app/solar-system.jpg",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: favicon },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider>
          <Banner
            id="astro-ascendant-v5-rainbow"
            variant="rainbow"
            rainbowColors={[
              "rgba(76,0,255,0.55)",
              "rgba(180,60,255,0.6)",
              "rgba(0,200,255,0.55)",
              "rgba(90,80,255,0.5)",
            ]}
            className="banner group h-auto! min-h-[3rem] px-4 py-2 pe-10 text-center text-xs leading-snug font-medium text-balance sm:text-[13px]"
          >
            <a
              href="/docs#install"
              aria-label="astro-ascendant 5.0 is here: read the docs"
              className="absolute inset-0"
            />
            <span aria-hidden="true" className="banner-line" />
            <span className="pointer-events-none flex flex-1 items-center justify-center gap-2">
              <span>
                <span className="font-mono">astro-ascendant</span> 5.0 is here
              </span>
              <ArrowRightIcon size={16} className="banner-arrow shrink-0" />
            </span>
          </Banner>
          <Outlet />
        </RootProvider>
        <Scripts />
      </body>
    </html>
  );
}
