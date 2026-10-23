import { pageSchema } from "fumadocs-core/source/schema";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { basename, dirname, extname } from "node:path";

function titleFromPath(path: string): string {
  const filename = basename(path, extname(path));
  const source =
    filename.toLowerCase() === "skill" ? basename(dirname(path)) : filename;

  return source
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export const docs = defineDocs({
  dir: "content",
  docs: {
    schema: ({ path }) =>
      pageSchema.extend({
        title: pageSchema.shape.title.default(titleFromPath(path)),
      }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

export default defineConfig();
