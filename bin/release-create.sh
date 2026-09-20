#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

npm run check
rm -f "$ROOT_DIR"/gitlab-mr-review-*.vsix
npx --no-install vsce package --no-dependencies
