#!/usr/bin/env node
// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const { buildOpenClawConfig } = require("../bin/lib/openclaw-config");

const outputPath = process.argv[2] || path.join(process.env.HOME || "/sandbox", ".openclaw", "openclaw.json");
const config = buildOpenClawConfig({
  managedModel: process.env.NEMOCLAW_MODEL,
  chatUiUrl: process.env.CHAT_UI_URL,
  authToken: process.env.NEMOCLAW_AUTH_TOKEN || randomBytes(32).toString("hex"),
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
