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

export const getSpeechRecognitionErrorMessage = (error) => {
  const rawCode = typeof error === 'string'
    ? error
    : error?.error || error?.name || 'unknown';
  const code = {
    NotAllowedError: 'not-allowed',
    PermissionDeniedError: 'not-allowed',
    NotFoundError: 'audio-capture',
    NetworkError: 'network',
  }[rawCode] || rawCode;

  const messages = {
    'not-allowed': 'Microphone access is blocked. Allow microphone access for this site in your browser settings, then try again.',
    'service-not-allowed': 'The browser speech-recognition service is blocked. Check your browser permissions or use the text box instead.',
    'audio-capture': 'No microphone was found. Connect or enable a microphone, then try again.',
    network: 'The browser could not reach its speech-recognition service. Check your internet connection and try again, or use the text box.',
    'language-not-supported': 'Speech recognition does not support the selected language in this browser.',
    'no-speech': 'No speech was detected. Check your microphone and try speaking again.',
    aborted: 'Speech recognition was stopped.',
  };

  return messages[code] || `Speech recognition failed (${code}). Check your microphone and browser permissions, then try again.`;
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
