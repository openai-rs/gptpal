#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

mod chat;
use chat::*;
mod prompt;
use openai_api_rust::*;
use serde::{Deserialize, Serialize};
use std::sync::RwLock;

use crate::prompt::{load_prompts, save_prompts, sync_prompts_en};

#[macro_use]
extern crate lazy_static;

lazy_static! {
	pub static ref OPENAI: RwLock<Option<OpenAI>> = RwLock::new(None);
	pub static ref MODEL_CONFIG: RwLock<Option<ModelConfig>> = RwLock::new(None);
}

fn main() {
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![
			send_content,
			load_conversations,
			save_conversations,
			list_models,
			save_config,
			load_config,
			update_api,
			update_model,
			sync_prompts_en,
			load_prompts,
			save_prompts,
		])
		.plugin(tauri_plugin_window_state::Builder::default().build())
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Config {
	api_key: Option<String>,
	organization: Option<String>,
	proxy: Option<String>,
	api_url: Option<String>,
	model: ModelConfig,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ModelConfig {
	pub model_id: Option<String>,
	pub max_tokens: Option<i32>,
	pub temperature: Option<f32>,
	pub presence_penalty: Option<f32>,
	pub frequency_penalty: Option<f32>,
}

impl Clone for ModelConfig {
	fn clone(&self) -> Self {
		Self {
			max_tokens: self.max_tokens.clone(),
			temperature: self.temperature.clone(),
			presence_penalty: self.presence_penalty.clone(),
			frequency_penalty: self.frequency_penalty.clone(),
			model_id: self.model_id.clone(),
		}
	}
}

pub fn get_openai() -> Option<OpenAI> {
	let openai = OPENAI.read().expect("Failed to get openai");
	if let Some(openai) = &*openai {
		return Some(openai.clone());
	}
	None
}
