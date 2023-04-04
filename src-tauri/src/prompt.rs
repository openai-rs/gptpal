use std::collections::HashMap;

use crate::chat::*;

const PROMPTS_FILE: &str = "prompts.json";

#[tauri::command]
pub async fn sync_prompts_en(proxy: Option<&str>) -> Result<(), String> {
	println!("Sync prompts...");
	let awesome_repo =
		"https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv";
	let response;
	if let Some(proxy) = proxy {
		let proxy = ureq::Proxy::new(proxy).unwrap();
		let agent = ureq::AgentBuilder::new().proxy(proxy).build();
		response = agent
			.get(awesome_repo)
			.call()
			.map_err(|e| e.to_string())?
			.into_string()
			.map_err(|e| e.to_string())?;
	} else {
		response = ureq::get(awesome_repo)
			.call()
			.map_err(|e| e.to_string())?
			.into_string()
			.map_err(|e| e.to_string())?;
	}
	let mut rdr = csv::Reader::from_reader(response.as_bytes());
	let mut map = HashMap::<String, (String, i32)>::new();
	let score = 300_usize;
	for (idx, result) in rdr.records().enumerate() {
		let record = result.unwrap();
		let title = record.get(0).unwrap_or("").to_lowercase().to_string();
		let content = record.get(1).unwrap_or("").to_string();
		map.insert(title, (content, (score - idx) as i32));
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
