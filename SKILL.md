---
name: gpttools-token-converter
description: Convert ChatGPT/Codex and multi-provider account token JSON among CPA, sub2api, Cockpit, 9router, Codex auth.json, AxonHub, Codex-Manager, ChatGPT web session, and all combined output formats using local bundled scripts. Use when Codex needs to inspect, validate, normalize, or convert CPA and sub2api files for Codex/OpenAI, Claude, Antigravity, or Gemini, preserve real refresh_token/id_token/session_token fields, generate importable token JSON, or safely handle token-bearing account files without exposing secrets in chat.
---

# GPTTools Token Converter

## Core Rules

- Treat every input and output as secret-bearing unless proven otherwise.
- Do not paste raw `access_token`, `refresh_token`, `id_token`, or `session_token` values into chat.
- Prefer reading token JSON from local files and writing converted JSON to local files.
- Use `scripts/convert.js --inspect` first when the task only asks whether conversion is possible or where fields will map.
- Use `scripts/convert.js --validate` when the task asks whether output is importable.
- Use the bundled script for actual conversion instead of rewriting converter logic.

## Quick Start

Inspect an input file without emitting token values:

```bash
node path/to/skill/scripts/convert.js --inspect --input input.json --pretty
```

Validate an input file without emitting token values:

```bash
node path/to/skill/scripts/convert.js --validate --input input.json --pretty
```

Convert CPA to sub2api and write the converted token-bearing file locally:

```bash
node path/to/skill/scripts/convert.js --format sub2api --input cpa.json --output sub2api.json --pretty
```

Convert sub2api to CPA:

```bash
node path/to/skill/scripts/convert.js --format cpa --input sub2api.json --output cpa.json --pretty
```

Generate every supported format:

```bash
node path/to/skill/scripts/convert.js --format all --input account.json --output converted-all.json --pretty
```

Convert to Codex auth.json, AxonHub, or Codex-Manager:

```bash
node path/to/skill/scripts/convert.js --format codex --input account.json --output auth.json --pretty
node path/to/skill/scripts/convert.js --format axonhub --input account.json --output axonhub-auth.json --pretty
node path/to/skill/scripts/convert.js --format codexmanager --input account.json --output codex-manager.json --pretty
```

## Supported Formats

- `sub2api`
- `cpa`
- `cockpit`
- `9router`
- `codex`
- `axonhub`
- `codexmanager`
- `all`

The converter accepts ChatGPT web session JSON, CPA single-account objects or arrays, sub2api export documents, sub2api account arrays, Cockpit account objects or arrays, 9router account objects or arrays, Codex auth.json, AxonHub auth.json, and Codex-Manager token objects.

CPA/sub2api conversions support provider types `codex`, `claude`, `antigravity`, and `gemini`. Cockpit, 9router, Codex auth.json, AxonHub, and Codex-Manager outputs are Codex/OpenAI-specific.

Read `references/formats.md` only when exact field mappings or preservation behavior are needed.

## Workflow

1. Identify whether the user wants inspection, conversion, or explanation.
2. For inspection, run `scripts/convert.js --inspect --input <file> --pretty` and report only account count, provider type, paths, email/name, expiry, and whether relevant fields exist.
3. For conversion, run `scripts/convert.js --format <target> --input <file> --output <file> --pretty`.
4. Verify conversion with `--inspect` and `--validate` on the output file when practical.
5. Report paths, counts, target format, and field-preservation facts. Do not report raw token values.

## Important Field Behavior

- CPA `refresh_token` becomes sub2api `accounts[].credentials.refresh_token`.
- CPA `id_token` becomes sub2api `accounts[].credentials.id_token`.
- CPA `session_token` becomes sub2api `accounts[].credentials.session_token`.
- sub2api `accounts[].credentials.refresh_token` becomes CPA top-level `refresh_token`.
- sub2api-specific fields such as `rate_multiplier`, `auto_pause_on_expired`, `status`, `schedulable`, `proxy_key`, `client_id`, `organization_id`, and `model_mapping` are preserved where possible.
- CPA-only round-trip metadata is stored under sub2api `extra.cpa`.
- sub2api-only round-trip metadata is stored under CPA `source_meta.sub2api`.
- If the input lacks a real `id_token` but contains enough account identity data, CPA output may contain a synthetic placeholder JWT and set `id_token_synthetic: true`. Treat it as compatibility metadata, not a real OAuth token.
- Codex auth.json output uses `auth_mode: "chatgpt"` and `tokens.access_token/refresh_token/id_token/account_id`.
- AxonHub output uses the same token object and writes `__missing_refresh_token__` only when no real refresh token exists.
- Codex-Manager output writes `tokens` plus `meta.label/workspace_id/chatgpt_account_id/note`.
- Claude maps CPA `access_token/id_token/refresh_token/email/expired` to sub2api `platform: "anthropic"`.
- Antigravity maps CPA `access_token/refresh_token/project_id/token_type/expires_in/plan_type` to sub2api `platform: "antigravity"`.
- Gemini maps CPA `token.access_token/token.refresh_token/token.scope/token.token_type/token.expiry` to sub2api `platform: "gemini"`.

## Validation

After changing bundled scripts or mappings, run:

```bash
node path/to/skill/scripts/convert.js --inspect --input path/to/sample.json --pretty
node path/to/skill/scripts/convert.js --validate --input path/to/sample.json --pretty
```

If the parent `gpttools-converter` project is available, also run its project tests:

```bash
node test-converter.js
node test-mcp.js
```
