#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const converter = require("./converter.js");

const FORMATS = new Set(["sub2api", "cpa", "cockpit", "9router", "codex", "axonhub", "codexmanager", "all"]);

function usage() {
  return [
    "Usage:",
    "  node scripts/convert.js --inspect [--input file] [--pretty]",
    "  node scripts/convert.js --validate [--format <auto|sub2api|cpa>] [--input file] [--pretty]",
    "  node scripts/convert.js --format <sub2api|cpa|cockpit|9router|codex|axonhub|codexmanager|all> [--input file] --output file [--pretty]",
    "  node scripts/convert.js --format <sub2api|cpa|cockpit|9router|codex|axonhub|codexmanager|all> [--input file] --stdout [--pretty]",
    "",
    "Input defaults to stdin. Conversion output must go to --output unless --stdout is explicit.",
  ].join("\n");
}

function parseArgs(argv) {
  const args = {
    format: "sub2api",
    formatProvided: false,
    input: "",
    output: "",
    pretty: false,
    inspect: false,
    validate: false,
    stdout: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--format" || item === "-f") {
      args.format = argv[++index];
      args.formatProvided = true;
    } else if (item === "--input" || item === "-i") {
      args.input = argv[++index];
    } else if (item === "--output" || item === "-o") {
      args.output = argv[++index];
    } else if (item === "--pretty") {
      args.pretty = true;
    } else if (item === "--inspect") {
      args.inspect = true;
    } else if (item === "--validate") {
      args.validate = true;
    } else if (item === "--stdout") {
      args.stdout = true;
    } else if (item === "--help" || item === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }

  return args;
}

function readInput(inputPath) {
  if (inputPath) {
    return fs.readFileSync(path.resolve(inputPath), "utf8");
  }
  return fs.readFileSync(0, "utf8");
}

function writeJson(value, pretty) {
  return `${JSON.stringify(value, null, pretty ? 2 : 0)}\n`;
}

function inspectText(text) {
  const sources = converter.parseInputDocuments(text);
  const result = converter.convertFromSources(sources);
  return {
    converted: result.converted.length,
    accounts: result.converted.map((item) => ({
      sourceName: item.sourceName,
      sourcePath: item.sourcePath,
      name: item.name,
      email: item.email,
      providerType: item.providerType,
      expiresAt: item.expiresAt,
      hasAccessToken: Boolean(item.cpa?.access_token || item.cpa?.token?.access_token),
      hasRefreshToken: Boolean(item.cpa?.refresh_token || item.cpa?.token?.refresh_token),
      hasIdToken: Boolean(item.cpa?.id_token || item.cpa?.token?.id_token),
      idTokenSynthetic: Boolean(item.cpa?.id_token_synthetic),
      hasSessionToken: Boolean(item.cpa?.session_token),
    })),
    skipped: result.skipped,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  if (!args.validate && !FORMATS.has(args.format)) {
    throw new Error(`Unsupported output format: ${args.format}`);
  }

  const text = readInput(args.input);
  if (args.inspect) {
    process.stdout.write(writeJson(inspectText(text), args.pretty));
    return;
  }
  if (args.validate) {
    const validationFormat = args.formatProvided && (args.format === "sub2api" || args.format === "cpa") ? args.format : "auto";
    process.stdout.write(writeJson(converter.validateText(text, validationFormat), args.pretty));
    return;
  }

  if (!args.output && !args.stdout) {
    throw new Error("Refusing to print token-bearing conversion output without --stdout. Use --output for normal conversions.");
  }

  const result = converter.convertText(text, args.format);
  const outputText = writeJson(result.output ?? null, args.pretty);

  if (args.output) {
    const outputPath = path.resolve(args.output);
    fs.writeFileSync(outputPath, outputText, "utf8");
    process.stdout.write(writeJson({
      format: args.format,
      converted: result.converted.length,
      skipped: result.skipped.length,
      output: outputPath,
    }, true));
    return;
  }

  process.stdout.write(outputText);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
