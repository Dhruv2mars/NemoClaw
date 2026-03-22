// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  CURATED_PROVIDER_SLOTS,
  DEFAULT_OPENCLAW_MODEL,
  buildOpenClawConfig,
} = require("../bin/lib/openclaw-config");

describe("OpenClaw sandbox config", () => {
  it("tracks the curated provider slots for the sandbox catalog", () => {
    assert.deepEqual(
      CURATED_PROVIDER_SLOTS.map((provider) => provider.id),
      ["openai-codex", "openrouter", "opencode", "nvidia", "qwen-portal"],
    );
  });

  it("defaults the sandbox to the Qwen code model", () => {
    assert.equal(DEFAULT_OPENCLAW_MODEL, "qwen-portal/coder-model");
  });

  it("builds the sandbox OpenClaw config with curated models and managed inference", () => {
    const config = buildOpenClawConfig({
      managedModel: "nvidia/nemotron-3-super-120b-a12b",
      chatUiUrl: "https://chat.example.com/ui",
      authToken: "test-token",
    });

    assert.equal(config.agents.defaults.model.primary, "qwen-portal/coder-model");
    assert.deepEqual(
      Object.keys(config.agents.defaults.models).sort(),
      [
        "qwen-portal/coder-model",
        "qwen-portal/vision-model",
        "openai-codex/gpt-5.4",
      ].sort(),
    );
    assert.equal(config.agents.defaults.models["qwen-portal/coder-model"].alias, "qwen");
    assert.equal(config.agents.defaults.models["openai-codex/gpt-5.4"].alias, "codex");

    assert.deepEqual(config.models.providers["qwen-portal"].models.map((model) => model.id), [
      "coder-model",
      "vision-model",
    ]);
    assert.equal(config.models.providers.inference.models[0].id, "nvidia/nemotron-3-super-120b-a12b");
    assert.equal(
      config.models.providers.nvidia.models[0].id,
      "nemotron-3-super-120b-a12b",
    );

    assert.deepEqual(config.gateway.controlUi.allowedOrigins, [
      "http://127.0.0.1:18789",
      "https://chat.example.com",
    ]);
    assert.equal(config.gateway.auth.token, "test-token");
  });
});
