# CPA Sub2API Converter Skill

![visitors](https://count.getloli.com/get/@cpa-sub2api-converter-skill?theme=rule34)

A Codex skill for inspecting, validating, and converting token JSON formats locally.

## Features

- Convert between `cpa` and `sub2api`.
- Generate `codex`, `axonhub`, `codexmanager`, `cockpit`, `9router`, or `all` outputs.
- Preserve real `refresh_token`, `id_token`, and `session_token` fields when present.
- Inspect and validate files without printing token values.

## Usage

```bash
node scripts/convert.js --inspect --input account.json --pretty
node scripts/convert.js --validate --input account.json --pretty
node scripts/convert.js --format sub2api --input cpa.json --output sub2api.json --pretty
node scripts/convert.js --format cpa --input sub2api.json --output cpa.json --pretty
```

## Supported Formats

`sub2api`, `cpa`, `cockpit`, `9router`, `codex`, `axonhub`, `codexmanager`, `all`

CPA and sub2api conversion currently supports `codex`, `claude`, `antigravity`, and `gemini` account types.

## Safety

Token files are sensitive. Do not paste raw token values into chat, issues, logs, or screenshots.

## License

MIT
