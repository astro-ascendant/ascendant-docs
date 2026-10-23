import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { gitConfig } from "./shared";
import wordmark from "../../assets/wordmark.webp";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <img
          src={wordmark}
          alt="Ascendant"
          width={973}
          height={200}
          className="h-6 w-auto"
        />
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}`,
  };
}
