export const createSpeechRecognition = (onResult, onError, onEnd) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    onResult(finalTranscript, interimTranscript);
  };

  if (onError) {
    recognition.onerror = onError;
  }

  if (onEnd) {
    recognition.onend = onEnd;
  }

  return recognition;
};

export const speakText = (text) => {
  if (!window.speechSynthesis) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  // Try to find a good English voice
  utterance.voice = voices.find(v => v.lang.includes('en')) || voices[0];
  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
};
