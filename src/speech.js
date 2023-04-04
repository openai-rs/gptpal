
let finalText = "";
let cacheText = "";

const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
let recognition = null;

function stopListen() {
    recognition.abort();
}

function startListen() {
    if (recognition == null && SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = document.getElementById("voice-lan").value;
        recognition.onstart = function () {
        }

        recognition.onresult = function (event) {
            const result = event.results;
            let curText = "";
            for (let i = 0; i < result.length; i++) {
                let text = result[i][0].transcript;
                if (result[i].isFinal && (text.toLowerCase().includes('over') || text.includes('发送'))) {
                    document.getElementById("chat-content").value = finalText + curText;
                    sendChatContent();
                    cacheText = "";
                    finalText = "";
                    recognition.abort();
                    return;
                } else {
                    curText += text
                }
            }
            cacheText = curText;
            document.getElementById("chat-content").value = finalText + cacheText;
        }

        recognition.onend = function () {
            finalText = cacheText;
            cacheText = "";
            if (document.getElementById("listen-voice").checked) {
                setTimeout(() => {
                    recognition.start();
                }, 100);
            }
        }
    }
    recognition.start();
}

function changeLanguage(ele) {
    if (recognition) {
        recognition.lang = ele.value;
    }
    voiceOver = document.getElementById("over-voice");
    if (ele.value.includes("zh")) {
        voiceOver.innerText = "说 '发送' 即可发送";
    } else {
        voiceOver.innerText = "Say 'Over' to send.";
    }
}

function checkListen(ele) {
    if (ele.checked) {
        startListen();
        document.getElementById("over-voice").style.display = "block";
    } else {
        stopListen();
        document.getElementById("over-voice").style.display = "none";
    }
}

function clearVoiceCache() {
    finalText = "";
    cacheText = "";
    recognition && recognition.abort();
}
