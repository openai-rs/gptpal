use std::collections::HashMap;

use crate::chat::*;
use select::document::Document;
use select::predicate::Name;

const PROMPTS_FILE: &str = "prompts.json";

#[tauri::command]
pub async fn sync_prompts_en(proxy: Option<&str>) -> Result<(), String> {
    println!("Sync prompts...");
    let html;
    if let Some(proxy) = proxy {
        let proxy = ureq::Proxy::new(proxy).unwrap();
        let agent = ureq::AgentBuilder::new().proxy(proxy).build();
        html = agent
            .get("https://github.com/f/awesome-chatgpt-prompts/blob/main/README.md")
            .call()
            .map_err(|e| e.to_string())?
            .into_string()
            .map_err(|e| e.to_string())?;
    } else {
        html = ureq::get("https://github.com/f/awesome-chatgpt-prompts/blob/main/README.md")
            .call()
            .map_err(|e| e.to_string())?
            .into_string()
            .map_err(|e| e.to_string())?;
    }

    let dom = Document::from(html.as_str());
    let mut map: HashMap<String, (String, i32)> = HashMap::new();
    let mut titles = vec![];
    let mut contents = vec![];
    for title_node in dom.find(Name("h2")) {
        let mut title = title_node.text().to_lowercase();
        if !title.contains("act as") {
            continue;
        }
        title = title
            .replace("act as", "")
            .replace(" an ", "")
            .replace(" a ", "")
            .trim()
            .to_string();
        titles.push(title);
    }
    for blockquote in dom.find(Name("blockquote")) {
        let content = blockquote.text().trim().to_string();
        let check_txt = blockquote.prev().unwrap().prev().unwrap().text();
        if check_txt.contains("Contributed") || check_txt.contains("Example") {
            contents.push(content);
        }
    }

    for i in 0..titles.len() {
        let content_idx = i + contents.len() - titles.len();
        map.insert(titles[i].clone(), (contents[content_idx].clone(), 0));
    }
    write_file(PROMPTS_FILE, serde_json::to_string(&map).unwrap());
    println!("Sync prompts done.");
    Ok(())
}

#[tauri::command]
pub async fn load_prompts() -> String {
    read_file(PROMPTS_FILE)
}

#[tauri::command]
pub async fn save_prompts(map: String) {
    write_file(PROMPTS_FILE, map);
}
