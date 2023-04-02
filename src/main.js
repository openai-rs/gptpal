const { invoke } = window.__TAURI__.tauri;

let chatHistory;
let chatContentInput;
let conversationsDiv;
let coverDiv;
// Global variable
let curConversationId;
let Config = {
  api_key: null,
  organization: null,
  proxy: null,
  api_url: null,
  model: {
    model_id: null,
    max_tokens: null,
    temperature: null,
    presence_penalty: null,
    frequency_penalty: null,
  }
}
let conversationMap = {};

window.addEventListener("DOMContentLoaded", () => {
  chatHistory = document.getElementById("chat-history")
  chatContentInput = document.getElementById("chat-content")
  conversationsDiv = document.getElementById("conversations");
  coverDiv = document.getElementById("cover");
  chatContentInput.addEventListener("keydown", function (event) {
    if (event.shiftKey && event.key === 'Enter') {
      chatContentInput.value = chatContentInput.value + "\n";
    } else if (event.key === 'Enter') {
      event.preventDefault();
      sendChatContent();
    }
  })
  loadConfig();
  loadConversationMap();
});

const Role = {
  user: "user",
  assistant: "assistant",
  error: "error",
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
  document.getElementById("typing").style.visibility = 'visible';
  invoke("send_content", { messages: conversationMap[curConversationId], conversationId: curConversationId })
    .then((res) => {
      if (res.id == curConversationId) {
        appendMsg(Role.assistant, res.content);
        document.getElementById("typing").style.visibility = 'hidden';
      } else {
        document.querySelector("[data-id='" + res.id + "']").classList.add("notify");
      }
      conversationMap[res.id].push({ role: Role.assistant, content: res.content });
      saveConversations();
    }).catch(err => {
      appendMsg(Role.error, err);
    });
}

async function loadConversationMap() {
  let conversations = await invoke("load_conversations");
  if (!conversations) {
    return;
  }
  let json = JSON.parse(conversations);
  conversationMap = json;
  Object.keys(json).reverse().forEach((key) => {
    const value = json[key];
    conversationsDiv.appendChild(buildTitleNode(key, subTitle(value[0].content)));
  })
}

async function loadConfig() {
  let config = await invoke("load_config");
  if (!config) {
    return;
  }
  let json = JSON.parse(config);
  document.getElementById("key-input").value = json.api_key;
  document.getElementById("org-input").value = json.organization;
  document.getElementById("url-input").value = json.api_url;
  document.getElementById("proxy-input").value = json.proxy;
  Config = json;
  // model config
  document.getElementById("max-tokens-input").value = Config.model.max_tokens;
  document.getElementById("temperature-input").value = Config.model.temperature;
  document.getElementById("presence-input").value = Config.model.presence_penalty;
  document.getElementById("frequency-input").value = Config.model.frequency_penalty;
  updateOpenAi();
}

async function saveConfig() {
  let config = JSON.stringify(Config);
  invoke("save_config", { config: config });
}

function saveApi() {
  Config.api_key = document.getElementById("key-input").value;
  Config.organization = document.getElementById("org-input").value;
  Config.api_url = document.getElementById("url-input").value;
  Config.proxy = document.getElementById("proxy-input").value;
  Config.api_key = Config.api_key ? Config.api_key : null;
  Config.organization = Config.organization ? Config.organization : null;
  Config.api_url = Config.api_url ? Config.api_url : null;
  Config.proxy = Config.proxy ? Config.proxy : null;
  saveConfig();
  closeCover();
  updateOpenAi();
}

function updateOpenAi() {
  invoke("update_api", { config: Config }).then(() => {
    initModelSelect();
  });
}

function saveModel() {
  Config.model.model_id = document.getElementById("select-model").value;
  Config.model.max_tokens = document.getElementById("max-tokens-input").value;
  Config.model.temperature = document.getElementById("temperature-input").value;
  Config.model.presence_penalty = document.getElementById("presence-input").value;
  Config.model.frequency_penalty = document.getElementById("frequency-input").value;

  Config.model.model_id = Config.model.model_id ? Config.model.model_id : null;
  Config.model.max_tokens = Config.model.max_tokens ? parseInt(Config.model.max_tokens) : null;
  Config.model.temperature = Config.model.temperature ? parseFloat(Config.model.temperature) : null;
  Config.model.presence_penalty = Config.model.presence_penalty ? parseFloat(Config.model.presence_penalty) : null;
  Config.model.frequency_penalty = Config.model.frequency_penalty ? parseFloat(Config.model.frequency_penalty) : null;
  saveConfig();
  closeCover();
  updateModel();
}

function updateModel() {
  invoke("update_model", { config: Config.model });
}

function loadConversationHistory(conversationId) {
  let history = conversationMap[conversationId];
  history.forEach((val) => {
    chatHistory.appendChild(buildMessageNode(val.role, val.content));
  })
  if (history[history.length - 1].role == Role.assistant) {
    document.getElementById("typing").style.visibility = 'hidden';
  } else {
    document.getElementById("typing").style.visibility = 'visible';
  }
  highlightCode();
}

function highlightCode() {
  hljs.highlightAll();
  let pres = document.querySelectorAll("pre");
  pres.forEach((ele) => {
    if (!ele.querySelector(".copy-code")) {
      let code = ele.getElementsByTagName("code")[0];
      let lan;
      if (code.classList[1].includes("language")) {
        lan = code.classList[1].replace("language-", "");
      } else {
        lan = code.classList[0].replace("language-", "");
      }
      let copyDiv = document.createElement("div");
      copyDiv.innerHTML = "<div class='copy-code two-end'><div>" + lan + "</div><div class='btn'>📄 Copy</div></div>";
      ele.insertBefore(copyDiv, code);
    }
  })
  let clipboard = new ClipboardJS('.copy-code', {
    text: function (trigger) {
      return trigger.parentElement.nextElementSibling;
    }
  });
  clipboard.on('success', function (e) {
    e.trigger.querySelector(".btn").innerHTML = "📋 Copied!"
    e.clearSelection();
    setTimeout(function () {
      e.trigger.querySelector(".btn").innerHTML = "📄 Copy"
    }, 1000);
  });
}

function newConversation(content) {
  curConversationId = new Date().getTime() + "";
  conversationsDiv.insertBefore(buildTitleNode(curConversationId, subTitle(content), true), conversationsDiv.firstChild);
}

function clickConversation(ele) {
  let dataId = ele.getAttribute("data-id");
  clearActiveConversation();
  ele.classList.remove("notify");
  ele.classList.add("active");
  loadConversationHistory(dataId);
  curConversationId = dataId;
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function removeConversation(event) {
  let ele = event.target;
  let dataId = ele.parentElement.getAttribute("data-id");
  if (curConversationId == dataId) {
    clearActiveConversation();
  }
  document.querySelector("[data-id='" + dataId + "']").remove();
  delete conversationMap[dataId];
  saveConversations();
  event.stopPropagation();
}

function clearConversations() {
  clearActiveConversation();
  conversationMap = {};
  conversationsDiv.innerHTML = "";
  saveConversations();
}

function saveConversations() {
  invoke("save_conversations", { conversationMap: JSON.stringify(conversationMap) });
}

async function initModelSelect() {
  let models = await invoke("list_models");
  let json = JSON.parse(models);
  let selectModel = document.getElementById("select-model");
  json.reverse().forEach(model => {
    let option = document.createElement("option");
    option.textContent = model.id;
    selectModel.appendChild(option);
  })
  if (Config.model.model_id) {
    selectModel.value = Config.model.model_id;
  } else {
    selectModel.value = "gpt-3.5-turbo";
  }
}

function modelChange() {
  Config.model.model_id = document.getElementById("select-model").value;
  saveConfig();
  updateModel();
}

function buildTitleNode(conversationId, title, isActive) {
  let node = document.createElement("div");
  let active = isActive ? "active" : "";
  node.innerHTML = "<div onclick='clickConversation(this)' data-id='" + conversationId + "' class='conversation two-end " + active + "'><div class='raw'><div class='current status'>🟢</div><div class='default status'>⚪</div><div class='notify status'>🟠</div><div class='title'></div></div><div onclick='removeConversation(event)' class='remove btn'>❌</div></div>"
  node.querySelector(".title").innerText = title;
  return node.firstChild;
}

function buildMessageNode(role, content) {
  let node = document.createElement("div");
  if (role == Role.user) {
    node.innerHTML = "<div class='message user-message'><div class='textarea'></div><div class='avatar'></div></div>"
    node.querySelector(".textarea").innerText = content;
  } else if (role == Role.assistant) {
    node.innerHTML = "<div class='message bot-message'><div class='avatar'></div><div class='textarea'>" + content + "</div></div>"
  } else if (role == Role.error) {
    node.innerHTML = "<div class='message bot-message err-message'><div class='avatar'></div><div class='textarea'>" + content + "</div></div>"
  }
  return node.firstChild;
}

function clearActiveConversation() {
  let activeNode = document.querySelector(".conversation.active")
  activeNode && activeNode.classList.remove("active");
  curConversationId = null;
  chatHistory.innerHTML = "";
}

function appendMsg(role, content) {
  chatHistory.appendChild(buildMessageNode(role, content));
  chatHistory.scrollTop = chatHistory.scrollHeight;
  highlightCode();
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

function openApiDialog() {
  openCover();
  document.getElementById("api-dialog").style.display = "flex";
}

function openModelDialog() {
  openCover();
  document.getElementById("model-dialog").style.display = "flex";
}

function openCover() {
  coverDiv.style.display = "block";
}

function closeCover() {
  coverDiv.style.display = "none";
  let dialogs = document.getElementsByClassName("dialog");
  for (let i = 0; i < dialogs.length; i++) {
    dialogs[i].style.display = "none";
  }
}