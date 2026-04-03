mod commands;
mod http;
mod ai;
mod agent;
mod storage;
mod models;

use storage::init_db;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::block_on(async move {
                // Obtener directorio de datos de la app según el OS
                let data_dir = app_handle
                    .path()
                    .app_data_dir()
                    .expect("No se pudo obtener el directorio de datos");

                std::fs::create_dir_all(&data_dir)
                    .expect("No se pudo crear el directorio de datos");

                let db_path = data_dir.join("orion.db");
                let db_path_str = db_path.to_str()
                    .expect("Ruta de DB inválida");

                // Inicializar SQLite y guardar el pool como estado global
                let pool = init_db(db_path_str)
                    .await
                    .expect("Error inicializando la base de datos");

                app_handle.manage(pool);
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // HTTP
            commands::send_http_request,
            // Collections
            commands::save_collection,
            commands::get_collections,
            commands::delete_collection,
            // Requests
            commands::save_request,
            commands::delete_request,
            // History
            commands::get_history,
            commands::clear_history,
            // Environments
            commands::save_environment,
            commands::get_environments,
            commands::delete_environment,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}