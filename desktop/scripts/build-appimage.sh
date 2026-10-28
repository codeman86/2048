#!/bin/bash
# Build the Linux AppImage, then swap in the library preflight launcher.
set -euo pipefail

desktop=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$desktop"
export APPIMAGE_EXTRACT_AND_RUN="${APPIMAGE_EXTRACT_AND_RUN:-1}"

bash "$desktop/scripts/check-offline.sh"
npx --yes @tauri-apps/cli@2.12.3 build --bundles appimage
bash "$desktop/src-tauri/appimage/repack.sh"
