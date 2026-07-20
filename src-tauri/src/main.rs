// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, LogicalSize, Manager, Size, WindowEvent,
};

use serde::{Deserialize, Serialize};

struct AppState {
    is_animating: Arc<AtomicBool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchResultNative {
    pub title: String,
    pub url: String,
    pub snippet: String,
    pub engine: String,
}

fn strip_html_tags(input: &str) -> String {
    let mut result = String::new();
    let mut inside_tag = false;
    for c in input.chars() {
        if c == '<' {
            inside_tag = true;
        } else if c == '>' {
            inside_tag = false;
        } else if !inside_tag {
            result.push(c);
        }
    }
    result
        .replace("&amp;", "&")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .trim()
        .to_string()
}

fn parse_ddg_html(html: &str) -> Vec<SearchResultNative> {
    let mut list = Vec::new();
    let parts: Vec<&str> = html.split("<a class=\"result__a\"").collect();
    for part in parts.iter().skip(1).take(5) {
        if let Some(href_start) = part.find("href=\"") {
            let rest = &part[href_start + 6..];
            if let Some(href_end) = rest.find('"') {
                let raw_url = &rest[..href_end];
                let mut clean_url = raw_url.to_string();
                if raw_url.contains("uddg=") {
                    if let Some(uddg_idx) = raw_url.find("uddg=") {
                        let param = &raw_url[uddg_idx + 5..];
                        let end_param = param.find('&').unwrap_or(param.len());
                        if let Ok(decoded) = urlencoding::decode(&param[..end_param]) {
                            clean_url = decoded.into_owned();
                        }
                    }
                }

                let title = if let Some(tag_end) = rest.find('>') {
                    if let Some(close_a) = rest[tag_end + 1..].find("</a>") {
                        strip_html_tags(&rest[tag_end + 1..tag_end + 1 + close_a])
                    } else {
                        "Web検索結果".to_string()
                    }
                } else {
                    "Web検索結果".to_string()
                };

                let snippet = if let Some(snip_idx) = part.find("result__snippet") {
                    let snip_part = &part[snip_idx..];
                    if let Some(tag_end) = snip_part.find('>') {
                        if let Some(close_a) = snip_part[tag_end + 1..].find("</a>") {
                            strip_html_tags(&snip_part[tag_end + 1..tag_end + 1 + close_a])
                        } else {
                            "概要なし".to_string()
                        }
                    } else {
                        "概要なし".to_string()
                    }
                } else {
                    "概要なし".to_string()
                };

                if !clean_url.is_empty() && clean_url.starts_with("http") {
                    list.push(SearchResultNative {
                        title,
                        url: clean_url,
                        snippet,
                        engine: "DuckDuckGo Native".to_string(),
                    });
                }
            }
        }
    }
    list
}

#[tauri::command]
async fn fetch_web_search_native(
    query: String,
    searxng_url: Option<String>,
) -> Result<Vec<SearchResultNative>, String> {
    let client = match reqwest::Client::builder()
        .timeout(Duration::from_secs(6))
        .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
        .build()
    {
        Ok(c) => c,
        Err(e) => return Err(e.to_string()),
    };

    let mut articles: Vec<SearchResultNative> = Vec::new();

    // 1. SearXNG
    if let Some(ref base_url) = searxng_url {
        let clean_url = base_url.trim().trim_end_matches('/');
        if !clean_url.is_empty() {
            let searx_endpoint = format!("{}/search?q={}&format=json", clean_url, urlencoding::encode(&query));
            if let Ok(resp) = client.get(&searx_endpoint).send().await {
                if resp.status().is_success() {
                    if let Ok(json_val) = resp.json::<serde_json::Value>().await {
                        if let Some(results_arr) = json_val.get("results").and_then(|r| r.as_array()) {
                            for item in results_arr.iter().take(5) {
                                let title = item.get("title").and_then(|v| v.as_str()).unwrap_or("無題").to_string();
                                let url = item.get("url").and_then(|v| v.as_str()).unwrap_or("#").to_string();
                                let snippet = item.get("content")
                                    .or_else(|| item.get("snippet"))
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("概要なし")
                                    .to_string();
                                let engine = item.get("engine").and_then(|v| v.as_str()).unwrap_or("SearXNG").to_string();

                                if !url.is_empty() && url != "#" {
                                    articles.push(SearchResultNative { title, url, snippet, engine });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if !articles.is_empty() {
        return Ok(articles);
    }

    // 2. DuckDuckGo HTML Search via Native HTTP
    let ddg_url = format!("https://html.duckduckgo.com/html/?q={}", urlencoding::encode(&query));
    if let Ok(resp) = client.get(&ddg_url).send().await {
        if resp.status().is_success() {
            if let Ok(html) = resp.text().await {
                let parsed = parse_ddg_html(&html);
                if !parsed.is_empty() {
                    return Ok(parsed);
                }
            }
        }
    }

    // 3. Wikipedia Search with keyword filter
    let wiki_url = format!(
        "https://ja.wikipedia.org/w/api.php?action=query&list=search&srsearch={}&format=json",
        urlencoding::encode(&query)
    );
    if let Ok(resp) = client.get(&wiki_url).send().await {
        if resp.status().is_success() {
            if let Ok(json_val) = resp.json::<serde_json::Value>().await {
                if let Some(items) = json_val.pointer("/query/search").and_then(|v| v.as_array()) {
                    let keywords: Vec<String> = query
                        .split_whitespace()
                        .map(|s| s.to_lowercase())
                        .filter(|s| s.len() > 1)
                        .collect();

                    for item in items.iter().take(5) {
                        let title = item.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string();
                        let snippet_raw = item.get("snippet").and_then(|v| v.as_str()).unwrap_or("").to_string();
                        let snippet = strip_html_tags(&snippet_raw);

                        let combined = format!("{} {}", title.to_lowercase(), snippet.to_lowercase());
                        let matches = keywords.is_empty() || keywords.iter().any(|kw| combined.contains(kw));

                        if matches && !title.is_empty() {
                            articles.push(SearchResultNative {
                                title: title.clone(),
                                url: format!("https://ja.wikipedia.org/wiki/{}", urlencoding::encode(&title)),
                                snippet,
                                engine: "Wikipedia".to_string(),
                            });
                        }
                    }
                }
            }
        }
    }

    if !articles.is_empty() {
        return Ok(articles);
    }

    Err(format!("「{}」に関するWeb検索結果を取得できませんでした。", query))
}

#[tauri::command]
async fn test_searxng_native(url: String) -> Result<String, String> {
    let clean_url = url.trim().trim_end_matches('/');
    if clean_url.is_empty() {
        return Err("SearXNGのURLを入力してください。".to_string());
    }

    let client = match reqwest::Client::builder()
        .timeout(Duration::from_secs(6))
        .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
        .build()
    {
        Ok(c) => c,
        Err(e) => return Err(e.to_string()),
    };

    let test_endpoint = format!("{}/search?q=ping&format=json", clean_url);
    match client.get(&test_endpoint).send().await {
        Ok(resp) => {
            let status = resp.status();
            if status == reqwest::StatusCode::FORBIDDEN {
                return Err("SearXNG サーバーに接続できましたが、JSON APIフォーマットが無効化されています (403 Forbidden)。".to_string());
            }
            if !status.is_success() {
                return Err(format!("HTTP エラー {}: {}", status.as_u16(), status.canonical_reason().unwrap_or("Unknown")));
            }

            match resp.json::<serde_json::Value>().await {
                Ok(data) => {
                    let hits = data.get("results").and_then(|r| r.as_array()).map(|arr| arr.len()).unwrap_or(0);
                    Ok(format!("SearXNG 疎通成功！ (API正常応答, 取得サンプル数: {}件)", hits))
                }
                Err(_) => Err("レスポンスがJSON形式ではありません。SearXNGのJSON API有効化を確認してください。".to_string()),
            }
        }
        Err(err) => {
            if err.is_timeout() {
                Err("接続タイムアウト: SearXNG サーバーからの応答がありませんでした (6秒超過)。".to_string())
            } else {
                Err(format!("接続失敗: {}", err))
            }
        }
    }
}

#[tauri::command]
fn hide_window(window: tauri::Window) {
    let _ = window.hide();
}

#[tauri::command]
fn start_drag(window: tauri::Window) {
    let _ = window.start_dragging();
}

#[tauri::command]
fn resize_window(window: tauri::Window, mode: String) {
    if mode == "full" {
        let _ = window.set_resizable(true);
        let _ = window.set_size(Size::Logical(LogicalSize {
            width: 960.0,
            height: 680.0,
        }));
    } else {
        let _ = window.set_size(Size::Logical(LogicalSize {
            width: 560.0,
            height: 160.0,
        }));
        let _ = window.set_resizable(false);
    }
}

#[tauri::command]
fn open_external_url(url: String) {
    if url.is_empty() || url == "#" {
        return;
    }

    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("open").arg(&url).spawn();

    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("cmd").args(["/C", "start", "", &url]).spawn();

    #[cfg(target_os = "linux")]
    let _ = std::process::Command::new("xdg-open").arg(&url).spawn();
}

#[tauri::command]
fn set_tray_animating(state: tauri::State<'_, AppState>, animating: bool) {
    state.is_animating.store(animating, Ordering::SeqCst);
}

#[tauri::command]
fn update_tray_badge(app_handle: tauri::AppHandle, count: usize) {
    if let Some(tray) = app_handle.tray_by_id("main_tray") {
        if count > 0 {
            let _ = tray.set_title(Some(format!(" 🥏{}", count)));
            let _ = tray.set_tooltip(Some(format!("Frisbee - 未チェック成果: {}件", count)));
        } else {
            let _ = tray.set_title(None::<String>);
            let _ = tray.set_tooltip(Some("Frisbee - 非同期情報探索エージェント (RunCat Style)"));
        }
    }
}

fn load_tauri_image(bytes: &[u8]) -> Option<Image<'static>> {
    let img = image::load_from_memory(bytes).ok()?.to_rgba8();
    let (width, height) = img.dimensions();
    Some(Image::new_owned(img.into_raw(), width, height))
}

fn main() {
    let is_animating = Arc::new(AtomicBool::new(false));
    let is_animating_clone = is_animating.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .manage(AppState {
            is_animating: is_animating.clone(),
        })
        .invoke_handler(tauri::generate_handler![
            hide_window,
            start_drag,
            resize_window,
            open_external_url,
            set_tray_animating,
            update_tray_badge,
            fetch_web_search_native,
            test_searxng_native
        ])
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                let _ = window.hide();
            }
            _ => {}
        })
        .setup(move |app| {
            // トレイメニューの構築
            let quit_i = MenuItem::with_id(app, "quit", "Frisbeeを終了", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "メイン画面を表示", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            // Load 4-frame running dog images
            let frame_bytes = vec![
                include_bytes!("../icons/runner/frame_0.png").as_ref(),
                include_bytes!("../icons/runner/frame_1.png").as_ref(),
                include_bytes!("../icons/runner/frame_2.png").as_ref(),
                include_bytes!("../icons/runner/frame_3.png").as_ref(),
            ];

            let frames: Vec<Image<'static>> = frame_bytes
                .into_iter()
                .filter_map(load_tauri_image)
                .collect();

            let default_icon = frames.first().cloned();

            let tray_builder = TrayIconBuilder::with_id("main_tray")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("Frisbee - 非同期情報探索エージェント (RunCat Style)");

            let tray_builder = if let Some(ref icon) = default_icon {
                tray_builder.icon(icon.clone())
            } else {
                tray_builder
            };

            let tray = tray_builder
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("open-full-view", ());
                            let _ = window.set_resizable(true);
                            let _ = window.set_size(Size::Logical(LogicalSize {
                                width: 960.0,
                                height: 680.0,
                            }));
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.emit("open-quick-view", ());
                                let _ = window.set_size(Size::Logical(LogicalSize {
                                    width: 560.0,
                                    height: 160.0,
                                }));
                                let _ = window.set_resizable(false);
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // RunCat Style Tray Icon Animation Thread
            if !frames.is_empty() {
                let tray_handle = tray.clone();
                let def_icon = default_icon.clone();

                thread::spawn(move || {
                    let mut frame_idx = 0;
                    let num_frames = frames.len();
                    loop {
                        thread::sleep(Duration::from_millis(120));

                        if is_animating_clone.load(Ordering::SeqCst) {
                            frame_idx = (frame_idx + 1) % num_frames;
                            let _ = tray_handle.set_icon(Some(frames[frame_idx].clone()));
                        } else {
                            if let Some(ref icon) = def_icon {
                                let _ = tray_handle.set_icon(Some(icon.clone()));
                            }
                        }
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
