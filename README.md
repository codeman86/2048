# Gridline Arcade

A small collection of single-file browser games with a dark green, Tron-inspired visual style.

## Play

Open `index.html` in a browser and choose a game.

A Linux desktop build of the codyhadley.xyz 2048 page is in [Desktop app (Linux)](#desktop-app-linux).

Games:

- `2048.html`: grid puzzle inspired by 2048.
- `star-swarm.html`: retro arcade space shooter.

## Star Swarm Controls

- Use Left/Right arrow keys or A/D on desktop.
- Press Space to fire.
- Drag on touch devices to move and hold to fire.

## 2048 Controls

- Use arrow keys or WASD on desktop.
- Swipe on the board on touch devices.
- Combine matching tiles until you reach 2048.

## Features

- Smooth animated tile movement
- Merge and spawn animations
- Arcade waves, dive attacks, tractor beams, and twin-fire rescue rewards
- Responsive layout for desktop and mobile
- Local best score saved in the browser
- No build step or external dependencies

## Hosting

This project is ready for static hosting with GitHub Pages. After publishing the repository, enable GitHub Pages from the repository settings and serve from the `main` branch.

## Desktop app (Linux)

The installable app follows the 2048 page on [codyhadley.xyz/tools/2048](https://codyhadley.xyz/tools/2048): the same layout, colors, fonts, and tile motion. `2048.html` in this repository is the Gridline Arcade edition and stays as it is. Packaging is under `desktop/`, separate from those static pages.

### Wrapper

Tauri 2. The page uses the site's CSS, including variable fonts and `color-mix`, so the window is a native shell around WebKitGTK 4.1. The release binary is about 3.5MB. The AppImage is about 77MB because it carries WebKitGTK, JavaScriptCore, and ICU with the game, which lets it start without a distro copy of WebKit. GPU libraries stay on the system so the driver matches the machine. The game files (HTML, CSS, JavaScript, and Fraunces, Source Sans 3, and IBM Plex Mono) are inside the image. The window refuses any other origin, and the best score is saved on this computer under the key `codyhadley-2048-best` in `~/.local/share/xyz.codyhadley.game2048`.

To mount the AppImage on Arch, including Arch Craft:

```bash
sudo pacman -S --needed fuse2 mesa
```

`mesa` provides `libEGL.so.1` and `libGLESv2.so.2`. The launcher checks those, and also `libwebkit2gtk-4.1.so.0`, which the AppImage already contains. If one is missing it prints a package command and exits. It does not install packages itself.

### Build the AppImage

A current stable Rust, Node.js 22, and the WebKitGTK headers. On Arch:

```bash
sudo pacman -S --needed base-devel rust nodejs npm pkgconf webkit2gtk-4.1 gtk3 mesa librsvg patchelf curl wget file openssl
cd desktop
bash scripts/build-appimage.sh
```

The script checks that `desktop/www` has no remote URLs, runs Tauri's AppImage bundler, then repacks the image with a small library preflight. The AppImage lands in `desktop/src-tauri/target/release/bundle/appimage/`. The bundler downloads its tools while building. The app that comes out runs from the files inside it.

GitHub Actions (`.github/workflows/desktop.yml`) builds the same AppImage and uploads it as the `2048-linux-appimage` artifact.

### Install and run

No sudo. This copies the AppImage to `~/Applications/2048.AppImage`, installs the icon under `~/.local/share/icons/hicolor`, and writes `~/.local/share/applications/xyz.codyhadley.game2048.desktop` with `Categories=Game;LogicGame;` so XFCE lists it in Games.

```bash
bash packaging/install.sh
~/Applications/2048.AppImage
```

Pass a downloaded artifact when it is not the local build output:

```bash
bash packaging/install.sh /path/to/2048_0.2.0_amd64.AppImage
```

GitHub Actions uploads that file as the `2048-linux-appimage` artifact.

Arrow keys or WASD slide the tiles. A pointer swipe on the board does the same. New game starts over. The best score stays in the app's local WebKit profile.

If FUSE is unavailable, `APPIMAGE_EXTRACT_AND_RUN=1 ./2048.AppImage` still starts it.

### Arch package

From a checkout of this repository:

```bash
cd desktop
makepkg -si
```

That compiles the release binary with `cargo build --release --locked` and installs `/usr/bin/2048`, a `.desktop` file, and the icon. It does not build the AppImage.

## License

MIT. The bundled Fraunces, Source Sans 3, and IBM Plex Mono files are under the SIL Open Font License; see `desktop/licenses/`.
