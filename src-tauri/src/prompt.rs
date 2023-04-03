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
    let mut map: HashMap<String, String> = HashMap::new();
    for title_node in dom.find(Name("h2")) {
        let mut title = title_node.text();
        if !title.contains("Act as") {
            continue;
        }
        title = title
            .replace("Act as", "")
            .replace(" an ", "")
            .replace(" a ", "")
            .trim()
            .to_string();
        let mut content = title_node
            .next()
            .unwrap()
            .next()
            .unwrap()
            .next()
            .unwrap()
            .next()
            .unwrap()
            .first_child()
            .unwrap()
            .next()
            .unwrap()
            .text();

        content = content.trim().to_string();
        map.insert(title.to_lowercase(), content);
    }
    write_file(PROMPTS_FILE, serde_json::to_string(&map).unwrap());
    println!("Sync prompts done.");
    Ok(())
}

#[tauri::command]
pub async fn load_prompts() -> String {
    read_file(PROMPTS_FILE)
}
