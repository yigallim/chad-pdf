import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function withPdfPath(path: string) {
  return "http://127.0.0.1:5000/api/uploads/" + path + ".pdf";
}

let currentAudio: HTMLAudioElement | null = null;

export function playBase64Mp3(base64: string, onEnded: () => void) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  const audio = new Audio(`data:audio/mp3;base64,${base64}`);
  currentAudio = audio;

  audio.play();
  audio.onended = () => {
    currentAudio = null;
    onEnded();
  };

  audio.onerror = () => {
    currentAudio = null;
    onEnded();
  };
}

export function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
