// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const DEFAULT_CHAT_UI_ORIGIN = "http://127.0.0.1:18789";
const DEFAULT_OPENCLAW_MODEL = "qwen-portal/coder-model";
const DEFAULT_MANAGED_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const DEFAULT_CONTEXT_WINDOW = 131072;
const DEFAULT_MAX_TOKENS = 8192;
const QWEN_CONTEXT_WINDOW = 128000;
const QWEN_BASE_URL = "https://portal.qwen.ai/v1";
const INFERENCE_ROUTE_URL = "https://inference.local/v1";

const CURATED_PROVIDER_SLOTS = [
  {
    id: "openai-codex",
    label: "OpenAI Codex",
    models: [{ ref: "openai-codex/gpt-5.4", alias: "codex" }],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    models: [
      { ref: "openrouter/nvidia/nemotron-3-super-120b-a12b:free" },
      { ref: "openrouter/minimax/minimax-m2.5:free" },
    ],
  },
  {
    id: "opencode",
    label: "OpenCode Zen",
    requestedId: "opencode-zen",
    models: [
      { ref: "opencode/big-pickle" },
      { ref: "opencode/mimo-v2-pro-free" },
      { ref: "opencode/mimo-v2-omni-free" },
      { ref: "opencode/nemotron-3-super-free" },
      { ref: "opencode/minimax-m2.5-free" },
    ],
  },
  {
    id: "nvidia",
    label: "NVIDIA",
    models: [],
  },
  {
    id: "qwen-portal",
    label: "Qwen",
    requestedId: "qwen",
    models: [
      { ref: "qwen-portal/coder-model", alias: "qwen" },
      { ref: "qwen-portal/vision-model", alias: "qwen-vision" },
    ],
  },
];

function buildModelDefinition({ id, name, input = ["text"], contextWindow, maxTokens }) {
  return {
    id,
    name,
    reasoning: false,
    input,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow,
    maxTokens,
  };
}

function resolveAllowedOrigins(chatUiUrl) {
  const origins = [DEFAULT_CHAT_UI_ORIGIN];
  if (chatUiUrl) {
    try {
      const parsed = new URL(chatUiUrl);
      origins.push(`${parsed.protocol}//${parsed.host}`);
    } catch {
      // Keep the local control UI origin only when CHAT_UI_URL is invalid.
    }
  }
  return Array.from(new Set(origins));
}

function buildDefaultModelAliases() {
  return Object.fromEntries(
    CURATED_PROVIDER_SLOTS.flatMap((provider) =>
      provider.models.map((model) => [
        model.ref,
        model.alias ? { alias: model.alias } : {},
      ]),
    ),
  );
}

function buildOpenClawConfig({ managedModel = DEFAULT_MANAGED_MODEL, chatUiUrl, authToken }) {
  const managedModelId = String(managedModel || DEFAULT_MANAGED_MODEL).trim() || DEFAULT_MANAGED_MODEL;

  return {
    agents: {
      defaults: {
        model: { primary: DEFAULT_OPENCLAW_MODEL },
        models: buildDefaultModelAliases(),
      },
    },
    models: {
      mode: "merge",
      providers: {
        nvidia: {
          baseUrl: INFERENCE_ROUTE_URL,
          apiKey: "openshell-managed",
          api: "openai-completions",
          models: [
            buildModelDefinition({
              id: managedModelId.split("/").pop(),
              name: managedModelId,
              contextWindow: DEFAULT_CONTEXT_WINDOW,
              maxTokens: 4096,
            }),
          ],
        },
        inference: {
          baseUrl: INFERENCE_ROUTE_URL,
          apiKey: "unused",
          api: "openai-completions",
          models: [
            buildModelDefinition({
              id: managedModelId,
              name: managedModelId,
              contextWindow: DEFAULT_CONTEXT_WINDOW,
              maxTokens: 4096,
            }),
          ],
        },
        "qwen-portal": {
          baseUrl: QWEN_BASE_URL,
          apiKey: "qwen-oauth",
          api: "openai-completions",
          models: [
            buildModelDefinition({
              id: "coder-model",
              name: "Qwen Code",
              contextWindow: QWEN_CONTEXT_WINDOW,
              maxTokens: DEFAULT_MAX_TOKENS,
            }),
            buildModelDefinition({
              id: "vision-model",
              name: "Qwen Vision",
              input: ["text", "image"],
              contextWindow: QWEN_CONTEXT_WINDOW,
              maxTokens: DEFAULT_MAX_TOKENS,
            }),
          ],
        },
      },
    },
    gateway: {
      mode: "local",
      controlUi: {
        allowInsecureAuth: true,
        dangerouslyDisableDeviceAuth: true,
        allowedOrigins: resolveAllowedOrigins(chatUiUrl),
      },
      trustedProxies: ["127.0.0.1", "::1"],
      auth: { token: authToken },
    },
  };
}

module.exports = {
  CURATED_PROVIDER_SLOTS,
  DEFAULT_CHAT_UI_ORIGIN,
  DEFAULT_MANAGED_MODEL,
  DEFAULT_OPENCLAW_MODEL,
  buildOpenClawConfig,
  resolveAllowedOrigins,
};
