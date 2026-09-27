import { createServer } from "node:http";
import { mapJson } from "map-json-by-json";

const port = Number(process.env.PORT ?? 3000);
const maxBodyBytes = 1_048_576;

const sendJson = (response, statusCode, value) => {
    response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
    response.end(`${JSON.stringify(value)}\n`);
};

const readJsonBody = async (request) => {
    const chunks = [];
    let size = 0;

    for await (const chunk of request) {
        size += chunk.length;
        if (size > maxBodyBytes) {
            const error = new Error("Request body is too large");
            error.statusCode = 413;
            throw error;
        }
        chunks.push(chunk);
    }

    try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
        const error = new Error("Request body must be valid JSON");
        error.statusCode = 400;
        throw error;
    }
};

const server = createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/map") {
        sendJson(response, 404, { error: "Route not found" });
        return;
    }

    if (!request.headers["content-type"]?.includes("application/json")) {
        sendJson(response, 415, { error: "Content-Type must be application/json" });
        return;
    }

    try {
        const { template, source } = await readJsonBody(request);
        if (template === undefined || source === undefined) {
            sendJson(response, 400, { error: "Both template and source are required" });
            return;
        }
        const result = mapJson(template, source);
        if (result === undefined) {
            sendJson(response, 400, { error: "Template and source must be objects or arrays" });
            return;
        }
        sendJson(response, 200, { result });
    } catch (error) {
        sendJson(response, error.statusCode ?? 400, { error: error.message });
    }
});

server.listen(port, () => {
    process.stdout.write(`map-json-by-json example listening on http://localhost:${port}\n`);
});
