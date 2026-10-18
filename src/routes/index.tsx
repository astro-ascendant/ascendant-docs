import { createFileRoute, Link } from "@tanstack/react-router";
import solarSystem from "../../assets/solar-system.webp";
import wordmark from "../../assets/wordmark.webp";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col pb-20 antialiased">
      <div aria-hidden="true" className="paper-grain" />
      <div className="mx-auto w-full max-w-173 flex-1 px-4 pt-14">
        <a href="/" aria-label="Ascendant home" className="inline-block">
          <img src={wordmark} alt="Ascendant" height={32} className="h-8 w-auto" />
        </a>

        <section aria-label="Ascendant birth chart calculator" className="mt-10">
          <div className="grid w-full items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
            <div className="flex flex-col items-start">
              <h1 className="font-sans text-lg font-medium tracking-tight text-foreground sm:text-xl">
                Understand your birth chart.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                Unlike the broad and vague magazine horoscopes that only use your{" "}
                <span className="font-serif italic">sun sign</span>, we use a complete picture of
                the sky when and where you were born to generate your full birth{" "}
                <span className="font-mono">chart</span>.
              </p>
              <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <Link
                  to="/docs/$"
                  params={{ _splat: "chart" }}
                  className="bg-primary text-primary-foreground w-fit rounded-lg px-5 py-2 text-sm font-medium transition-transform duration-150 ease-out hover:opacity-90 active:scale-[0.96]"
                >
                  Generate chart
                </Link>
              </div>
            </div>

            <div className="order-first lg:order-last">
              <img
                src={solarSystem}
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
              <Link
                to="/docs/$"
                params={{ _splat: "skills" }}
                className="group flex flex-wrap items-center gap-2 py-3.5"
              >
                <span className="min-w-0 text-sm font-medium text-foreground sm:text-base">
                  Skills
                </span>
                <span
                  aria-hidden="true"
                  className="hidden shrink-0 text-sm text-muted-foreground sm:inline"
                >
                  /
                </span>
                <span className="min-w-0 basis-full truncate text-sm text-muted-foreground transition-colors duration-150 ease-out group-hover:text-foreground sm:basis-auto sm:flex-1">
                  Install the skill into Claude, Codex, or any agent
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/docs/$"
                params={{ _splat: "chart" }}
                className="group flex flex-wrap items-center gap-2 py-3.5"
              >
                <span className="min-w-0 text-sm font-medium text-foreground sm:text-base">
                  Chart Generator
                </span>
                <span
                  aria-hidden="true"
                  className="hidden shrink-0 text-sm text-muted-foreground sm:inline"
                >
                  /
                </span>
                <span className="min-w-0 basis-full truncate text-sm text-muted-foreground transition-colors duration-150 ease-out group-hover:text-foreground sm:basis-auto sm:flex-1">
                  Generate a full chart from date, time, and place
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
                <span className="min-w-0 basis-full truncate text-sm text-muted-foreground transition-colors duration-150 ease-out group-hover:text-foreground sm:basis-auto sm:flex-1">
                  Effect services for charts, dashas, and transits
                </span>
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
