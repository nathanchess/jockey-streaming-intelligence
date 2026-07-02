/**
 * Export README image assets from @twelvelabs-io/react (TwelveLabsLogoMark).
 * Run after `npm install` in app/: node ../scripts/export-readme-assets.mjs
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const appNodeModules = join(root, "app", "node_modules");
const require = createRequire(import.meta.url);

const React = require(join(appNodeModules, "react"));
const { renderToStaticMarkup } = require(join(appNodeModules, "react-dom/server"));
const { TwelveLabsLogoMark } = require(join(appNodeModules, "@twelvelabs-io/react"));

const markup = renderToStaticMarkup(
  React.createElement(TwelveLabsLogoMark, {
    className: "text-[#282C33]",
    style: { color: "#282C33", width: 80, height: "auto" },
  }),
);

const svg = markup
  .replace('fill="currentColor"', 'fill="#282C33"')
  .replace('width="51"', 'width="80"')
  .replace('height="36"', 'height="56"');

const outDir = join(root, "docs", "readme");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "twelvelabs-logo-mark.svg");
writeFileSync(outPath, `${svg}\n`, "utf8");
console.log(`Wrote ${outPath} from @twelvelabs-io/react TwelveLabsLogoMark`);
