#!/bin/bash
# Repack the Tauri AppImage with the dependency preflight AppRun.
# GPU libraries (libEGL, libGLESv2) are removed if the bundler copied them in.
set -euo pipefail

root=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
bundle="$root/src-tauri/target/release/bundle/appimage"
preflight="$root/src-tauri/appimage/AppRun"

appdir=$(find "$bundle" -mindepth 1 -maxdepth 1 -type d -name '*.AppDir' -print -quit)
appimage=$(find "$bundle" -mindepth 1 -maxdepth 1 -type f -name '*.AppImage' -print -quit)

if [ -z "$appdir" ] || [ -z "$appimage" ]; then
  echo "AppImage build output not found in $bundle" >&2
  exit 1
fi

find "$appdir" \( -name 'libEGL.so' -o -name 'libEGL.so.*' -o -name 'libGLESv2.so' -o -name 'libGLESv2.so.*' \) ! -type d -delete

if [ ! -f "$appdir/AppRun.orig" ]; then
  mv "$appdir/AppRun" "$appdir/AppRun.orig"
elif grep -q '2048-apprun-preflight' "$appdir/AppRun.orig"; then
  echo "AppRun.orig is already the preflight wrapper" >&2
  exit 1
fi

cp "$preflight" "$appdir/AppRun"
chmod +x "$appdir/AppRun" "$appdir/AppRun.orig"

arch=$(uname -m)
case "$arch" in
  x86_64) tool_name=appimagetool-x86_64.AppImage ;;
  aarch64) tool_name=appimagetool-aarch64.AppImage ;;
  *)
    echo "unsupported architecture: $arch" >&2
    exit 1
    ;;
esac

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT
curl -fsSL --retry 3 -o "$tmpdir/$tool_name" \
  "https://github.com/AppImage/appimagetool/releases/download/continuous/$tool_name"
chmod +x "$tmpdir/$tool_name"

rm -f "$appimage"
ARCH="$arch" APPIMAGE_EXTRACT_AND_RUN=1 "$tmpdir/$tool_name" "$appdir" "$appimage"
chmod +x "$appimage"

extract="$tmpdir/extract"
mkdir -p "$extract"
( cd "$extract" && "$appimage" --appimage-extract >/dev/null )
rootfs="$extract/squashfs-root"

grep -q '2048-apprun-preflight' "$rootfs/AppRun"
grep -q 'libEGL.so.1' "$rootfs/AppRun"
grep -q 'libGLESv2.so.2' "$rootfs/AppRun"
grep -q 'libwebkit2gtk-4.1.so.0' "$rootfs/AppRun"
grep -q 'AppRun.orig' "$rootfs/AppRun"
test -x "$rootfs/AppRun.orig"

if find "$rootfs" \( -name 'libEGL.so' -o -name 'libEGL.so.*' -o -name 'libGLESv2.so' -o -name 'libGLESv2.so.*' \) -print -quit | grep -q .; then
  echo "GPU libraries were bundled into the AppImage" >&2
  exit 1
fi

echo "Repacked $appimage"
