// Generate content/api-reference pages from installed astro-ascendant exports.
// The mapping below is the curated control surface: package subpaths and page
// metadata are fixed here, every symbol section is generated from .d.ts.
// Usage:
//   bun run scripts/sync-api.ts          # regenerate pages + meta.json
//   bun run scripts/sync-api.ts --check  # report drift without writing
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";

const docsRoot = join(import.meta.dir, "..");
const apiDir = join(docsRoot, "content", "api-reference");
const require = createRequire(join(docsRoot, "package.json"));
const pkgDir = dirname(require.resolve("astro-ascendant/package.json"));
const pkg = require("astro-ascendant/package.json") as {
  version: string;
  exports: Record<string, string | Record<string, string>>;
};

// Package subpath -> generated doc page (without extension).
const SUBPATH_TO_PAGE: Record<string, string> = {
  "./chart": "chart",
  "./chart/divisional-mapping": "chart",
  "./astro-params": "astro-params",
  "./ephemeris": "ephemeris",
  "./swisseph": "swisseph",
  "./dasha": "dasha",
  "./dasha/chara": "dasha",
  "./dasha/sthira": "dasha",
  "./dasha/vimshottari": "dasha",
  "./transit": "transit",
  "./sav": "sav",
  "./argala": "jaimini",
  "./arudha-pada": "jaimini",
  "./chara-karakas": "jaimini",
  "./karakamsha": "jaimini",
  "./rashi-drishti": "jaimini",
  "./upapada": "jaimini",
  "./provenance": "provenance",
  "./package.json": "(skip)",
};

const SKIP = new Set([".", "./package.json"]);

interface PageMeta {
  title: string;
  description: string;
}

const PAGES: Record<string, PageMeta> = {
  "astro-params": {
    title: "AstroParams",
    description:
      "Astro parameter configuration for ayanamsa and house-system selection.",
  },
  chart: {
    title: "Chart",
    description:
      "Chart generation and placement models for D1 and divisional charts.",
  },
  dasha: {
    title: "Dasha",
    description:
      "Vimshottari, Chara, and Sthira dasha calculations and queries.",
  },
  ephemeris: {
    title: "Ephemeris",
    description:
      "Ephemeris service contract and runtime-neutral position models.",
  },
  jaimini: {
    title: "Jaimini",
    description:
      "Jaimini calculations for Chara Karakas, Rashi Drishti, Karakamsha, Arudha Pada, Upapada, and Argala.",
  },
  provenance: {
    title: "Provenance",
    description:
      "Method specification and provenance records attached to calculations.",
  },
  sav: {
    title: "SAV",
    description:
      "Ashtakavarga and Shodhya Pinda calculations for shared chart placements.",
  },
  swisseph: {
    title: "Swisseph",
    description:
      "Swiss Ephemeris integration layer for the TypeScript astrology library.",
  },
  transit: {
    title: "Transit",
    description:
      "Mechanics-only search for the next or previous transit events of one graha.",
  },
};

const META_TITLE = "API reference";
const MAX_SIGNATURE_CHARS = 1500;

type Bucket = "Functions" | "Classes" | "Interfaces" | "Types" | "Constants";

interface SymbolEntry {
  name: string;
  bucket: Bucket;
  signature: string;
  docs: string;
  sources: string[];
}

// --- Minimal .d.ts reader -------------------------------------------------
// Generated declarations have a regular shape, so a small brace-aware scanner
// is enough: no compiler dependency required.

interface RawSymbol {
  name: string;
  kind: "const" | "function" | "class" | "interface" | "type" | "enum";
  text: string;
  docs: string;
}

function splitStatements(source: string): string[] {
  const statements: string[] = [];
  let depth = 0;
  let current = "";
  let i = 0;
  const push = () => {
    const trimmed = current.trim();
    if (trimmed) statements.push(trimmed);
    current = "";
  };
  while (i < source.length) {
    const ch = source[i];
    // Skip line comments and sourceMappingURL notes.
    if (ch === "/" && source[i + 1] === "/") {
      const end = source.indexOf("\n", i);
      i = end === -1 ? source.length : end;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      const block = end === -1 ? source.slice(i) : source.slice(i, end + 2);
      // Keep JSDoc blocks attached to the following statement.
      if (block.startsWith("/**")) current += `\n${block}\n`;
      i = end === -1 ? source.length : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      current += ch;
      i++;
      while (i < source.length) {
        current += source[i];
        if (source[i] === "\\") {
          current += source[i + 1] ?? "";
          i += 2;
          continue;
        }
        i++;
        if (source[i - 1] === quote) break;
      }
      continue;
    }
    if (ch === "{" || ch === "(" || ch === "[") depth++;
    if (ch === "}" || ch === ")" || ch === "]") depth--;
    if (ch === "}" && depth === 0) {
      // End of a brace block only completes the statement when nothing but
      // `;` or a line break follows (e.g. `export { x } from "./y.js";`
      // continues on the same line).
      let j = i + 1;
      while (source[j] === " " || source[j] === "\t") j++;
      if (source[j] === ";") {
        current += ch + ";";
        i = j + 1;
        push();
        continue;
      }
      if (j >= source.length || source[j] === "\n" || source[j] === "\r") {
        current += ch;
        i++;
        push();
        continue;
      }
      current += ch;
      i++;
      continue;
    }
    current += ch;
    i++;
    if (depth === 0 && ch === ";") push();
  }
  push();
  return statements;
}

function resolveModule(fromFile: string, specifier: string): string {
  const base = resolve(dirname(fromFile), specifier);
  if (base.endsWith(".js")) {
    const dts = base.replace(/\.js$/, ".d.ts");
    if (existsSync(dts)) return dts;
  }
  if (existsSync(base) && !base.endsWith(".d.ts")) {
    const index = join(base, "index.d.ts");
    if (existsSync(index)) return index;
  }
  const withExt = `${base}.d.ts`;
  if (existsSync(withExt)) return withExt;
  throw new Error(`Cannot resolve ${specifier} from ${fromFile}`);
}

const DECL_RE =
  /^export\s+(?:declare\s+)?(?:(const|function|class|interface|type|enum|abstract\s+class)\s+([A-Za-z_$][\w$]*))/;
const REEXPORT_STAR_RE = /^export\s*\*\s*from\s*["']([^"']+)["']/;
const REEXPORT_NAMED_RE =
  /^export\s*(?:type\s+)?\{([^}]*)\}(?:\s*from\s*["']([^"']+)["'])?/;
const LOCAL_DECL_RE =
  /^(?:declare\s+)?(const|function|class|interface|type|enum|abstract class)\s+([A-Za-z_$][\w$]*)/;

function addSymbol(
  statement: string,
  rawKind: string,
  name: string,
  target: Map<string, RawSymbol>,
): void {
  if (target.has(name)) return;
  const kind =
    rawKind === "abstract class" ? "class" : (rawKind as RawSymbol["kind"]);
  let text = statement;
  let docs = "";
  const jsdoc = text.match(/^\/\*\*[\s\S]*?\*\//);
  if (jsdoc) {
    docs = jsdoc[0]
      .replace(/^\/\*\*\s?/, "")
      .replace(/\s?\*\/$/, "")
      .split("\n")
      .map((line) => line.replace(/^\s*\*\s?/, "").trimEnd())
      .filter((line) => !line.startsWith("@"))
      .join("\n")
      .trim();
    text = text.slice(jsdoc[0].length).trim();
  }
  target.set(name, { name, kind, text: cleanSignature(text), docs });
}

function aliased(symbol: RawSymbol, as: string): RawSymbol {
  if (as === symbol.name) return symbol;
  // Rewrite the declared name so the signature shows the public export name
  // (e.g. `declare const layer` exported as `SwissephLayer`).
  const text = symbol.text.replace(
    /^(declare\s+)?(const|function|class|interface|type|enum)\s+[\w$]+\b/,
    (_match, declarePrefix, kind) => `${declarePrefix ?? ""}${kind} ${as}`,
  );
  return { ...symbol, name: as, text };
}

function parseNameList(list: string): Array<{ from: string; as: string }> {
  return list
    .split(",")
    .map((s) => s.trim().replace(/^type\s+/, ""))
    .filter((s) => s.length > 0)
    .map((s) => {
      const parts = s.split(/\s+as\s+/);
      return parts.length === 2
        ? { from: parts[0].trim(), as: parts[1].trim() }
        : { from: s, as: s };
    });
}

function parseDtsFile(
  absPath: string,
  out: Map<string, RawSymbol>,
  seen: Set<string>,
): void {
  if (seen.has(absPath)) return;
  seen.add(absPath);
  const source = readFileSync(absPath, "utf8");
  // All declarations in this file (exported or not): alias targets for
  // `export { local as Public }` lists.
  const locals = new Map<string, RawSymbol>();
  const aliases: Array<{ from: string; as: string }> = [];
  for (const statement of splitStatements(source)) {
    const star = statement.match(REEXPORT_STAR_RE);
    if (star) {
      parseDtsFile(resolveModule(absPath, star[1]), out, seen);
      continue;
    }
    const named = statement.match(REEXPORT_NAMED_RE);
    if (named) {
      const wanted = parseNameList(named[1]);
      if (named[2]) {
        const nested = new Map<string, RawSymbol>();
        parseDtsFile(resolveModule(absPath, named[2]), nested, seen);
        for (const { from, as } of wanted) {
          const found = nested.get(from);
          if (found && !out.has(as)) out.set(as, aliased(found, as));
        }
      } else {
        aliases.push(...wanted);
      }
      continue;
    }
    const decl = statement.match(DECL_RE);
    if (decl) {
      addSymbol(statement, decl[1], decl[2], out);
      continue;
    }
    // Non-exported declaration: still an alias target (declare const x; export { x as Y }).
    const local = statement.match(LOCAL_DECL_RE);
    if (local) addSymbol(statement, local[1], local[2], locals);
  }
  for (const { from, as } of aliases) {
    if (out.has(as)) continue;
    const found = locals.get(from) ?? out.get(from);
    if (found) out.set(as, aliased(found, as));
  }
}

function bucketFor(symbol: RawSymbol): Bucket {
  if (symbol.kind === "function") return "Functions";
  if (symbol.kind === "class") return "Classes";
  if (symbol.kind === "interface") return "Interfaces";
  if (symbol.kind === "type" || symbol.kind === "enum") return "Types";
  // const: function-typed values (declare const f: (...) => ...) are functions.
  if (/^const\s+[\w$]+\s*:\s*\(/.test(symbol.text)) return "Functions";
  return "Constants";
}

function typesEntry(subpath: string): string {
  const target = pkg.exports[subpath];
  if (typeof target === "string") return join(pkgDir, target);
  const entry = target.types ?? target.import ?? target.default;
  if (!entry) throw new Error(`No types entry for export ${subpath}`);
  return join(pkgDir, entry);
}

function cleanSignature(text: string): string {
  let out = text.replace(/\/\/# sourceMappingURL=.*$/, "").trim();
  out = out
    .replace(/^export\s+declare\s+/, "")
    .replace(/^export\s+/, "")
    .replace(/;$/, "");
  if (out.length > MAX_SIGNATURE_CHARS)
    out = `${out.slice(0, MAX_SIGNATURE_CHARS).trimEnd()}\n// … truncated`;
  return out;
}

function collect(subpaths: string[]): Map<string, SymbolEntry[]> {
  const pages = new Map<string, Map<string, SymbolEntry>>();

  for (const subpath of subpaths) {
    if (SKIP.has(subpath)) continue;
    const page = SUBPATH_TO_PAGE[subpath];
    if (page === undefined)
      throw new Error(
        `Export ${subpath} has no page mapping. Add it to SUBPATH_TO_PAGE in scripts/sync-api.ts.`,
      );
    if (page.startsWith("(")) continue;
    if (!PAGES[page])
      throw new Error(
        `Page ${page} has no metadata. Add it to PAGES in scripts/sync-api.ts.`,
      );
    const entryFile = typesEntry(subpath);
    if (!existsSync(entryFile))
      throw new Error(`Cannot load declarations for ${subpath}`);

    if (!pages.has(page)) pages.set(page, new Map());
    const entries = pages.get(page)!;
    const distRel = relative(pkgDir, entryFile);
    const raw = new Map<string, RawSymbol>();
    parseDtsFile(entryFile, raw, new Set());

    for (const symbol of raw.values()) {
      const existing = entries.get(symbol.name);
      if (existing) {
        if (!existing.sources.includes(distRel)) existing.sources.push(distRel);
        continue;
      }
      entries.set(symbol.name, {
        name: symbol.name,
        bucket: bucketFor(symbol),
        signature: symbol.text,
        docs: symbol.docs,
        sources: [distRel],
      });
    }
  }

  return new Map(
    [...pages.entries()].map(([page, entries]) => [
      page,
      [...entries.values()],
    ]),
  );
}

const BUCKET_ORDER: Bucket[] = [
  "Functions",
  "Classes",
  "Interfaces",
  "Types",
  "Constants",
];

function renderPage(
  page: string,
  meta: PageMeta,
  subpath: string,
  symbols: SymbolEntry[],
): string {
  const lines: string[] = [
    "---",
    `title: ${meta.title}`,
    `description: ${meta.description}`,
    "---",
    "",
    `{/* Generated from astro-ascendant@${pkg.version}. Do not edit by hand. Run \`make sync-api\` to regenerate. */}`,
    "",
    `Import from \`astro-ascendant${subpath === "." ? "" : subpath.replace(/^\./, "")}\`:`,
    "",
    "```ts",
    `import * as ${meta.title} from "astro-ascendant${subpath === "." ? "" : subpath.replace(/^\./, "")}";`,
    "```",
    "",
  ];
  for (const bucket of BUCKET_ORDER) {
    const group = symbols
      .filter((s) => s.bucket === bucket)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (group.length === 0) continue;
    lines.push(`## ${bucket}`, "");
    for (const symbol of group) {
      lines.push(`### \`${symbol.name}\``, "");
      if (symbol.docs) lines.push(symbol.docs, "");
      lines.push("```ts", symbol.signature, "```", "");
    }
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

function firstSubpathFor(page: string): string {
  return (
    Object.keys(pkg.exports).find((s) => SUBPATH_TO_PAGE[s] === page) ?? "."
  );
}

const checkOnly = process.argv.includes("--check");
const pages = collect(Object.keys(pkg.exports));
const orderedPages = [...new Set([...Object.keys(PAGES), ...pages.keys()])];

const metaPath = join(apiDir, "meta.json");
const meta: { title: string; pages: string[] } = existsSync(metaPath)
  ? (JSON.parse(readFileSync(metaPath, "utf8")) as {
      title: string;
      pages: string[];
    })
  : { title: META_TITLE, pages: [] };
const desiredMeta =
  JSON.stringify(
    {
      title: META_TITLE,
      pages: orderedPages.filter((p) => pages.has(p) || meta.pages.includes(p)),
    },
    null,
    2,
  ) + "\n";

let dirty: string[] = [];
if (!existsSync(metaPath) || readFileSync(metaPath, "utf8") !== desiredMeta)
  dirty.push("meta.json");
for (const [page, symbols] of pages) {
  const outPath = join(apiDir, `${page}.mdx`);
  const content = renderPage(page, PAGES[page], firstSubpathFor(page), symbols);
  if (!existsSync(outPath) || readFileSync(outPath, "utf8") !== content)
    dirty.push(`${page}.mdx`);
}

console.log(
  `astro-ascendant ${pkg.version}: ${[...pages.values()].reduce((n, s) => n + s.length, 0)} symbols across ${pages.size} pages`,
);
for (const [page, symbols] of pages)
  console.log(`  ${page}: ${symbols.length} symbols`);

if (checkOnly) {
  if (dirty.length > 0) {
    console.log(
      `\nStale generated files: ${dirty.join(", ")}. Run \`make sync-api\`.`,
    );
    process.exit(1);
  }
  console.log("\nGenerated docs are up to date.");
} else {
  if (!existsSync(apiDir)) mkdirSync(apiDir, { recursive: true });
  writeFileSync(metaPath, desiredMeta);
  for (const [page, symbols] of pages)
    writeFileSync(
      join(apiDir, `${page}.mdx`),
      renderPage(page, PAGES[page], firstSubpathFor(page), symbols),
    );
  console.log(
    dirty.length > 0 ? `\nWrote: ${dirty.join(", ")}.` : "\nNo changes.",
  );
}
