import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { extname, resolve, sep } from "node:path";

const docsRoot = resolve(fileURLToPath(new URL("../docs/", import.meta.url)));
const v2Root = resolve(fileURLToPath(new URL("../src/v2/", import.meta.url)));
const port = Number(process.env.PORT ?? 4173);
const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8"
};

const server = createServer(async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { allow: "GET, HEAD" }).end();
        return;
    }

    try {
        const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
        const useV2Source = pathname.startsWith("/src/v2/");
        const basePath = useV2Source ? v2Root : docsRoot;
        const relativePath = useV2Source
            ? pathname.slice("/src/v2/".length)
            : pathname === "/" ? "index.html" : pathname.slice(1);
        const filePath = resolve(basePath, relativePath);
        if (filePath !== basePath && !filePath.startsWith(`${basePath}${sep}`)) {
            response.writeHead(403).end("Forbidden");
            return;
        }

        const fileStat = await stat(filePath);
        if (!fileStat.isFile()) {
            response.writeHead(404).end("Not found");
            return;
        }

        response.writeHead(200, {
            "content-type": contentTypes[extname(filePath)] ?? "application/octet-stream",
            "content-length": fileStat.size
        });
        if (request.method === "HEAD") response.end();
        else response.end(await readFile(filePath));
    } catch {
        response.writeHead(404).end("Not found");
    }
});

server.listen(port, "127.0.0.1", () => {
    process.stdout.write(`Docs available at http://127.0.0.1:${port}/?local=1\n`);
});
