use tauri::plugin::Builder as PluginBuilder;
use tauri::{Runtime, Url};

fn local_only(url: &Url) -> bool {
    match url.scheme() {
        "tauri" | "asset" | "about" | "data" | "blob" | "ipc" => true,
        "http" | "https" => matches!(
            url.host_str(),
            Some("tauri.localhost" | "ipc.localhost" | "asset.localhost")
        ),
        _ => false,
    }
}

fn offline_plugin<R: Runtime>() -> tauri::plugin::TauriPlugin<R> {
    PluginBuilder::new("offline")
        .on_navigation(|_webview, url| local_only(url))
        .build()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(offline_plugin())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
