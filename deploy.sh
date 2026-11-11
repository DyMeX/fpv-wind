#!/bin/bash
# Copy the static app to a web server with rsync.
#   DEPLOY_TARGET   required, rsync destination, e.g. user@example.com:/var/www/fpv-wind/
#   RSYNC_OPTS      optional extra rsync options without spaces inside a single option, e.g. "--chmod=D755,F644"
#                   (for a custom ssh command use the RSYNC_RSH environment variable, e.g. RSYNC_RSH="ssh -p 2222")
#   DRY_RUN=1       optional, show what would be transferred
# The remote directory is mirrored: files not present in ./app are deleted there (--delete).
set -euo pipefail
: "${DEPLOY_TARGET:?set DEPLOY_TARGET, e.g. user@example.com:/var/www/fpv-wind/}"
D=$(cd "$(dirname "$0")" && pwd)

# syntax check (when node is available)
if command -v node >/dev/null 2>&1; then
  for f in app.js sw.js config.js; do node --check "$D/app/$f"; done
fi

# the ?v= value in index.html and the service worker precache list must match
v_html=$(grep -o 'app\.js?v=[0-9A-Za-z.]*' "$D/app/index.html" | head -1 | cut -d= -f2)
v_sw=$(grep -o 'app\.js?v=[0-9A-Za-z.]*' "$D/app/sw.js" | head -1 | cut -d= -f2)
if [ "$v_html" != "$v_sw" ]; then
  echo "version mismatch: index.html has v=$v_html, sw.js has v=$v_sw" >&2
  exit 1
fi

# shellcheck disable=SC2086
rsync -a --delete ${DRY_RUN:+--dry-run -v} ${RSYNC_OPTS:-} "$D/app/" "$DEPLOY_TARGET"
echo "deployed to $DEPLOY_TARGET"
