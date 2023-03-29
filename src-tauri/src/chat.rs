use std::collections::HashMap;

use crate::*;
use openai_api_rust::chat::*;
use openai_api_rust::Message;
use openai_api_rust::*;

type InvokeResult = Result<String, String>;
type ConversationVal = (String, Vec<Message>);

lazy_static! {
    // Key: timestamp, Value: (title, messages[])
    static ref CONVERSATIONS: RwLock<HashMap<String, ConversationVal>> = RwLock::new(HashMap::new());
}

#[tauri::command]
pub async fn send_content(content: &str, conversation_id: &str) -> InvokeResult {
    println!("content: {content}, conversation_id: {conversation_id}");
    let openai = get_openai().unwrap();

    let title;
    let mut messages = vec![];

    // If there are history messages.
    {
        let conversations = CONVERSATIONS.read().unwrap();
        let map = conversations.get(conversation_id);
        if let Some(val) = map {
            messages.append(&mut val.1.clone());
            title = val.0.clone();
        } else {
            title = subtitle(content);
        }
    }

    messages.push(Message {
        role: Role::User,
        content: String::from(content),
    });

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
        messages: messages.clone(),
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
    messages.push(Message {
        role: Role::Assistant,
        content: content.clone(),
    });
    CONVERSATIONS
        .write()
        .unwrap()
        .insert(conversation_id.to_string(), (title, messages));
    Ok(content)
}

fn subtitle(content: &str) -> String {
    let title_len = 20;
    if content.len() < title_len {
        return content.to_string();
    }

    let mut index = title_len;
    while !content.is_char_boundary(index) {
        index += 1;
    }

    content[0..index].to_string()
}
