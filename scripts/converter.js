(function attachConverter(root) {
  "use strict";

  const exampleSession = {
    user: {
      id: "user-example",
      email: "mark@example.com",
    },
    expires: "2026-08-06T14:29:36.155Z",
    account: {
      id: "00000000-0000-4000-9000-000000000000",
      planType: "plus",
    },
    accessToken: "paste-real-access-token-here",
    sessionToken: "paste-real-session-token-here",
    authProvider: "openai",
  };

  const exampleCpa = {
    type: "codex",
    account_id: "00000000-0000-4000-9000-000000000000",
    chatgpt_account_id: "00000000-0000-4000-9000-000000000000",
    email: "mark@example.com",
    name: "mark@example.com",
    plan_type: "plus",
    chatgpt_plan_type: "plus",
    id_token: "paste-real-id-token-here",
    access_token: "paste-real-access-token-here",
    refresh_token: "",
    session_token: "paste-real-session-token-here",
    last_refresh: "2026-08-06T14:29:36.155Z",
    expired: "2026-08-06T14:29:36.155Z",
  };

  const exampleSub2api = {
    exported_at: "2026-08-06T14:29:36.155Z",
    proxies: [],
    accounts: [
      {
        name: "mark@example.com",
        platform: "openai",
        type: "oauth",
        concurrency: 10,
        priority: 1,
        credentials: {
          access_token: "paste-real-access-token-here",
          refresh_token: "paste-real-refresh-token-here",
          id_token: "paste-real-id-token-here",
          session_token: "paste-real-session-token-here",
          chatgpt_account_id: "00000000-0000-4000-9000-000000000000",
          chatgpt_user_id: "user-example",
          client_id: "paste-client-id-here",
          email: "mark@example.com",
          expires_at: "2026-08-06T14:29:36.155Z",
          expires_in: 3600,
          organization_id: "org-example",
          plan_type: "plus",
          model_mapping: {},
        },
        extra: {
          email: "mark@example.com",
          email_key: "mark_example_com",
          name: "mark@example.com",
          auth_provider: "openai",
          source: "chatgpt_web_session",
          last_refresh: "2026-08-06T14:29:36.155Z",
        },
      },
    ],
  };

  const exampleCockpit = {
    type: "codex",
    id_token: "paste-real-id-token-here",
    access_token: "paste-real-access-token-here",
    refresh_token: "",
    account_id: "00000000-0000-4000-9000-000000000000",
    last_refresh: "2026-08-06T14:29:36.155Z",
    email: "mark@example.com",
    expired: "2026-08-06T14:29:36.155Z",
    account_note: "mark@example.com",
  };

  const exampleNineRouter = {
    accessToken: "paste-real-access-token-here",
    refreshToken: "paste-real-refresh-token-here",
    expiresAt: "2026-08-06T14:29:36.155Z",
    testStatus: "active",
    expiresIn: 3600,
    providerSpecificData: {
      chatgptAccountId: "00000000-0000-4000-9000-000000000000",
      chatgptPlanType: "plus",
    },
    id: "00000000-0000-4000-9000-000000000000",
    provider: "codex",
    authType: "oauth",
    name: "mark@example.com",
    email: "mark@example.com",
    priority: 9,
    isActive: true,
    createdAt: "2026-08-06T14:29:36.155Z",
    updatedAt: "2026-08-06T14:29:36.155Z",
  };

  const DEFAULT_OPENAI_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
  const AXONHUB_MISSING_REFRESH_TOKEN = "__missing_refresh_token__";
  const DEFAULT_MODEL_MAPPING = {
    "gpt-5.4": "gpt-5.4",
    "gpt-5.4-mini": "gpt-5.4-mini",
  };

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function firstNonEmpty(...values) {
    for (const value of values) {
      if (typeof value === "string" && value.trim() !== "") {
        return value.trim();
      }
    }
    return undefined;
  }

  function decodeBase64Url(value) {
    const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = typeof atob === "function"
      ? atob(padded)
      : Buffer.from(padded, "base64").toString("binary");
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function bytesToBase64Url(bytes) {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    const base64 = typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(binary, "binary").toString("base64");
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function encodeBase64UrlJson(value) {
    return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
  }

  function parseJwtPayload(token) {
    if (typeof token !== "string" || token.trim() === "") {
      return undefined;
    }
    const segments = token.split(".");
    if (segments.length < 2) {
      return undefined;
    }
    try {
      return JSON.parse(decodeBase64Url(segments[1]));
    } catch {
      return undefined;
    }
  }

  function getOpenAIAuthSection(payload) {
    if (!isPlainObject(payload)) {
      return {};
    }
    const auth = payload["https://api.openai.com/auth"];
    return isPlainObject(auth) ? auth : {};
  }

  function getOpenAIProfileSection(payload) {
    if (!isPlainObject(payload)) {
      return {};
    }
    const profile = payload["https://api.openai.com/profile"];
    return isPlainObject(profile) ? profile : {};
  }

  function normalizeTimestamp(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      const milliseconds = value > 1e11 ? value : value * 1000;
      const date = new Date(milliseconds);
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
    }

    if (typeof value !== "string" || value.trim() === "") {
      return undefined;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  function timestampFromUnixSeconds(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return undefined;
    }
    const date = new Date(numeric * 1000);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  function epochSecondsFromValue(value) {
    if (value === undefined || value === null || value === "") {
      return 0;
    }

    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return Math.trunc(numeric > 1e11 ? numeric / 1000 : numeric);
    }

    const parsed = Date.parse(String(value));
    return Number.isFinite(parsed) ? Math.trunc(parsed / 1000) : 0;
  }

  function getExpiresIn(expiresAt, now = new Date()) {
    if (!expiresAt) {
      return undefined;
    }
    const expiresMs = new Date(expiresAt).getTime();
    if (Number.isNaN(expiresMs)) {
      return undefined;
    }
    return Math.max(0, Math.floor((expiresMs - now.getTime()) / 1000));
  }

  function timestampFromExpiresIn(value, now = new Date()) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return undefined;
    }
    return new Date(now.getTime() + Math.max(0, numeric) * 1000).toISOString();
  }

  function numberOrDefault(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function firstBoolean(...values) {
    for (const value of values) {
      if (typeof value === "boolean") {
        return value;
      }
    }
    return undefined;
  }

  function firstNumber(...values) {
    for (const value of values) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
    return undefined;
  }

  function firstObject(...values) {
    for (const value of values) {
      if (isPlainObject(value)) {
        return value;
      }
    }
    return undefined;
  }

  function toFiniteNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  function normalizeUnixSecondsString(value) {
    const normalized = normalizeTimestamp(value);
    if (!normalized) {
      return undefined;
    }
    return String(Math.floor(new Date(normalized).getTime() / 1000));
  }

  function joinScopes(value) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
    if (Array.isArray(value)) {
      const normalized = value
        .filter((item) => typeof item === "string" && item.trim() !== "")
        .map((item) => item.trim());
      return normalized.length ? normalized.join(" ") : undefined;
    }
    return undefined;
  }

  function normalizeProviderType(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "openai" || normalized === "codex" || normalized === "chatgpt") {
      return "codex";
    }
    if (normalized === "anthropic" || normalized === "claude") {
      return "claude";
    }
    if (normalized === "antigravity") {
      return "antigravity";
    }
    if (normalized === "gemini" || normalized === "google") {
      return "gemini";
    }
    return "";
  }

  function sub2apiPlatformForProvider(providerType) {
    if (providerType === "codex") {
      return "openai";
    }
    if (providerType === "claude") {
      return "anthropic";
    }
    return providerType;
  }

  function getProviderType(record, inputSourceType) {
    if (inputSourceType === "sub2api") {
      return normalizeProviderType(record.platform);
    }
    if (inputSourceType === "9router" || inputSourceType === "codex_auth" || inputSourceType === "axonhub" || inputSourceType === "codex_manager") {
      return "codex";
    }
    return normalizeProviderType(record.type) || "codex";
  }

  function detectSourceType(record) {
    if (record.auth_mode === "chatgpt" && isPlainObject(record.tokens)) {
      return record.axonhub_refresh_token_placeholder !== undefined ? "axonhub" : "codex_auth";
    }
    if (isPlainObject(record.tokens) && isPlainObject(record.meta)) {
      return "codex_manager";
    }
    if (record.provider === "codex" && record.authType === "oauth") {
      return "9router";
    }
    if (record.platform && record.type === "oauth" && isPlainObject(record.credentials)) {
      return "sub2api";
    }
    if (record.type === "codex" && record.access_token && record.account_id && !record.chatgpt_account_id) {
      return "cockpit";
    }
    if (record.type === "codex" || record.access_token || record.id_token) {
      return "cpa";
    }
    return "chatgpt_web_session";
  }

  function buildSyntheticCodexIdToken(email, accountId, planType, userId, expiresAt, issuedAt = new Date()) {
    if (!accountId) {
      return undefined;
    }

    const now = Math.trunc(issuedAt.getTime() / 1000);
    const expires = epochSecondsFromValue(expiresAt) || now + 90 * 24 * 60 * 60;
    const authInfo = {
      chatgpt_account_id: accountId,
    };

    if (planType) {
      authInfo.chatgpt_plan_type = planType;
    }
    if (userId) {
      authInfo.chatgpt_user_id = userId;
      authInfo.user_id = userId;
    }

    const payload = {
      iat: now,
      exp: expires,
      "https://api.openai.com/auth": authInfo,
    };
    if (email) {
      payload.email = email;
    }

    return [
      encodeBase64UrlJson({ alg: "none", typ: "JWT", cpa_synthetic: true }),
      encodeBase64UrlJson(payload),
      "synthetic",
    ].join(".");
  }

  function toEmailKey(email) {
    if (typeof email !== "string") {
      return undefined;
    }
    return email
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function stripUnavailable(value) {
    if (Array.isArray(value)) {
      return value.map(stripUnavailable).filter((item) => item !== undefined);
    }

    if (isPlainObject(value)) {
      const entries = Object.entries(value)
        .map(([key, item]) => [key, stripUnavailable(item)])
        .filter(([, item]) => item !== undefined);
      return entries.length ? Object.fromEntries(entries) : undefined;
    }

    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    return value;
  }

  function collectSessionLikeObjects(value, sourceName = "pasted-json") {
    const found = [];
    const visited = new WeakSet();

    function visit(item, path, context = {}) {
      if (!isPlainObject(item) && !Array.isArray(item)) {
        return;
      }

      if (isPlainObject(item)) {
        if (visited.has(item)) {
          return;
        }
        visited.add(item);

        const token = firstNonEmpty(
          item.accessToken,
          item.access_token,
          item.tokens?.accessToken,
          item.tokens?.access_token,
          item.token?.accessToken,
          item.token?.access_token,
          item.credentials?.accessToken,
          item.credentials?.access_token,
        );
        const hasIdentity = isPlainObject(item.user) || firstNonEmpty(
          item.account_id,
          item.chatgpt_account_id,
          item.email,
          item.name,
          item.extra?.email,
          item.extra?.name,
          item.credentials?.email,
          item.credentials?.chatgpt_account_id,
          item.credentials?.chatgpt_user_id,
          item.tokens?.account_id,
          item.tokens?.chatgpt_account_id,
          item.meta?.label,
          item.meta?.chatgpt_account_id,
          item.providerSpecificData?.chatgptAccountId,
          item.providerSpecificData?.chatgpt_account_id,
          item.id,
          item.provider === "codex" && item.authType === "oauth" ? item.id : undefined,
        );

        if (token && hasIdentity) {
          found.push({ value: item, sourceName, path, context });
          return;
        }

        const nextContext = Array.isArray(item.accounts)
          ? {
              ...context,
              sub2apiDocument: {
                exported_at: item.exported_at,
                proxies: item.proxies,
              },
            }
          : context;
        Object.entries(item).forEach(([key, child]) => {
          if (key === "accessToken" || key === "access_token" || key === "sessionToken" || key === "tokens") {
            return;
          }
          visit(child, `${path}.${key}`, key === "accounts" ? nextContext : context);
        });
        return;
      }

      item.forEach((child, index) => visit(child, `${path}[${index}]`, context));
    }

    visit(value, "$");
    return found;
  }

  function parseInputDocuments(text) {
    if (typeof text !== "string" || text.trim() === "") {
      return [];
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new Error(`JSON 解析失败：${error.message}`);
    }

    return collectSessionLikeObjects(parsed);
  }

  function convertSession(record, options = {}) {
    if (!isPlainObject(record)) {
      throw new Error("session 不是 JSON 对象");
    }

    const accessToken = firstNonEmpty(
      record.accessToken,
      record.access_token,
      record.tokens?.accessToken,
      record.tokens?.access_token,
      record.token?.accessToken,
      record.token?.access_token,
      record.credentials?.accessToken,
      record.credentials?.access_token,
    );
    if (!accessToken) {
      throw new Error("缺少 accessToken");
    }

    const sessionToken = firstNonEmpty(
      record.sessionToken,
      record.session_token,
      record.tokens?.sessionToken,
      record.tokens?.session_token,
      record.token?.sessionToken,
      record.token?.session_token,
      record.credentials?.sessionToken,
      record.credentials?.session_token,
      record.extra?.cpa?.session_token,
    );
    const refreshToken = firstNonEmpty(
      record.refreshToken,
      record.refresh_token,
      record.tokens?.refreshToken,
      record.tokens?.refresh_token,
      record.token?.refreshToken,
      record.token?.refresh_token,
      record.credentials?.refreshToken,
      record.credentials?.refresh_token,
      record.extra?.cpa?.refresh_token,
    );
    const inputIdToken = firstNonEmpty(
      record.idToken,
      record.id_token,
      record.tokens?.idToken,
      record.tokens?.id_token,
      record.token?.idToken,
      record.token?.id_token,
      record.credentials?.idToken,
      record.credentials?.id_token,
      record.extra?.cpa?.id_token,
    );

    const payload = parseJwtPayload(accessToken);
    const idPayload = parseJwtPayload(inputIdToken);
    const auth = getOpenAIAuthSection(payload);
    const idAuth = getOpenAIAuthSection(idPayload);
    const profile = getOpenAIProfileSection(payload);
    const now = options.now || new Date();
    const inputSourceType = detectSourceType(record);
    const providerType = getProviderType(record, inputSourceType);
    const explicitExpiresAt = firstNonEmpty(
      normalizeTimestamp(record.expires),
      normalizeTimestamp(record.expiresAt),
      normalizeTimestamp(record.expired),
      normalizeTimestamp(record.expires_at),
      normalizeTimestamp(record.tokens?.expires_at),
      normalizeTimestamp(record.tokens?.expired),
      normalizeTimestamp(record.token?.expiry),
      normalizeTimestamp(record.token?.expires_at),
      normalizeTimestamp(record.token?.expiration),
      normalizeTimestamp(record.credentials?.expires_at),
      normalizeTimestamp(record.credentials?.expiresAt),
      normalizeTimestamp(record.credentials?.expired),
      timestampFromExpiresIn(record.credentials?.expires_in, now),
      normalizeTimestamp(record.providerSpecificData?.expiresAt),
      normalizeTimestamp(record.providerSpecificData?.expires_at),
    );
    const jwtExpiresAt = payload ? timestampFromUnixSeconds(payload.exp) : undefined;
    const expiresAt = inputSourceType === "chatgpt_web_session"
      ? firstNonEmpty(jwtExpiresAt, explicitExpiresAt)
      : firstNonEmpty(explicitExpiresAt, jwtExpiresAt);
    const email = firstNonEmpty(
      record.user?.email,
      record.email,
      record.meta?.label,
      record.credentials?.email,
      record.credentials?.email_address,
      record.extra?.email,
      record.providerSpecificData?.email,
      profile.email,
      idPayload?.email,
      payload?.email,
    );
    const accountId = firstNonEmpty(
      record.account?.id,
      record.account_id,
      record.tokens?.accountId,
      record.tokens?.account_id,
      record.chatgptAccountId,
      record.chatgpt_account_id,
      record.meta?.chatgptAccountId,
      record.meta?.chatgpt_account_id,
      record.tokens?.chatgptAccountId,
      record.tokens?.chatgpt_account_id,
      record.providerSpecificData?.chatgptAccountId,
      record.providerSpecificData?.chatgpt_account_id,
      record.credentials?.chatgpt_account_id,
      record.extra?.chatgpt_account_id,
      auth.chatgpt_account_id,
      idAuth.chatgpt_account_id,
      record.provider === "codex" ? record.id : undefined,
    );
    const workspaceId = firstNonEmpty(
      record.account?.workspaceId,
      record.account?.workspace_id,
      record.workspaceId,
      record.workspace_id,
      record.meta?.workspaceId,
      record.meta?.workspace_id,
      record.providerSpecificData?.workspaceId,
      record.providerSpecificData?.workspace_id,
      record.credentials?.workspace_id,
      payload?.workspace_id,
      idPayload?.workspace_id,
    );
    const userId = firstNonEmpty(
      record.user?.id,
      record.user_id,
      record.tokens?.userId,
      record.tokens?.user_id,
      record.chatgptUserId,
      record.providerSpecificData?.chatgptUserId,
      record.providerSpecificData?.chatgpt_user_id,
      record.credentials?.chatgpt_user_id,
      record.credentials?.user_id,
      record.extra?.chatgpt_user_id,
      record.extra?.user_id,
      record.providerSpecificData?.userId,
      record.providerSpecificData?.user_id,
      auth.chatgpt_user_id,
      auth.user_id,
      idAuth.chatgpt_user_id,
      idAuth.user_id,
    );
    const planType = firstNonEmpty(
      record.account?.planType,
      record.account?.plan_type,
      record.planType,
      record.plan_type,
      record.tokens?.planType,
      record.tokens?.plan_type,
      record.providerSpecificData?.chatgptPlanType,
      record.providerSpecificData?.chatgpt_plan_type,
      record.credentials?.plan_type,
      record.extra?.plan_type,
      record.chatgpt_plan_type,
      record.providerSpecificData?.chatgptPlanType,
      record.providerSpecificData?.chatgpt_plan_type,
      auth.chatgpt_plan_type,
      idAuth.chatgpt_plan_type,
    );
    const organizationId = firstNonEmpty(
      record.organizationId,
      record.organization_id,
      record.tokens?.organizationId,
      record.tokens?.organization_id,
      record.credentials?.organization_id,
      record.extra?.organization_id,
      auth.organization_id,
      idAuth.organization_id,
      Array.isArray(auth.organizations) && isPlainObject(auth.organizations[0])
        ? auth.organizations[0].id
        : undefined,
      Array.isArray(idAuth.organizations) && isPlainObject(idAuth.organizations[0])
        ? idAuth.organizations[0].id
        : undefined,
    );
    const clientId = firstNonEmpty(
      record.clientId,
      record.client_id,
      record.tokens?.clientId,
      record.tokens?.client_id,
      record.credentials?.client_id,
      record.extra?.client_id,
      payload?.client_id,
      payload?.azp,
      idPayload?.client_id,
      idPayload?.azp,
    );
    const modelMapping = firstObject(
      record.credentials?.model_mapping,
      record.model_mapping,
      record.tokens?.model_mapping,
      record.source_meta?.sub2api?.model_mapping,
    );
    const exportedAt = normalizeTimestamp(now);
    const sourceDocument = options.sourceDocument || {};
    const sourceDocumentExportedAt = normalizeTimestamp(sourceDocument.exported_at);
    const sourceLastRefresh = firstNonEmpty(
      normalizeTimestamp(record.last_refresh),
      normalizeTimestamp(record.lastRefresh),
      normalizeTimestamp(record.tokens?.last_refresh),
      normalizeTimestamp(record.meta?.last_refresh),
      normalizeTimestamp(record.extra?.last_refresh),
      normalizeTimestamp(record.extra?.lastRefresh),
      normalizeTimestamp(record.extra?.cpa?.last_refresh),
      normalizeTimestamp(record.source_meta?.cpa?.last_refresh),
      sourceDocumentExportedAt,
    );
    const expiresIn = getExpiresIn(expiresAt, now);
    const sourceName = firstNonEmpty(options.sourceName, "pasted-json");
    const sourceType = firstNonEmpty(record.extra?.source, inputSourceType);
    const name = firstNonEmpty(record.name, record.meta?.label, record.extra?.name, email, sourceName, "ChatGPT Account");
    const syntheticIdToken = inputIdToken
      ? undefined
      : buildSyntheticCodexIdToken(email, accountId, planType, userId, expiresAt, now);
    const idToken = firstNonEmpty(inputIdToken, syntheticIdToken);
    const disabled = firstBoolean(
      record.disabled,
      record.extra?.cpa?.disabled,
      typeof record.isActive === "boolean" ? !record.isActive : undefined,
    );
    const sub2apiMeta = record.source_meta?.sub2api || {};
    const sub2apiConcurrency = numberOrDefault(sub2apiMeta.concurrency, numberOrDefault(record.concurrency, 10));
    const sub2apiPriority = numberOrDefault(sub2apiMeta.priority, numberOrDefault(record.priority, 1));
    const sub2apiRateMultiplier = firstNumber(sub2apiMeta.rate_multiplier, record.rate_multiplier, 1);
    const sub2apiAutoPauseOnExpired = firstBoolean(sub2apiMeta.auto_pause_on_expired, record.auto_pause_on_expired, true);
    const sourceMeta = stripUnavailable({
      input_format: inputSourceType,
      sub2api: inputSourceType === "sub2api" ? {
        concurrency: record.concurrency,
        priority: record.priority,
        rate_multiplier: record.rate_multiplier,
        auto_pause_on_expired: record.auto_pause_on_expired,
        status: record.status,
        schedulable: record.schedulable,
        proxy_key: record.proxy_key,
        exported_at: sourceDocumentExportedAt,
        proxies: sourceDocument.proxies,
        client_id: record.credentials?.client_id,
        organization_id: record.credentials?.organization_id,
        model_mapping: record.credentials?.model_mapping,
        email_key: record.extra?.email_key,
        extra: record.extra,
      } : record.source_meta?.sub2api,
      cpa: {
        id_token: inputIdToken,
        refresh_token: refreshToken,
        session_token: sessionToken,
        last_refresh: sourceLastRefresh,
        disabled,
      },
    });

    if (providerType !== "codex") {
      const tokenObject = isPlainObject(record.token) ? record.token : {};
      const projectId = firstNonEmpty(record.project_id, record.credentials?.project_id, tokenObject.project_id);
      const tokenType = firstNonEmpty(record.token_type, record.credentials?.token_type, tokenObject.token_type, tokenObject.tokenType);
      const scope = firstNonEmpty(record.scope, record.credentials?.scope, joinScopes(tokenObject.scope), joinScopes(tokenObject.scopes));
      const providerExpiresIn = firstNumber(record.expires_in, record.credentials?.expires_in, tokenObject.expires_in, expiresIn);
      const providerExtra = stripUnavailable({
        email,
        email_key: toEmailKey(email),
        name,
        source: sourceType,
        last_refresh: sourceLastRefresh || exportedAt,
        auto: typeof record.auto === "boolean" ? record.auto : record.extra?.auto,
        checked: typeof record.checked === "boolean" ? record.checked : record.extra?.checked,
      });
      const providerCredentials = stripUnavailable(providerType === "claude" ? {
        access_token: accessToken,
        email_address: email,
        expires_at: normalizeUnixSecondsString(expiresAt),
        id_token: inputIdToken,
        refresh_token: refreshToken,
      } : providerType === "antigravity" ? {
        access_token: accessToken,
        email,
        expires_at: normalizeUnixSecondsString(expiresAt),
        expires_in: providerExpiresIn,
        project_id: projectId,
        refresh_token: refreshToken,
        token_type: tokenType,
        plan_type: planType,
      } : {
        access_token: accessToken,
        expires_at: normalizeUnixSecondsString(expiresAt),
        oauth_type: projectId ? "code_assist" : undefined,
        project_id: projectId,
        refresh_token: refreshToken,
        scope,
        token_type: tokenType,
      });
      const providerCpa = stripUnavailable(providerType === "gemini" ? {
        type: "gemini",
        checked: typeof record.checked === "boolean" ? record.checked : record.extra?.checked,
        auto: typeof record.auto === "boolean" ? record.auto : record.extra?.auto,
        email,
        last_refresh: sourceLastRefresh || exportedAt,
        project_id: projectId,
        token: {
          access_token: accessToken,
          expiry: expiresAt,
          refresh_token: refreshToken,
          scope,
          token_type: tokenType,
        },
        source_meta: sourceMeta?.sub2api ? sourceMeta : undefined,
      } : {
        type: providerType,
        access_token: accessToken,
        email,
        name,
        expired: expiresAt,
        id_token: providerType === "claude" ? inputIdToken : undefined,
        expires_in: providerType === "antigravity" ? providerExpiresIn : undefined,
        last_refresh: sourceLastRefresh || exportedAt,
        plan_type: providerType === "antigravity" ? planType : undefined,
        project_id: providerType === "antigravity" ? projectId : undefined,
        refresh_token: refreshToken,
        token_type: providerType === "antigravity" ? tokenType : undefined,
        source_meta: sourceMeta?.sub2api ? sourceMeta : undefined,
      });
      const providerSub2apiAccount = stripUnavailable({
        name: firstNonEmpty(name, email, sourceName, `${providerType} Account`),
        platform: sub2apiPlatformForProvider(providerType),
        type: "oauth",
        expires_at: epochSecondsFromValue(expiresAt) || undefined,
        concurrency: sub2apiConcurrency,
        priority: sub2apiPriority,
        rate_multiplier: sub2apiRateMultiplier,
        auto_pause_on_expired: sub2apiAutoPauseOnExpired,
        status: firstNonEmpty(sub2apiMeta.status, record.status),
        schedulable: firstBoolean(sub2apiMeta.schedulable, record.schedulable),
        proxy_key: firstNonEmpty(sub2apiMeta.proxy_key, record.proxy_key),
        credentials: providerCredentials,
        extra: providerExtra,
      });

      return {
        sourceName,
        sourcePath: options.sourcePath,
        email,
        name,
        expiresAt,
        providerType,
        cpa: providerCpa,
        cockpit: undefined,
        nineRouter: undefined,
        codexAuthJson: undefined,
        axonHub: undefined,
        codexManager: undefined,
        sourceMeta,
        sub2apiAccount: providerSub2apiAccount,
      };
    }

    const cpa = Object.fromEntries(Object.entries({
      type: "codex",
      account_id: accountId,
      chatgpt_account_id: accountId,
      email,
      name,
      plan_type: planType,
      chatgpt_plan_type: planType,
      id_token: idToken,
      id_token_synthetic: Boolean(syntheticIdToken) || undefined,
      access_token: accessToken,
      refresh_token: refreshToken || "",
      session_token: sessionToken,
      last_refresh: sourceLastRefresh || exportedAt,
      expired: expiresAt,
      disabled: disabled || undefined,
      source_meta: sourceMeta?.sub2api ? sourceMeta : undefined,
    }).filter(([, value]) => value !== undefined && value !== null));

    const sub2apiAccount = stripUnavailable({
      name: firstNonEmpty(name, email, sourceName, "ChatGPT Account"),
      platform: "openai",
      type: "oauth",
      expires_at: epochSecondsFromValue(expiresAt) || undefined,
      concurrency: sub2apiConcurrency,
      priority: sub2apiPriority,
      rate_multiplier: sub2apiRateMultiplier,
      auto_pause_on_expired: sub2apiAutoPauseOnExpired,
      status: firstNonEmpty(sub2apiMeta.status, record.status),
      schedulable: firstBoolean(sub2apiMeta.schedulable, record.schedulable),
      proxy_key: firstNonEmpty(sub2apiMeta.proxy_key, record.proxy_key),
      credentials: {
        access_token: accessToken,
        refresh_token: refreshToken,
        id_token: inputIdToken,
        session_token: sessionToken,
        chatgpt_account_id: accountId,
        chatgpt_user_id: userId,
        client_id: clientId || sub2apiMeta.client_id || DEFAULT_OPENAI_CLIENT_ID,
        email,
        expires_at: expiresAt,
        expires_in: expiresIn,
        organization_id: organizationId || sub2apiMeta.organization_id,
        plan_type: planType,
        model_mapping: modelMapping || sub2apiMeta.model_mapping || DEFAULT_MODEL_MAPPING,
      },
      extra: {
        email,
        email_key: toEmailKey(email),
        name,
        auth_provider: firstNonEmpty(record.authProvider, record.auth_provider, record.extra?.auth_provider),
        source: sourceType,
        last_refresh: sourceLastRefresh || exportedAt,
        cpa: {
          id_token: inputIdToken,
          refresh_token: refreshToken,
          session_token: sessionToken,
          last_refresh: sourceLastRefresh,
          disabled,
        },
      },
    });
    const cockpit = Object.fromEntries(Object.entries({
      type: "codex",
      id_token: idToken,
      access_token: accessToken,
      refresh_token: refreshToken || "",
      account_id: accountId,
      last_refresh: sourceLastRefresh || exportedAt,
      email,
      expired: expiresAt,
      account_note: firstNonEmpty(record.account_note, record.accountInfo, record.account_info, record.note, record.notes, record.remark, name),
      source_meta: sourceMeta?.sub2api || sourceMeta?.cpa ? sourceMeta : undefined,
    }).filter(([, value]) => value !== undefined && value !== null));
    const nineRouterPriority = numberOrDefault(record.priority, 9);
    const isActive = typeof record.isActive === "boolean" ? record.isActive : !disabled;
    const createdAt = normalizeTimestamp(record.createdAt) || exportedAt;
    const updatedAt = normalizeTimestamp(record.updatedAt) || exportedAt;
    const nineRouter = stripUnavailable({
      accessToken,
      refreshToken,
      expiresAt,
      testStatus: firstNonEmpty(record.testStatus, record.test_status, "active"),
      expiresIn,
      providerSpecificData: {
        chatgptAccountId: accountId,
        chatgptPlanType: planType,
      },
      id: accountId,
      provider: "codex",
      authType: "oauth",
      name,
      email,
      priority: nineRouterPriority,
      isActive,
      createdAt,
      updatedAt,
      sourceMeta,
    });
    const codexAuthJson = {
      auth_mode: "chatgpt",
      OPENAI_API_KEY: null,
      tokens: {
        id_token: idToken || "",
        access_token: accessToken,
        refresh_token: refreshToken || "",
        account_id: accountId || "",
      },
      last_refresh: sourceLastRefresh || exportedAt,
    };
    const axonHubRefreshToken = refreshToken || AXONHUB_MISSING_REFRESH_TOKEN;
    const axonHub = stripUnavailable({
      auth_mode: "chatgpt",
      last_refresh: sourceLastRefresh || exportedAt,
      tokens: {
        access_token: accessToken,
        refresh_token: axonHubRefreshToken,
        id_token: idToken,
      },
      axonhub_refresh_token_placeholder: refreshToken ? undefined : true,
      axonhub_note: refreshToken ? undefined : "refresh_token is a placeholder; access_token works only until it expires.",
    });
    const codexManager = stripUnavailable({
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken || "",
        id_token: inputIdToken || "",
        account_id: accountId,
        chatgpt_account_id: accountId,
      },
      meta: {
        label: firstNonEmpty(name, email, sourceName, "ChatGPT Account"),
        workspace_id: workspaceId,
        chatgpt_account_id: accountId,
        note: firstNonEmpty(record.meta?.note, "Imported from GPTTools converter"),
      },
    });

    return {
      sourceName,
      sourcePath: options.sourcePath,
      email,
      name,
      expiresAt,
      providerType,
      cpa,
      cockpit,
      nineRouter,
      codexAuthJson,
      axonHub,
      codexManager,
      sourceMeta,
      sub2apiAccount,
    };
  }

  function buildSub2apiDocument(converted, now = new Date()) {
    const sourceSub2apiMeta = converted.find((item) => item.sourceMeta?.sub2api)?.sourceMeta?.sub2api;
    return {
      exported_at: normalizeTimestamp(sourceSub2apiMeta?.exported_at) || normalizeTimestamp(now),
      proxies: Array.isArray(sourceSub2apiMeta?.proxies) ? sourceSub2apiMeta.proxies : [],
      accounts: converted.map((item) => item.sub2apiAccount),
    };
  }

  function singleOrArray(converted, key) {
    const values = converted
      .map((item) => item[key])
      .filter((item) => item !== undefined && item !== null);
    return values.length === 1 ? values[0] : values;
  }

  function buildOutputDocument(converted, format, now = new Date()) {
    if (format === "cpa") {
      return singleOrArray(converted, "cpa");
    }
    if (format === "cockpit") {
      return singleOrArray(converted, "cockpit");
    }
    if (format === "9router") {
      return singleOrArray(converted, "nineRouter");
    }
    if (format === "codex") {
      return singleOrArray(converted, "codexAuthJson");
    }
    if (format === "axonhub") {
      return singleOrArray(converted, "axonHub");
    }
    if (format === "codexmanager") {
      return singleOrArray(converted, "codexManager");
    }
    if (format === "all") {
      return {
        sub2api: buildSub2apiDocument(converted, now),
        cpa: singleOrArray(converted, "cpa"),
        cockpit: singleOrArray(converted, "cockpit"),
        "9router": singleOrArray(converted, "nineRouter"),
        codex: singleOrArray(converted, "codexAuthJson"),
        axonhub: singleOrArray(converted, "axonHub"),
        codexmanager: singleOrArray(converted, "codexManager"),
      };
    }
    return buildSub2apiDocument(converted, now);
  }

  function convertFromSources(sources, options = {}) {
    const converted = [];
    const skipped = [];
    const now = options.now || new Date();

    sources.forEach((item, index) => {
      try {
        converted.push(convertSession(item.value, {
          now,
          sourceName: item.sourceName,
          sourcePath: item.path || `$[${index}]`,
          sourceDocument: item.context?.sub2apiDocument,
        }));
      } catch (error) {
        skipped.push({
          sourceName: item.sourceName,
          path: item.path,
          reason: error instanceof Error ? error.message : "无法转换",
        });
      }
    });

    if (!sources.length) {
      skipped.push({
        sourceName: "pasted-json",
        path: "$",
        reason: "未找到包含 accessToken 和 user/email 的 session 对象",
      });
    }

    return { converted, skipped, sources };
  }

  function convertText(text, format = "sub2api", options = {}) {
    const sources = parseInputDocuments(text);
    const result = convertFromSources(sources, options);
    const output = result.converted.length
      ? buildOutputDocument(result.converted, format, options.now || new Date())
      : undefined;
    return { ...result, output };
  }

  function validateSub2apiDocument(document) {
    const errors = [];
    const warnings = [];
    const accounts = Array.isArray(document?.accounts)
      ? document.accounts
      : isPlainObject(document) && document.platform && isPlainObject(document.credentials)
        ? [document]
        : [];

    if (!isPlainObject(document) && !Array.isArray(document)) {
      errors.push("sub2api 顶层必须是对象或账号数组");
    }
    if (!accounts.length) {
      errors.push("accounts 不能为空");
    }

    accounts.forEach((account, index) => {
      const prefix = `accounts[${index}]`;
      if (!isPlainObject(account)) {
        errors.push(`${prefix} 必须是对象`);
        return;
      }
      const providerType = normalizeProviderType(account.platform);
      if (!providerType) {
        errors.push(`${prefix}.platform 不支持：${account.platform || "(空)"}`);
      }
      if (account.type !== "oauth") {
        errors.push(`${prefix}.type 应为 oauth`);
      }
      if (!isPlainObject(account.credentials)) {
        errors.push(`${prefix}.credentials 必须是对象`);
        return;
      }
      const credentials = account.credentials;
      if (!firstNonEmpty(credentials.access_token)) {
        errors.push(`${prefix}.credentials.access_token 缺失`);
      }
      if (!firstNonEmpty(credentials.refresh_token)) {
        warnings.push(`${prefix}.credentials.refresh_token 缺失，access_token 过期后通常不能自动刷新`);
      }
      if (providerType === "codex") {
        if (!firstNonEmpty(credentials.client_id)) {
          warnings.push(`${prefix}.credentials.client_id 缺失`);
        }
        if (!isPlainObject(credentials.model_mapping) || !Object.keys(credentials.model_mapping).length) {
          warnings.push(`${prefix}.credentials.model_mapping 缺失或为空`);
        }
        if (!firstNonEmpty(credentials.chatgpt_account_id)) {
          warnings.push(`${prefix}.credentials.chatgpt_account_id 缺失`);
        }
      }
      if (!credentials.expires_at && !credentials.expires_in && !account.expires_at) {
        warnings.push(`${prefix}.credentials.expires_at/expires_in 缺失`);
      }
    });

    const recommended = errors.length === 0 && warnings.length === 0;
    return {
      format: "sub2api",
      ok: errors.length === 0,
      recommended,
      status: recommended ? "可导入" : errors.length ? "不建议导入" : "可导入但不完整",
      count: accounts.length,
      errors,
      warnings,
    };
  }

  function validateCpaDocument(document) {
    const errors = [];
    const warnings = [];
    const records = Array.isArray(document) ? document : [document];

    if (!records.length || !records.every(isPlainObject)) {
      errors.push("CPA 顶层必须是对象或对象数组");
    }

    records.filter(isPlainObject).forEach((record, index) => {
      const prefix = records.length > 1 ? `[${index}]` : "$";
      const providerType = normalizeProviderType(record.type || "codex");
      if (!providerType) {
        errors.push(`${prefix}.type 不支持：${record.type || "(空)"}`);
      }
      const tokenObject = isPlainObject(record.token) ? record.token : {};
      const tokensObject = isPlainObject(record.tokens) ? record.tokens : {};
      const accessToken = firstNonEmpty(record.access_token, tokenObject.access_token, tokenObject.accessToken, tokensObject.access_token, tokensObject.accessToken);
      const refreshToken = firstNonEmpty(record.refresh_token, tokenObject.refresh_token, tokenObject.refreshToken, tokensObject.refresh_token, tokensObject.refreshToken);
      if (!accessToken) {
        errors.push(`${prefix}.access_token 缺失`);
      }
      if (!refreshToken) {
        warnings.push(`${prefix}.refresh_token 缺失，access_token 过期后通常不能自动刷新`);
      }
      if (providerType === "codex") {
        if (!firstNonEmpty(record.account_id, record.chatgpt_account_id, tokensObject.account_id, tokensObject.chatgpt_account_id)) {
          warnings.push(`${prefix}.account_id/chatgpt_account_id 缺失`);
        }
        if (!firstNonEmpty(record.id_token, tokensObject.id_token, tokensObject.idToken)) {
          warnings.push(`${prefix}.id_token 缺失`);
        }
        if (record.id_token_synthetic) {
          warnings.push(`${prefix}.id_token 是 synthetic，占位用途，不是真实 OAuth id_token`);
        }
      }
      if (providerType === "gemini" && !isPlainObject(record.token)) {
        errors.push(`${prefix}.token 必须是 Gemini token 对象`);
      }
      if (!normalizeTimestamp(record.expired) && !normalizeTimestamp(tokenObject.expiry) && !normalizeTimestamp(tokensObject.expired)) {
        warnings.push(`${prefix}.expired 缺失或不可解析`);
      }
    });

    const recommended = errors.length === 0 && warnings.length === 0;
    return {
      format: "cpa",
      ok: errors.length === 0,
      recommended,
      status: recommended ? "可导入" : errors.length ? "不建议导入" : "可导入但不完整",
      count: records.filter(isPlainObject).length,
      errors,
      warnings,
    };
  }

  function validateText(text, format = "auto") {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      return {
        format,
        ok: false,
        recommended: false,
        status: "不建议导入",
        count: 0,
        errors: [`JSON 解析失败：${error.message}`],
        warnings: [],
      };
    }

    const inferredFormat = format === "auto"
      ? (isPlainObject(parsed) && (Array.isArray(parsed.accounts) || parsed.platform))
        || (Array.isArray(parsed) && parsed.some((item) => isPlainObject(item) && item.platform && isPlainObject(item.credentials)))
        ? "sub2api"
        : "cpa"
      : format;
    if (inferredFormat === "sub2api") {
      return validateSub2apiDocument(parsed);
    }
    if (inferredFormat === "cpa") {
      return validateCpaDocument(parsed);
    }
    const converted = convertText(text, inferredFormat);
    return validateText(JSON.stringify(converted.output ?? null), inferredFormat === "sub2api" ? "sub2api" : "cpa");
  }

  const api = {
    buildOutputDocument,
    buildSub2apiDocument,
    collectSessionLikeObjects,
    convertFromSources,
    convertSession,
    convertText,
    exampleCpa,
    exampleCockpit,
    exampleNineRouter,
    exampleSession,
    exampleSub2api,
    normalizeTimestamp,
    parseInputDocuments,
    parseJwtPayload,
    validateCpaDocument,
    validateSub2apiDocument,
    validateText,
  };

  root.GptSessionConverter = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
