import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const docsRoot = fileURLToPath(new URL("./docs/", import.meta.url));
const htmlPages = [
  "index.html",
  "usage.html",
  "api.html",
  "cli.html",
  "endpoint.html",
  "browser.html",
  "examples.html",
  "v3.html"
];

export default defineConfig({
  root: docsRoot,
  base: "./",
  build: {
    outDir: "dist/v2",
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(htmlPages.map((page) => [
        page.replace(/\.html$/, ""),
        resolve(docsRoot, page)
      ]))
    }
  }
});
