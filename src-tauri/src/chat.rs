use std::fs::File;
use std::fs::OpenOptions;
use std::io::Read;
use std::io::Write;
use std::path::Path;

use crate::*;
use openai_api_rust::chat::*;
use openai_api_rust::models::ModelsApi;
use openai_api_rust::Message;
use serde_json::json;

type InvokeResult = Result<serde_json::Value, String>;

#[tauri::command]
pub async fn send_content(messages: Vec<Message>, conversation_id: String) -> InvokeResult {
    let openai = get_openai().unwrap();

    let body = ChatBody {
        model: "gpt-3.5-turbo".to_string(),
        max_tokens: None,
        temperature: Some(0.7),
        top_p: Some(0.9),
        n: Some(1),
        stream: None,
        stop: None,
        presence_penalty: None,
        frequency_penalty: None,
        logit_bias: None,
        user: None,
        messages,
    };
    let rs = openai.chat_completion_create(&body);
    let content;
    match rs {
        Ok(com) => {
            let choice = com.choices.get(0).unwrap();
            let message = choice.message.as_ref().unwrap();
            content = message.content.clone();
        }
        Err(err) => {
            return Err(err.to_string());
        }
    }
    Ok(json!({ "content": convert_to_html(&content), "id": conversation_id  }))
}

const CONVERSATIONS_FILE: &str = "conversations.txt";
const CONFIG_FILE: &str = "gptpal.conf";

#[tauri::command]
pub fn save_conversations(conversation_map: String) {
    write_file(CONVERSATIONS_FILE, conversation_map);
}

#[tauri::command]
pub fn load_conversations() -> String {
    read_file(CONVERSATIONS_FILE)
}

#[tauri::command]
pub fn save_config(config: String) {
    write_file(CONFIG_FILE, config);
}

#[tauri::command]
pub fn load_config() -> String {
    read_file(CONFIG_FILE)
}

fn write_file(file_path: &str, data: String) {
    let path = Path::new(file_path);
    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(path)
        .expect("Failed to open file");
    file.write(data.as_bytes())
        .expect("Failed to write conversations to file");
}

fn read_file(file_path: &str) -> String {
    let path = Path::new(file_path);
    let mut data = String::new();
    if !path.exists() {
        return data;
    }
    let mut file = File::open(path).unwrap();
    file.read_to_string(&mut data).expect("Failed to load file");
    data
}

#[tauri::command]
pub async fn list_models() -> String {
    let openai = get_openai().unwrap();
    let models = openai.models_list().unwrap();
    let filtered_models = models
        .iter()
        .filter(|m| m.id.contains("gpt") && !m.permission.is_empty())
        .collect::<Vec<_>>();
    serde_json::to_string(&filtered_models).unwrap()
}

fn convert_to_html(content: &str) -> String {
    let parser = pulldown_cmark::Parser::new(content);
    let mut html_content = String::new();
    pulldown_cmark::html::push_html(&mut html_content, parser);
    html_content
}
