use crate::*;
use openai_api_rust::chat::*;
use openai_api_rust::completions::*;

#[test]
fn chat() {
    try_init_openai();
    let openai = get_openai().unwrap();

    let body = ChatBody {
        model: "gpt-3.5-turbo".to_string(),
        max_tokens: Some(7),
        temperature: Some(0_f32),
        top_p: Some(0_f32),
        n: Some(2),
        stream: Some(false),
        stop: None,
        presence_penalty: None,
        frequency_penalty: None,
        logit_bias: None,
        user: None,
        messages: vec![Message {
            role: Some("user".to_string()),
            content: Some("Hello!".to_string()),
        }],
    };
    let rs = openai.chat_completion_create(&body);
    println!("rs: {:?}", rs);
}

pub fn get_openai() -> Option<OpenAI>{
    let openai = OPENAI.read().unwrap();
    if let Some(openai) = &*openai {
        return Some(openai.clone());
    }
    None
}