import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { createServerFn } from "@tanstack/react-start";
import { slugsToMarkdownPath, source } from "@/lib/source";
import browserCollections from "collections/browser";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { baseOptions } from "@/lib/layout.shared";
import { gitConfig, skillsGitConfig } from "@/lib/shared";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import { Suspense } from "react";
import { useMDXComponents } from "@/components/mdx";

/** Serialized server loader payload; `meta` is sourced from MDX frontmatter. */
interface DocsLoaderData {
  path: string;
  markdownUrl: string;
  pageTree: Awaited<ReturnType<typeof source.serializePageTree>>;
  meta: {
    title: string;
    description: string | undefined;
  };
}

export const Route = createFileRoute("/docs/$")({
  component: Page,
  head: ({ loaderData }: { loaderData?: DocsLoaderData }) => {
    const { title, description } = loaderData?.meta ?? {};

    return {
      meta: [
        title ? { title: `${title} - Ascendant` } : undefined,
        description ? { name: "description", content: description } : undefined,
        title ? { property: "og:title", content: `${title} - Ascendant` } : undefined,
        description ? { property: "og:description", content: description } : undefined,
      ].filter((tag) => tag !== undefined),
    };
  },
  loader: async ({ params }) => {
    const slugs = params._splat?.split("/") ?? [];
    const data = await serverLoader({ data: slugs });
    await clientLoader.preload(data.path);
    return data;
  },
});

const serverLoader = createServerFn({
  method: "GET",
})
  .validator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    return {
      path: page.path,
      markdownUrl: slugsToMarkdownPath(page.slugs).url,
      pageTree: await source.serializePageTree(source.getPageTree()),
      meta: {
        title: page.data.title,
        description: page.data.description,
      },
    };
  });

const clientLoader = browserCollections.docs.createClientLoader({
  component(
    { toc, frontmatter, default: MDX },
    // you can define props for the component
    {
      markdownUrl,
      path,
    }: {
      markdownUrl: string;
      path: string;
    },
  ) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <div className="flex flex-row gap-2 items-center border-b -mt-4 pb-6">
          <MarkdownCopyButton markdownUrl={markdownUrl} />
          <ViewOptionsPopover markdownUrl={markdownUrl} githubUrl={getGitHubUrl(path)} />
        </div>
        <DocsBody>
          <MDX components={useMDXComponents()} />
        </DocsBody>
      </DocsPage>
    );
  },
});

function getGitHubUrl(path: string) {
  const skill = /^skills\/([^/]+)\.md$/.exec(path)?.[1];
  const repositoryUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;
  const revisionUrl = `${repositoryUrl}/blob/${gitConfig.branch}`;

  if (skill) {
    const skillsRepositoryUrl = `https://github.com/${skillsGitConfig.user}/${skillsGitConfig.repo}`;
    return `${skillsRepositoryUrl}/blob/${skillsGitConfig.branch}/skills/${skill}/SKILL.md`;
  }
  return `${revisionUrl}/content/${path}`;
}

function Page() {
  const { path, pageTree, markdownUrl } = useFumadocsLoader(Route.useLoaderData());

  return (
    <DocsLayout {...baseOptions()} tree={pageTree}>
      <Suspense>{clientLoader.useContent(path, { markdownUrl, path })}</Suspense>
    </DocsLayout>
  );
}
