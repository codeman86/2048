#!/bin/bash
# Install 2048 for the current user. No sudo.
# Copies the AppImage into ~/Applications, the icon into the hicolor theme,
# and a Games-menu launcher into ~/.local/share/applications.
set -euo pipefail

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
icon_name=xyz.codyhadley.game2048
share="${XDG_DATA_HOME:-$HOME/.local/share}"
dest_dir="$HOME/Applications"

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  echo "usage: packaging/install.sh [path/to/2048.AppImage]" >&2
  echo "With no path, uses desktop/src-tauri/target/release/bundle/appimage/*.AppImage" >&2
  exit 0
fi

if [ $# -ge 1 ]; then
  src=$1
else
  src=$(find "$root/desktop/src-tauri/target/release/bundle/appimage" -maxdepth 1 -type f -name '*.AppImage' -print -quit || true)
fi

if [ -z "${src:-}" ] || [ ! -f "$src" ]; then
  echo "usage: packaging/install.sh /path/to/2048.AppImage" >&2
  exit 1
fi

src=$(CDPATH= cd -- "$(dirname "$src")" && pwd)/$(basename "$src")
mkdir -p "$dest_dir" \
  "$share/applications" \
  "$share/icons/hicolor/32x32/apps" \
  "$share/icons/hicolor/128x128/apps" \
  "$share/icons/hicolor/256x256/apps" \
  "$share/icons/hicolor/512x512/apps"

dest="$dest_dir/2048.AppImage"
if [ "$src" != "$dest" ]; then
  install -m 755 "$src" "$dest"
else
  chmod 755 "$dest"
fi

icons="$root/desktop/src-tauri/icons"
install -m 644 "$icons/32x32.png" "$share/icons/hicolor/32x32/apps/$icon_name.png"
install -m 644 "$icons/128x128.png" "$share/icons/hicolor/128x128/apps/$icon_name.png"
install -m 644 "$icons/128x128@2x.png" "$share/icons/hicolor/256x256/apps/$icon_name.png"
install -m 644 "$icons/icon.png" "$share/icons/hicolor/512x512/apps/$icon_name.png"

desktop_path="$share/applications/$icon_name.desktop"
cat > "$desktop_path" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=2048
GenericName=2048 puzzle
Comment=Slide matching tiles until you reach 2048
Exec=$dest
Icon=$icon_name
Terminal=false
Categories=Game;LogicGame;
Keywords=2048;puzzle;
StartupNotify=true
StartupWMClass=2048
EOF
chmod 644 "$desktop_path"

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$share/applications" || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -f -t "$share/icons/hicolor" >/dev/null 2>&1 || true
fi

echo "AppImage: $dest"
echo "Launcher: $desktop_path"
echo "Icon: $share/icons/hicolor/*/apps/$icon_name.png"
