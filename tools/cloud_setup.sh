#!/usr/bin/env bash
# Set up a fresh Linux sandbox (Claude Code on the web, or any cloud machine) to build and test Loom assets
# (docs/assets/HANDOFF_CLOUD_START.md). Idempotent: running it again only fills what is missing.
#
#   bash tools/cloud_setup.sh
#
# It needs Python 3.12+ and Node 22+ on the machine. It installs the Python packages, the Node packages and the
# headless Chrome the renders and checks use, then runs the engine's own doctor.
set -eu
cd "$(dirname "$0")/.."
PY=$(command -v python3 || command -v python)
echo "== python: $($PY --version)  node: $(node --version 2>/dev/null || echo missing)"
# the required packages first, then each optional one on its own: an optional package that cannot build here (manim
# needs the system pangocairo, which a sandbox may lack) is skipped and said, never the end of the setup (batch-01, 2026-10-16)
REQ=$(mktemp); OPT=$(mktemp)
awk '/^# optional/{o=1; next} { sub(/#.*/, ""); gsub(/[ \t]+$/, ""); if ($0 != "") print > (o ? "'"$OPT"'" : "'"$REQ"'") }' requirements.txt
$PY -m pip install --quiet -r "$REQ"
while read -r pkg; do
  $PY -m pip install --quiet "$pkg" || echo "== optional package $pkg could not be installed here (skipped; only lessons that use it need it)"
done < "$OPT"
rm -f "$REQ" "$OPT"
npm ci --no-audit --no-fund
# the Chrome that HyperFrames renders with, and every browser check finds (loom/render.py browser_path)
npx --yes hyperframes browser ensure
export HYPERFRAMES_BROWSER_PATH="$(npx --yes hyperframes browser path | tail -1)"
echo "== browser: $HYPERFRAMES_BROWSER_PATH"
# fonts some sandboxes lack (text metrics must match the packs' embedded faces; the packs embed their own fonts,
# so this is only for the browser's fallback)
if command -v apt-get >/dev/null 2>&1 && [ "$(id -u)" = "0" ]; then apt-get install -y -qq fonts-dejavu-core >/dev/null 2>&1 || true; fi
$PY -m loom doctor || true
echo "== ready. Prove an item with: $PY -m loom library accept <id>"
