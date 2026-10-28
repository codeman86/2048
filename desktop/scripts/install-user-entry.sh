#!/bin/bash
# Install a user-level launcher that points at an AppImage.
set -euo pipefail

if [ $# -ne 1 ] || [ ! -f "$1" ]; then
  echo "usage: install-user-entry.sh /path/to/2048.AppImage" >&2
  exit 1
fi

app=$(CDPATH= cd -- "$(dirname "$1")" && pwd)/$(basename "$1")
here=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
desktop=$(CDPATH= cd -- "$here/.." && pwd)
icon_name=xyz.codyhadley.game2048
share="${XDG_DATA_HOME:-$HOME/.local/share}"
app_dir="$share/applications"

mkdir -p "$app_dir" \
  "$share/icons/hicolor/32x32/apps" \
  "$share/icons/hicolor/128x128/apps" \
  "$share/icons/hicolor/256x256/apps" \
  "$share/icons/hicolor/512x512/apps"

install -m 644 "$desktop/src-tauri/icons/32x32.png" "$share/icons/hicolor/32x32/apps/$icon_name.png"
install -m 644 "$desktop/src-tauri/icons/128x128.png" "$share/icons/hicolor/128x128/apps/$icon_name.png"
install -m 644 "$desktop/src-tauri/icons/128x128@2x.png" "$share/icons/hicolor/256x256/apps/$icon_name.png"
install -m 644 "$desktop/src-tauri/icons/icon.png" "$share/icons/hicolor/512x512/apps/$icon_name.png"

python3 - "$desktop/2048.desktop" "$app_dir/$icon_name.desktop" "$app" << 'PY'
import pathlib, sys
src, dest, app = sys.argv[1:]
lines = []
for line in pathlib.Path(src).read_text().splitlines():
    if line.startswith("Exec="):
        lines.append(f'Exec="{app}"')
    else:
        lines.append(line)
pathlib.Path(dest).write_text("\n".join(lines) + "\n")
PY
chmod 644 "$app_dir/$icon_name.desktop"

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$app_dir" || true
fi

echo "Installed $app_dir/$icon_name.desktop"
