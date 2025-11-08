#!/usr/bin/env bash
# create_and_push.sh
# 一键在本地生成仓库初始文件、创建分支并 push，然后利用 gh 创建 PR。
# 前提：
#   - 已在本地克隆仓库 (git clone git@github.com:San-quan/museStarlinkpay71.git)
#   - 在仓库根目录运行本脚本
#   - 已安装 git, gh (可选但推荐), node (用于本地测试，可选)
#   - 已通过 `gh auth login` 登录，或在当前 shell 会话里导出 GITHUB_PAT（临时）
set -euo pipefail

REPO="San-quan/museStarlinkpay71"
BRANCH="chore/init-repo"

# ensure we are inside the repo
if [ ! -d .git ]; then
  echo "错误：当前目录不是 git 仓库。请先 git clone git@github.com:${REPO}.git 并在仓库根目录运行。"
  exit 1
fi

# create branch
git fetch origin main || true
git checkout -B "${BRANCH}"

# create directories
mkdir -p .github/workflows scripts src tests configs docs

# README
cat > README.md <<'MD'
# museStarlinkpay71

说明
- 描述: 完美适配星链。
- 目标: 为 Starlink + 海外带宽 的场景提供网络代理与自动化运维辅助工具（脚本、配置、监控小工具等）。

快速开始
1. 克隆仓库
   git clone git@github.com:San-quan/museStarlinkpay71.git
   cd museStarlinkpay71

2. 安装依赖
   npm ci

3. 运行开发检查
   npm run lint
   npm test

4. 本地运行（示例）
   node ./src/index.js

维护与贡献
- 提交前请运行 `npm run format && npm run lint && npm test`
- 新功能请基于 `main` 创建分支 `feature/<描述>` 并发起 PR

安全
- 不要在代码库中提交密钥或敏感凭证（.env、私钥等）。
- 若需要，请把敏感凭证配置到 GitHub Secrets。

联系
- 仓库所有者: San-quan
MD

# package.json
cat > package.json <<'JSON'
{
  "name": "museStarlinkpay71",
  "version": "0.1.0",
  "description": "完美适配星链。",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node ./src/index.js",
    "lint": "eslint \"src/**/*.{js,mjs}\" --max-warnings=0",
    "format": "prettier --write \"src/**/*.{js,mjs,json,md}\"",
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "prepare": "husky install"
  },
  "keywords": [
    "starlink",
    "network",
    "proxy",
    "automation"
  ],
  "author": "San-quan",
  "license": "MIT",
  "devDependencies": {
    "eslint": "^8.50.0",
    "eslint-config-standard": "^17.0.0",
    "eslint-plugin-import": "^2.30.0",
    "eslint-plugin-node": "^11.1.0",
    "eslint-plugin-promise": "^6.0.0",
    "prettier": "^2.8.8",
    "jest": "^29.7.0"
  },
  "engines": {
    "node": ">=18"
  }
}
JSON

# ESLint, Prettier, Jest
cat > .eslintrc.cjs <<'ESL'
module.exports = {
  env: {
    node: true,
    es2023: true,
    jest: true
  },
  extends: [
    "eslint:recommended",
    "standard"
  ],
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: "module"
  },
  rules: {
    "no-console": "off",
    "strict": ["error", "global"]
  }
};
ESL

cat > .prettierrc <<'PRET'
{
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "endOfLine": "lf"
}
PRET

cat > jest.config.cjs <<'JEST'
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/tests/**/*.spec.js']
};
JEST

cat > .gitignore <<'GITIGNORE'
/node_modules
/dist
/.env
/.cache
.DS_Store
coverage
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.pem
*.key
GITIGNORE

# src files
cat > src/index.js <<'JS'
'use strict';

/**
 * Entry point for museStarlinkpay71
 * This file provides a minimal example and export for unit tests.
 */

export function greet(name = 'world') {
  return `Hello, ${name}! This repo integrates with Starlink.`;
}

if (require.main === module) {
  // Demo run
  console.log(greet(process.env.USER || 'operator'));
}
JS

cat > src/utils.js <<'JS'
'use strict';

/**
 * Small network helper utilities (examples)
 */

export function isValidIPv4(ip) {
  if (typeof ip !== 'string') return false;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => {
    const n = Number(p);
    return Number.isInteger(n) && n >= 0 && n <= 255 && String(n) === p;
  });
}
JS

# tests
mkdir -p tests
cat > tests/utils.spec.js <<'TEST'
import { isValidIPv4 } from '../src/utils.js';

describe('isValidIPv4', () => {
  test('valid addresses', () => {
    expect(isValidIPv4('127.0.0.1')).toBe(true);
    expect(isValidIPv4('192.168.1.1')).toBe(true);
  });

  test('invalid addresses', () => {
    expect(isValidIPv4('256.1.1.1')).toBe(false);
    expect(isValidIPv4('abc')).toBe(false);
    expect(isValidIPv4('127.0.0')).toBe(false);
    expect(isValidIPv4('01.02.03.04')).toBe(false);
  });
});
TEST

# CI workflow
mkdir -p .github/workflows
cat > .github/workflows/ci.yml <<'YML'
name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Run tests
        run: npm test
YML

# placeholder scripts/configs/docs (full scripts can be added later)
cat > scripts/autoconfig_netcore_n60.sh <<'SH'
#!/bin/sh
echo "Autoconfig placeholder - see docs for full production script."
SH
chmod +x scripts/autoconfig_netcore_n60.sh

cat > scripts/main_router_setup.sh <<'SH'
#!/bin/sh
echo "Main router setup placeholder."
SH
chmod +x scripts/main_router_setup.sh

cat > scripts/netcore_setup.sh <<'SH'
#!/bin/sh
echo "Netcore setup placeholder."
SH
chmod +x scripts/netcore_setup.sh

cat > scripts/wg_server_setup.sh <<'SH'
#!/bin/sh
echo "WG server setup placeholder."
SH
chmod +x scripts/wg_server_setup.sh

cat > configs/xray_server_config.json <<'JSON'
{
  "inbounds": [
    {
      "port": 10000,
      "protocol": "vless",
      "settings": {
        "clients": [
          { "id": "REPLACE_WITH_UUID", "flow": "" }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "ws",
        "wsSettings": { "path": "/vless" }
      }
    }
  ],
  "outbounds": [
    { "protocol": "freedom", "settings": {} }
  ],
  "log": {
    "access": "/var/log/xray_access.log",
    "error": "/var/log/xray_error.log",
    "loglevel": "warning"
  }
}
JSON

cat > configs/cloudflare_worker.js <<'WORKER'
addEventListener('fetch', event => {
  event.respondWith(handle(event.request))
})

async function handle(request) {
  const url = new URL(request.url)
  if (url.pathname.startsWith('/vless')) {
    const backend = 'https://YOUR_VPS_DOMAIN_OR_ORIGIN:10000' + url.pathname + url.search
    const res = await fetch(backend, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual'
    })
    return res
  }
  return new Response('OK', { status: 200 })
}
WORKER

cat > docs/README_AUTOCONFIG.md <<'DOC'
# Netcore N60 PRO 自动化配置说明

See the full autoconfig script and usage in the repo docs. This file contains instructions for completing setup, placing public keys on VPS, configuring 5GHz SSID mapping and finalizing WireGuard peers.
DOC

cat > docs/SECRETS.md <<'SECR'
# Secrets and where to configure them

Add the following repository secrets in GitHub (Settings -> Secrets and variables -> Actions):
- VPS_SSH_PRIVATE_KEY: private key used by Actions to SSH to VPS
- VPS_HOST: VPS hostname or IP
- VPS_SSH_USER: user for SSH (e.g., root)
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID
- API_SERVER_TOKEN: token for the backend API

Do NOT commit any private keys or tokens to the repository. Use these secrets in workflows to deploy scripts and write tokens securely to the target hosts.
SECR

cat > LICENSE <<'LIC'
MIT License

Copyright (c) 2025 San-quan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
LIC

# Git add/commit/push
git add .
git commit -m "chore: initial scaffolding and CI" || true
git push -u origin "${BRANCH}"

# Create PR using gh if available
if command -v gh >/dev/null 2>&1; then
  echo "Creating PR via gh..."
  gh pr create --repo "${REPO}" --base main --head "${BRANCH}" --title "chore: initial scaffolding and CI" --body "Add CI, lint, tests, scripts and docs (initial import)."
  echo "PR created (check GitHub)."
else
  echo "gh CLI not found. Branch pushed. Please create a PR in GitHub web UI from ${BRANCH} to main."
fi

echo "Done. If CI runs, paste the Actions run URL here and I will inspect failures and guide fixes."