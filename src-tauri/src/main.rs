#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod chat;
use openai_api_rust::*;
use std::sync::RwLock;

#[macro_use]
extern crate lazy_static;

lazy_static! {
    pub static ref OPENAI: RwLock<Option<OpenAI>> = RwLock::new(None);
}

fn main() {
    // Try init openai from env.
    try_init_openai();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![chat::send_content])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn try_init_openai() {
    let auth = Auth::from_env();
    if let Ok(auth) = auth {
        let openai =
            OpenAI::new(auth, "https://api.openai.com/v1/").set_proxy("http://127.0.0.1:10808");
        let mut openai_global = OPENAI.write().unwrap();
        *openai_global = Some(openai);
    }
}

pub fn get_openai() -> Option<OpenAI>{
    let openai = OPENAI.read().unwrap();
    if let Some(openai) = &*openai {
        return Some(openai.clone());
    }
    None
}