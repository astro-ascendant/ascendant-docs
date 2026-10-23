import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckIcon, CopyIcon, GithubLogoIcon } from "@phosphor-icons/react";
import wordmark from "../../assets/wordmark.webp";
import animatedSignature from "../../assets/sign-animated.svg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About - Ascendant" },
      {
        name: "description",
        content:
          "About Ascendant, the modern developer ecosystem for astrology by Laxman K R (@thaletto).",
      },
      {
        property: "og:title",
        content: "About - Ascendant",
      },
      {
        property: "og:description",
        content:
          "About Ascendant, the modern developer ecosystem for astrology by Laxman K R (@thaletto).",
      },
    ],
  }),
});

function AboutPage() {
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyVersion = async () => {
    try {
      await navigator.clipboard.writeText("5.1.0");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback if clipboard API is unavailable
    }
  };

  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center px-6 py-20 antialiased selection:bg-selection-highlight selection:text-foreground">
      <div aria-hidden="true" className="paper-grain" />

      <article className="mx-auto flex w-full max-w-xl flex-col items-center text-center gap-8 sm:gap-10">
        {/* 1. Wordmark */}
        <div className="flex flex-col items-center gap-2">
          <Link
            to="/"
            aria-label="Ascendant home"
            className="inline-block transition-opacity duration-150 ease-out hover:opacity-80 active:scale-[0.98]"
          >
            <img
              src={wordmark}
              alt="Ascendant"
              width={973}
              height={200}
              className="h-7 w-auto sm:h-8"
            />
          </Link>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Modern Developer Ecosystem for Astrology
          </p>
        </div>

        {/* 2. Author / Credits */}
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Written by{" "}
          <a
            href="https://thaletto.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline underline-offset-4 decoration-border transition-colors hover:decoration-foreground"
          >
            Laxman K R (@thaletto)
          </a>
        </p>

        {/* 3. Guiding Quote */}
        <figure className="flex max-w-sm flex-col items-center gap-2 sm:max-w-md">
          <blockquote className="font-serif text-sm italic text-foreground sm:text-base">
            “Millionaires don’t use astrology, billionaires do.”
          </blockquote>
          <figcaption className="w-full text-right font-serif text-xs text-muted-foreground">
            – J.P. Morgan
          </figcaption>
        </figure>

        {/* 4. Colophon */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
            <p>Typeset in Inter, JetBrains Mono, and Libre Baskerville</p>

            <button
              type="button"
              onClick={() => setNoticesOpen(true)}
              className="cursor-pointer underline underline-offset-4 decoration-border transition-colors hover:text-foreground hover:decoration-foreground"
            >
              Third-party notices
            </button>

            <Dialog open={noticesOpen} onOpenChange={setNoticesOpen}>
              <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Third-Party Notices</DialogTitle>
                </DialogHeader>

              <div className="divide-y divide-border text-left text-xs leading-relaxed text-muted-foreground">
                <div className="pt-3 first:pt-1">
                  <div className="flex items-center justify-between font-mono font-medium text-foreground">
                    <a
                      href="https://www.astro.com/swisseph/"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      Swiss Ephemeris (@swisseph/node)
                    </a>
                    <span className="text-[11px] text-muted-foreground">
                      GNU AGPL-3.0
                    </span>
                  </div>
                  <p className="mt-1">Swiss Ephemeris binding for node.js.</p>
                </div>

                <div className="pt-3">
                  <div className="flex items-center justify-between font-mono font-medium text-foreground">
                    <a
                      href="https://effect.website"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      Effect
                    </a>
                    <span className="text-[11px] text-muted-foreground">
                      MIT
                    </span>
                  </div>
                  <p className="mt-1">
                    Build production-ready applications in TypeScript.
                  </p>
                </div>

                <div className="pt-3">
                  <div className="flex items-center justify-between font-mono font-medium text-foreground">
                    <a
                      href="https://tanstack.com"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      TanStack
                    </a>
                    <span className="text-[11px] text-muted-foreground">
                      MIT
                    </span>
                  </div>
                  <p className="mt-1">
                    The open source application stack for the web.
                  </p>
                </div>

                <div className="pt-3">
                  <div className="flex items-center justify-between font-mono font-medium text-foreground">
                    <a
                      href="https://fumadocs.dev"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      Fumadocs
                    </a>
                    <span className="text-[11px] text-muted-foreground">
                      MIT
                    </span>
                  </div>
                  <p className="mt-1">
                    The beautiful & flexible React.js docs framework.
                  </p>
                </div>

                <div className="pt-3">
                  <div className="flex items-center justify-between font-mono font-medium text-foreground">
                    <a
                      href="https://tailwindcss.com"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      Tailwind CSS
                    </a>
                    <span className="text-[11px] text-muted-foreground">
                      MIT
                    </span>
                  </div>
                  <p className="mt-1">
                    A utility-first CSS framework for rapid UI development.
                  </p>
                </div>

                <div className="pt-3">
                  <div className="flex items-center justify-between font-mono font-medium text-foreground">
                    <a
                      href="https://phosphoricons.com"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      Phosphor Icons
                    </a>
                    <span className="text-[11px] text-muted-foreground">
                      MIT
                    </span>
                  </div>
                  <p className="mt-1">A flexible icon family for everyone.</p>
                </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* 5. Version & License */}
          <div className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
            <button
              type="button"
              onClick={copyVersion}
              title="Click to copy version number"
              aria-label="Copy version number 5.1.0"
              className="group inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <span>Version 5.1.0</span>
              {copied ? (
                <span className="inline-flex items-center gap-0.5 rounded-xs bg-secondary px-1 py-0.2 text-[10px] font-mono font-medium text-foreground">
                  <CheckIcon size={11} className="text-foreground" />
                  Copied
                </span>
              ) : (
                <CopyIcon
                  size={12}
                  className="opacity-0 transition-opacity duration-150 group-hover:opacity-60"
                />
              )}
            </button>

          </div>

          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <a
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              target="_blank"
              rel="noreferrer"
              title="GNU AGPL v3 License"
              className="inline-flex h-4 items-center rounded-xs border border-current px-1 text-[9px] font-mono font-semibold tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              GNU AGPL V3
            </a>
            <a
              href="https://www.npmjs.com/package/astro-ascendant"
              target="_blank"
              rel="noreferrer"
              title="npm: astro-ascendant"
              className="inline-flex h-4 items-center rounded-xs border border-current px-1 text-[9px] font-mono font-semibold tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              NPM
            </a>
            <a
              href="https://github.com/astro-ascendant"
              target="_blank"
              rel="noreferrer"
              aria-label="Ascendant GitHub"
              title="GitHub: astro-ascendant"
              className="opacity-70 transition-opacity hover:opacity-100"
            >
              <GithubLogoIcon size={18} />
            </a>
          </div>
        </div>

        {/* 6. Copyright & Creator Wordmark */}
        <footer className="flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground sm:text-sm">
            © 2026 Laxman K R
          </p>

          <div
            className="mt-2 select-none"
            aria-hidden="true"
          >
            <img
              src={animatedSignature}
              alt=""
              className="h-auto w-28 brightness-0 invert opacity-40 transition-opacity duration-200 hover:opacity-60"
            />
          </div>
        </footer>
      </article>
    </main>
  );
}
