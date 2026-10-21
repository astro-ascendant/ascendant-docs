# How to contribute

Thanks for helping with Ascendant’s TypeScript docs. This repo is the
documentation site and the in-browser birth chart calculator. Python docs live
in the [ascendant repo](https://github.com/astro-ascendant/ascendant/tree/main/docs/content),
not here.

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Run the site locally

You need [Bun](https://bun.sh) and Make. From the repo root:

```bash
make install
make dev
```

Then open `http://localhost:3000`. Docs are under `/docs`. The calculator is
`/docs/chart`. Run `make help` to list commands.

Before you open a pull request:

```bash
make check
```

`make fmt` rewrites files. `make lint-fix` applies lint fixes.

`npm` can install and build too, but it needs the repo `.npmrc`
(`legacy-peer-deps=true`). Prefer Bun when you can.

## Where things live

| Path                            | What it is                                |
| ------------------------------- | ----------------------------------------- |
| `content/`                      | Doc pages (Markdown and MDX)              |
| `content/meta.json`             | Sidebar order for top-level pages         |
| `content/api-reference/`        | Library API pages                         |
| `src/components/chart/`         | Birth chart calculator UI                 |
| `src/lib/chart.ts`              | Calculator display types and helpers      |
| `src/server/calculate-chart.ts` | Server calculation used by the calculator |

Pages need a `title` and `description` in the frontmatter. To add a page, create
the file under `content/` and add its slug to the matching `meta.json`.

Library examples should match `astro-ascendant` as it ships on npm. Getting
started uses Bun and Effect; keep new API samples in that style unless you are
documenting another runtime on purpose.

## Writing

Keep the voice friendly and plain. Prefer everyday words over jargon like
“engine” or “pipeline”.

- Name the calculation method you are talking about (Parashari, Jaimini, KP,
  Lahiri, Whole Sign, and so on).
- Keep birth data, calculated records, charts, timing, and interpretation
  distinct.
- When you document a new behavior, include the evidence or source that
  supports it.
- A reading is guidance, not certainty, and not a substitute for medical,
  legal, or financial advice. Do not write copy that implies otherwise.
- This site is TypeScript only. If you need to mention Python, link to
  [its docs in the library repo](https://github.com/astro-ascendant/ascendant/tree/main/docs/content).

## Pull requests

Open a PR against `main` with a short description of what changed and why.
Keep unrelated edits out of the same PR.
