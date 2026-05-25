# Format Mapping Reference

Load this reference only when a task requires exact field mapping details.

## Input Discovery

The converter recursively scans JSON for objects containing an access token and identity fields. It recognizes:

- `accessToken`
- `access_token`
- `token.accessToken`
- `token.access_token`
- `tokens.accessToken`
- `tokens.access_token`
- `credentials.accessToken`
- `credentials.access_token`

Identity can come from object fields or decoded JWT claims.

## CPA

CPA output uses a single account object or an array of account objects. Supported `type` values are `codex`, `claude`, `antigravity`, and `gemini`.

Important fields:

- `type: "codex"`
- `access_token`
- `refresh_token`
- `id_token`
- `id_token_synthetic`
- `session_token`
- `account_id`
- `chatgpt_account_id`
- `chatgpt_plan_type` / `plan_type`
- `email`
- `expired`
- `last_refresh`
- `source_meta`

## sub2api

sub2api output uses:

```json
{
  "exported_at": "ISO timestamp",
  "proxies": [],
  "accounts": []
}
```

Each account has `type: "oauth"`, routing metadata, `credentials`, and `extra`. Supported `platform` values include `openai`, `anthropic`, `antigravity`, and `gemini`.

Important credential paths:

- `accounts[].credentials.access_token`
- `accounts[].credentials.refresh_token`
- `accounts[].credentials.id_token`
- `accounts[].credentials.session_token`
- `accounts[].credentials.chatgpt_account_id`
- `accounts[].credentials.chatgpt_user_id`
- `accounts[].credentials.email`
- `accounts[].credentials.expires_at`
- `accounts[].credentials.plan_type`
- `accounts[].credentials.client_id`
- `accounts[].credentials.organization_id`
- `accounts[].credentials.model_mapping`

## CPA to sub2api

- CPA `access_token` maps to `credentials.access_token`.
- CPA `refresh_token` maps to `credentials.refresh_token`.
- CPA `id_token` maps to `credentials.id_token`.
- CPA `session_token` maps to `credentials.session_token`.
- CPA account and plan metadata map into `credentials` where sub2api expects them.
- CPA-only metadata is copied to `extra.cpa` for round trips.
- `type: "claude"` maps to `platform: "anthropic"` and stores `email_address`.
- `type: "antigravity"` maps `project_id`, `token_type`, `expires_in`, and `plan_type`.
- `type: "gemini"` maps nested `token.access_token`, `token.refresh_token`, `token.scope`, `token.token_type`, and `token.expiry`.

## sub2api to CPA

- `credentials.access_token` maps to CPA `access_token`.
- `credentials.refresh_token` maps to CPA `refresh_token`.
- `credentials.id_token` maps to CPA `id_token`.
- `credentials.session_token` maps to CPA `session_token`.
- sub2api routing and provider-specific fields are copied to `source_meta.sub2api` for round trips.
- If sub2api input does not include `credentials.id_token`, CPA output can include a synthetic compatibility JWT with `id_token_synthetic: true`.
- `platform: "anthropic"` or `"claude"` maps back to CPA `type: "claude"`.
- `platform: "antigravity"` maps back to CPA `type: "antigravity"`.
- `platform: "gemini"` maps back to CPA `type: "gemini"` with a nested `token` object.

## Codex-Specific Outputs

- `codex` outputs native Codex auth.json with `auth_mode: "chatgpt"`, `OPENAI_API_KEY: null`, `tokens.id_token`, `tokens.access_token`, `tokens.refresh_token`, `tokens.account_id`, and `last_refresh`.
- `axonhub` outputs AxonHub auth.json. If no real refresh token is present, it writes `__missing_refresh_token__` and flags `axonhub_refresh_token_placeholder: true`.
- `codexmanager` outputs a Codex-Manager object with `tokens` plus `meta.label`, `meta.workspace_id`, `meta.chatgpt_account_id`, and `meta.note`.

These outputs are only meaningful for Codex/OpenAI accounts.

## Validation

Use:

```bash
node scripts/convert.js --validate --input input.json --pretty
```

Validation reports `ok`, `recommended`, `status`, `count`, `errors`, and `warnings`. Missing `access_token` is an error. Missing `refresh_token`, missing Codex `client_id/model_mapping`, and synthetic `id_token` are warnings because they may still import but can fail later or lose refreshability.

## Safety Reporting

When reporting results, provide only:

- Account count
- Source and output file paths
- Field paths
- Field presence
- Type
- Length
- Equality checks
- Expiry timestamps
- `id_token_synthetic` status

Do not report raw token values.
