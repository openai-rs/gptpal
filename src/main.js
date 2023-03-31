const { invoke } = window.__TAURI__.tauri;

let chatHistory;
let chatContentInput;
let conversationsDiv;
// Global variable
let curConversationId;
let conversationMap = {};

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
  loadConversationMap();
});

const Role = {
  user: "user",
  assistant: "assistant"
}

// Send content to backend API
function sendChatContent() {
  let content = chatContentInput.value;
  appendMsg(Role.user, content);
  chatContentInput.value = "";
  if (!curConversationId) {
    newConversation(content);
    conversationMap[curConversationId] = [{ role: Role.user, content: content }];
  } else {
    conversationMap[curConversationId].push({ role: Role.user, content: content })
  }
  invoke("send_content", { messages: conversationMap[curConversationId] })
    .then((res) => {
      appendMsg(Role.assistant, res);
      conversationMap[curConversationId].push({ role: Role.assistant, content: res })
      console.log(conversationMap);
      invoke("save_conversations", { conversationMap: JSON.stringify(conversationMap) });
    });
}

async function loadConversationMap() {
  let conversations = await invoke("load_conversations");
  if (!conversations) {
    return;
  }
  let json = JSON.parse(conversations);
  console.log("fromfile:", json);
  conversationMap = json;
  let titleHtml = "";
  Object.keys(json).reverse().forEach((key) => {
    const value = json[key];
    titleHtml += buildTitleHtml(key, subTitle(value[0].content));
  })
  conversationsDiv.innerHTML = titleHtml;
}

function loadConversationHistory(conversationId) {
  let history = conversationMap[conversationId];
  let historyHtml = "";
  history.forEach((val) => {
    historyHtml += buildMessageHtml(val.role, val.content)
  })
  chatHistory.innerHTML = historyHtml;
}

function newConversation(content) {
  curConversationId = new Date().getTime() + "";
  let div = document.createElement("div");
  div.innerHTML = buildTitleHtml(curConversationId, subTitle(content), true);
  conversationsDiv.insertBefore(div.firstChild, conversationsDiv.firstChild);
}

function clickConversation(ele) {
  let dataId = ele.getAttribute("data-id");
  clearActiveConversation();
  ele.classList.add("active");
  loadConversationHistory(dataId);
  curConversationId = dataId;
}

function removeConversation(event) {
  console.log(event);
  let ele = event.target;
  let dataId = ele.parentElement.getAttribute("data-id");
  if (curConversationId == dataId) {
    clearActiveConversation();
  }
  document.querySelector("[data-id='" + dataId + "']").remove();
  delete conversationMap[dataId];
  invoke("save_conversations", { conversationMap: JSON.stringify(conversationMap) });
  event.stopPropagation();
}

function buildTitleHtml(conversationId, title, isActive) {
  let active = isActive ? "active" : "";
  return "<div onclick='clickConversation(this)' data-id='" + conversationId + "' class='conversation two-end " + active + "'><div class='raw'><div class=cur-emoji>🟢</div><div class='chat-emoji'>⚪</div><div class='title'>" + title + "</div></div><div onclick='removeConversation(event)' class='remove btn'>❌</div></div>"
}

function buildMessageHtml(role, content) {
  if (role == Role.user) {
    return "<div class='message user-message'><div class='textarea'>" + content + "</div><div class='avatar'></div></div>"
  } else if (role == Role.assistant) {
    return "<div class='message bot-message'><div class='avatar'></div><div class='textarea'>" + content + "</div></div>"
  }
}

function clearActiveConversation() {
  let activeNode = document.querySelector(".conversation.active")
  activeNode && activeNode.classList.remove("active");
  curConversationId = null;
  chatHistory.innerHTML = "";
}

function appendMsg(role, content) {
  let node = document.createElement("div");
  node.innerHTML = buildMessageHtml(role, content);
  chatHistory.appendChild(node);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function subTitle(content) {
  let title;
  if (content.length > 20) {
    title = content.substring(0, 20);
  } else {
    title = content;
  }
  return title;
}