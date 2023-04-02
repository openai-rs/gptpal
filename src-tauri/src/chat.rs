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

    let body = construct_chat_request(messages);
    println!("body: {:?}", body);

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

fn construct_chat_request(messages: Vec<Message>) -> ChatBody{
    let model_config;
    {
        let global_model = MODEL_CONFIG.read().unwrap();
        model_config = (*global_model).clone();
    }

    if let Some(model) = model_config {
        return ChatBody {
            model: model.model_id.unwrap_or("gpt-3.5-turbo".to_string()),
            max_tokens: model.max_tokens,
            temperature: model.temperature,
            top_p: None,
            n: Some(1),
            stream: None,
            stop: None,
            presence_penalty: model.presence_penalty,
            frequency_penalty: model.frequency_penalty,
            logit_bias: None,
            user: None,
            messages,
        }
    }
    ChatBody {
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
    }
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

#[tauri::command]
pub fn update_api(config: Config) {
    let mut auth;

    if let Some(api_key) = config.api_key {
        auth = Auth::new(&api_key);
    } else {
        auth = Auth::from_env().unwrap_or(Auth {
            api_key: "".to_string(),
            organization: None,
        });
    }
    if let Some(org) = config.organization {
        auth.organization = Some(org);
    }

    let mut api_url = "https://api.openai.com/v1/".to_string();
    if let Some(url) = config.api_url {
        api_url = url;
    }

    let mut openai =
        OpenAI::new(auth, &api_url);
    if let Some(proxy) = config.proxy {
        openai = openai.set_proxy(&proxy);
    }
    let mut openai_global = OPENAI.write().unwrap();
    *openai_global = Some(openai);
}

#[tauri::command]
pub fn update_model(config: ModelConfig) {
    let mut model_global = MODEL_CONFIG.write().unwrap();
    *model_global = Some(config);
}