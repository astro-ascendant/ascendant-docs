import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { gitConfig } from "./shared";
import wordmark from "../../assets/wordmark.webp";

const npmLogo = (
  <svg aria-label="npm" role="img" viewBox="0 0 2500 2500">
    <path fill="#c00" d="M0 0h2500v2500H0z" />
    <path fill="#fff" d="M1241.5 268.5h-973v1962.9h972.9V763.5h495v1467.9h495V268.5z" />
  </svg>
);

const pypiLogo = (
  <img
    alt="PyPI"
    width="24"
    height="24"
    src="https://pypi.org/static/images/logo-small.0e0855d0.svg"
  />
);

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <img src={wordmark} alt="Ascendant" height={24} className="h-6 w-auto" />,
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      {
        type: "icon",
        text: "npm",
        url: "https://npmx.dev/package/astro-ascendant",
        icon: npmLogo,
      },
      {
        type: "icon",
        text: "PyPI",
        url: "https://pypi.org/project/astro-ascendant/",
        icon: pypiLogo,
      },
    ],
  };
}
