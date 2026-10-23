import { createFileRoute, Link } from "@tanstack/react-router";
import wordmark from "../../assets/wordmark.webp";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Free Horoscope Calculator - Ascendant" },
      {
        name: "description",
        content:
          "Understand your horoscope with a free Vedic horoscope calculator. Enter your birth date, time, and place to see your ascendant, moon sign, and dashas.",
      },
      {
        property: "og:title",
        content: "Free Horoscope Calculator - Ascendant",
      },
      {
        property: "og:description",
        content:
          "Understand your horoscope with a free Vedic horoscope calculator. Enter your birth date, time, and place to see your ascendant, moon sign, and dashas.",
      },
    ],
  }),
});

function LandingPage() {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col antialiased">
      <div aria-hidden="true" className="paper-grain" />
      <div className="mx-auto w-full max-w-173 flex-1 px-4 pt-14 lg:max-w-4xl">
        <a href="/" aria-label="Ascendant home" className="inline-block">
          <img src={wordmark} alt="Ascendant" width={973} height={200} className="h-8 w-auto" />
        </a>

        <section aria-label="Ascendant horoscope calculator" className="mt-10">
          <div className="grid w-full items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="flex flex-col items-start">
              <h1 className="font-sans text-lg font-medium tracking-tight text-foreground sm:text-xl">
                Understand your horoscope.
              </h1>
              <p className="mt-4 max-w-prose text-sm leading-relaxed text-pretty text-muted-foreground sm:text-base">
                Unlike the broad and vague magazine horoscopes that only use your{" "}
                <span className="font-serif italic">sun sign</span>, we use a complete picture of
                the sky when and where you were born to generate your full horoscope.
              </p>
              <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <Link
                  to="/chart"
                  className="bg-primary text-primary-foreground w-fit rounded-lg px-5 py-2 text-sm font-medium transition-transform duration-150 ease-out hover:opacity-90 active:scale-[0.96]"
                >
                  Create Horoscope
                </Link>
              </div>
            </div>

            <div className="order-first lg:order-last">
              <img
                src="/solar-system.webp"
                alt=""
                aria-hidden="true"
                width={1376}
                height={768}
                className="h-auto w-full"
              />
            </div>
          </div>
        </section>

        <section className="mt-16 sm:mt-24">
          <h2 className="section-tag-ruled text-sm font-medium sm:text-base">
            <span>Docs</span>
            <span className="section-tag-rule" aria-hidden="true" />
          </h2>
          <ul className="mt-2 flex flex-col">
            <li>
              <a href="/docs" className="group flex flex-wrap items-center gap-2 py-3.5">
                <span className="min-w-0 text-sm font-medium text-foreground sm:text-base">
                  Getting Started
                </span>
                <span
                  aria-hidden="true"
                  className="hidden shrink-0 text-sm text-muted-foreground sm:inline"
                >
                  /
                </span>
                <span className="min-w-0 basis-full text-sm text-muted-foreground transition-colors duration-150 ease-out group-hover:text-foreground sm:basis-auto sm:flex-1">
                  Install Ascendant and run your first chart calculation
                </span>
              </a>
            </li>
            <li>
              <Link
                to="/docs/$"
                params={{ _splat: "skills" }}
                className="group flex flex-wrap items-center gap-2 py-3.5"
              >
                <span className="min-w-0 text-sm font-medium text-foreground sm:text-base">
                  Skills and Plugins
                </span>
                <span
                  aria-hidden="true"
                  className="hidden shrink-0 text-sm text-muted-foreground sm:inline"
                >
                  /
                </span>
                <span className="min-w-0 basis-full text-sm text-muted-foreground transition-colors duration-150 ease-out group-hover:text-foreground sm:basis-auto sm:flex-1">
                  Install plugin and skills for OpenCode and more
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/docs/$"
                params={{ _splat: "api-reference/chart" }}
                className="group flex flex-wrap items-center gap-2 py-3.5"
              >
                <span className="min-w-0 text-sm font-medium text-foreground sm:text-base">
                  API
                </span>
                <span
                  aria-hidden="true"
                  className="hidden shrink-0 text-sm text-muted-foreground sm:inline"
                >
                  /
                </span>
                <span className="min-w-0 basis-full text-sm text-muted-foreground transition-colors duration-150 ease-out group-hover:text-foreground sm:basis-auto sm:flex-1">
                  Effect services for charts, dashas, and transits
                </span>
              </Link>
            </li>
          </ul>
        </section>
      </div>
      <footer className="mx-auto mt-12 flex w-full max-w-173 justify-center px-4 pb-8 lg:max-w-4xl">
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="text-xs text-muted-foreground">© 2026 Laxman K R</span>
          <span aria-hidden="true" className="text-xs text-muted-foreground/60">•</span>
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.html"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
          >
            GNU AGPL v3
          </a>
          <span aria-hidden="true" className="text-xs text-muted-foreground/60">•</span>
          <Link
            to="/about"
            className="text-xs text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
          >
            About
          </Link>
        </nav>
      </footer>
    </main>
  );
}
