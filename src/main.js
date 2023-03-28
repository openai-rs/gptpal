const { invoke } = window.__TAURI__.tauri;

let chatHistory;
let chatContentInput;

window.addEventListener("DOMContentLoaded", () => {
  chatHistory = document.getElementById("chat-history")
  chatContentInput = document.getElementById("chat-content")
  chatContentInput.addEventListener("keydown", function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendChatContent();
    }
  })
  document.getElementById("chat-send")
    .addEventListener("click", () => sendChatContent());
});

const Role = {
  user: "user",
  assistant: "assistant"
}

function sendChatContent() {
  let content = chatContentInput.value;
  appendMsg(Role.user, content);
  chatContentInput.value = "";
  invoke("send_content", { content: content, conversationId: '1729999' })
    .then((res) => {
      appendMsg(Role.assistant, res);
    });
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