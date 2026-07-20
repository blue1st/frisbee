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

struct AppState {
    is_animating: Arc<AtomicBool>,
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
            update_tray_badge
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
