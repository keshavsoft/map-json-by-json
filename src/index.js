import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 1. Discover all version directories (v1, v2, ... vN) sorted highest first
const versionFolders = readdirSync(__dirname, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^v\d+$/.test(entry.name))
    .map(entry => ({ name: entry.name, n: Number(entry.name.slice(1)) }))
    .sort((a, b) => b.n - a.n);

const latestVersion = versionFolders[0]?.name || "v1";

const moduleUrl = pathToFileURL(resolve(__dirname, latestVersion, "index.js")).href;
const latestModule = await import(moduleUrl);

export const mapJson = latestModule.mapJson;
export const meta = latestModule.meta;
export default latestModule.default ?? latestModule.mapJson;
