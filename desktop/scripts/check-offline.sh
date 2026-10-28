#!/bin/bash
# Fail when the desktop frontend names a remote host. Fonts, scripts, and CSS must be local files.
set -euo pipefail

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
www="$root/www"

if [ ! -d "$www" ]; then
  echo "missing $www" >&2
  exit 1
fi

# The SVG xmlns is a namespace name, not a request.
if grep -RInE --binary-files=without-match 'https?://|ipify|googletagmanager|google-analytics|fonts\.googleapis|cdnjs|unpkg|jsdelivr' "$www" \
  | grep -v 'xmlns="http://www.w3.org/2000/svg"'; then
  echo "desktop frontend contains a remote URL" >&2
  exit 1
fi

echo "desktop frontend is offline"
