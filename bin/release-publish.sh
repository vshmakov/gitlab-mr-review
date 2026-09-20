#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VERSION="${npm_package_version:-$(node -p "require('./package.json').version")}"
VSIX_FILE="$ROOT_DIR/gitlab-mr-review-${VERSION}.vsix"

command -v git >/dev/null
command -v gh >/dev/null

if [[ ! -f "$VSIX_FILE" ]]; then
	printf 'Release artifact not found: %s\nRun npm run release:create first.\n' "$VSIX_FILE" >&2
	exit 1
fi

git push origin HEAD:master
git push origin "v${VERSION}"
gh release create "v${VERSION}" "$VSIX_FILE" \
	--title "GitLab MR Review v${VERSION}" \
	--generate-notes