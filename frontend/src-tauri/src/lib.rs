use tauri::Manager;

#[tauri::command]
fn get_desktop_version() -> String {
    "1.0.0".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![get_desktop_version])
        .run(tauri::generate_context!())
        .expect("error while running ShopBill desktop application");
}
