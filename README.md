# CPA Sub2API Converter Skill

![visitors](https://count.getloli.com/get/@cpa-sub2api-converter-skill?theme=rule34)

一个用于本地检查、验证和转换 token JSON 格式的 Codex Skill。

## 功能

- 支持 `cpa` 和 `sub2api` 互转。
- 支持生成 `codex`、`axonhub`、`codexmanager`、`cockpit`、`9router` 或 `all` 格式。
- 输入中存在真实 `refresh_token`、`id_token`、`session_token` 时会尽量保留。
- 支持在不打印 token 明文的情况下检查和验证文件。

## 使用方式

```bash
node scripts/convert.js --inspect --input account.json --pretty
node scripts/convert.js --validate --input account.json --pretty
node scripts/convert.js --format sub2api --input cpa.json --output sub2api.json --pretty
node scripts/convert.js --format cpa --input sub2api.json --output cpa.json --pretty
```

## 支持格式

`sub2api`, `cpa`, `cockpit`, `9router`, `codex`, `axonhub`, `codexmanager`, `all`

CPA 和 sub2api 互转当前支持 `codex`、`claude`、`antigravity`、`gemini` 账号类型。

## 安全提醒

Token 文件属于敏感数据。不要把原始 token 内容粘贴到聊天、Issue、日志或截图中。

## English

A Codex skill for inspecting, validating, and converting token JSON formats locally.

- Convert between `cpa` and `sub2api`.
- Generate `codex`, `axonhub`, `codexmanager`, `cockpit`, `9router`, or `all` outputs.
- Preserve real `refresh_token`, `id_token`, and `session_token` fields when present.
- Inspect and validate files without printing token values.

CPA and sub2api conversion currently supports `codex`, `claude`, `antigravity`, and `gemini` account types.

Token files are sensitive. Do not paste raw token values into chat, issues, logs, or screenshots.

## 许可证 / License

MIT
