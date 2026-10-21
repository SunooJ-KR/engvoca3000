// Web Speech API 래퍼. 지원하지 않는 브라우저에서는 canSpeak가 false라 발음 버튼을 숨긴다.
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

let voice: SpeechSynthesisVoice | undefined;

// 음성 목록은 비동기로 채워지는 브라우저가 있어 voiceschanged 때 다시 고른다
function pickVoice() {
  const voices = speechSynthesis.getVoices();
  voice =
    voices.find((v) => v.lang === 'en-US' && v.localService) ??
    voices.find((v) => v.lang === 'en-US') ??
    voices.find((v) => v.lang.startsWith('en'));
}

if (canSpeak) {
  pickVoice();
  speechSynthesis.addEventListener('voiceschanged', pickVoice);
}

export function speak(text: string) {
  if (!canSpeak) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  if (voice) u.voice = voice;
  u.rate = 0.9;
  speechSynthesis.speak(u);
}
