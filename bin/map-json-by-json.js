#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { stdin, stdout, stderr } from "node:process";
import { mapJson, meta } from "../src/v2/index.js";

const usage = `map-json-by-json v${meta.version.replace(/^v/, "")}

Usage:
  map-json-by-json --template <file> --input <file|-> [--output <file>]

Options:
  -t, --template <file>  JSON mapping template
  -i, --input <file|->    Source JSON file, or - to read stdin
  -o, --output <file>     Write result to a file (default: stdout)
  -h, --help              Show this help
  -v, --version           Show the engine version
`;

const readStdin = async () => {
    const chunks = [];
    for await (const chunk of stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString("utf8");
};

const parseJson = (text, label) => {
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new Error(`${label} is not valid JSON: ${error.message}`);
    }
};

const parseArgs = (args) => {
    const options = {};
    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        if (arg === "--help" || arg === "-h") options.help = true;
        else if (arg === "--version" || arg === "-v") options.version = true;
        else if (["--template", "-t", "--input", "-i", "--output", "-o"].includes(arg)) {
            const value = args[index + 1];
            if (!value || (value.startsWith("-") && value !== "-")) {
                throw new Error(`Missing value for ${arg}`);
            }
            index += 1;
            if (arg === "--template" || arg === "-t") options.template = value;
            if (arg === "--input" || arg === "-i") options.input = value;
            if (arg === "--output" || arg === "-o") options.output = value;
        } else {
            throw new Error(`Unknown option: ${arg}`);
        }
    }
    return options;
};

try {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        stdout.write(usage);
    } else if (options.version) {
        stdout.write(`${meta.version}\n`);
    } else {
        if (!options.template || !options.input) {
            throw new Error("Both --template and --input are required. Use --help for usage.");
        }

        const templateText = await readFile(options.template, "utf8");
        const sourceText = options.input === "-"
            ? await readStdin()
            : await readFile(options.input, "utf8");
        const template = parseJson(templateText, "Template");
        const source = parseJson(sourceText, "Input");
        const result = mapJson(template, source);
        if (result === undefined) {
            throw new Error("Mapping returned no value; check that template and input are objects or arrays");
        }
        const outputText = `${JSON.stringify(result, null, 2)}\n`;

        if (options.output) await writeFile(options.output, outputText, "utf8");
        else stdout.write(outputText);
    }
} catch (error) {
    stderr.write(`map-json-by-json: ${error.message}\n`);
    process.exitCode = 1;
}
