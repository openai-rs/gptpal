const { invoke } = window.__TAURI__.tauri;

let chatHistory;
let chatContentInput;
let conversationsDiv;
// Global variable
let curConversationId;

window.addEventListener("DOMContentLoaded", () => {
  chatHistory = document.getElementById("chat-history")
  chatContentInput = document.getElementById("chat-content")
  conversationsDiv = document.getElementById("conversations");
  chatContentInput.addEventListener("keydown", function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendChatContent();
    }
  })
  document.getElementById("chat-send")
    .addEventListener("click", () => sendChatContent());
  document.getElementById("new-chat-btn")
    .addEventListener("click", () => {
      curConversationId = null;
      chatHistory.innerHTML = "";
    })
});

const Role = {
  user: "user",
  assistant: "assistant"
}

function sendChatContent() {
  let content = chatContentInput.value;
  appendMsg(Role.user, content);
  chatContentInput.value = "";
  if (!curConversationId) {
    newConversation(content);
  }
  invoke("send_content", { content: content, conversationId: curConversationId })
    .then((res) => {
      appendMsg(Role.assistant, res);
    });
}

function newConversation(content) {
  let title;
  if (content.length > 20) {
    title = content.substring(0, 20);
  } else {
    title = content;
  }
  curConversationId = new Date().getTime() + "";
  let div = document.createElement("div");
  div.innerHTML = "<div class='conversation two-end active'><div class='raw'><div class='chat-emoji'>🗪</div><div class='title'>" + title + "</div></div><div class='remove btn'>❌</div></div>"
  conversationsDiv.appendChild(div.firstChild);
}

function appendMsg(role, content) {
  let node = wrapMsgNode(role, content);
  chatHistory.appendChild(node);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function wrapMsgNode(role, content) {
  let div = document.createElement("div");
  if (role == Role.user) {
    div.innerHTML += "<div class='message user-message'><div class='textarea'>" + content + "</div><div class='avatar'></div></div>"
  } else if (role == Role.assistant) {
    div.innerHTML += "<div class='message bot-message'><div class='avatar'></div><div class='textarea'>" + content + "</div></div>"
  }
  return div.firstChild;
}