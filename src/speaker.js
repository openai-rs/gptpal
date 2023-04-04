let speechSynthesis = window.speechSynthesis;

let utterance = null;


function checkPlay(ele) {
    if (ele.checked == true) {
        if (speechSynthesis) {
            ele.checked = true;
            utterance = new SpeechSynthesisUtterance();
        }
    } else {
        ele.checked = false;
    }
}

function playVoice(content) {
    if (document.getElementById("play-voice").checked) {
        utterance.text = content;
        speechSynthesis.speak(utterance);
    }
}