import { useRef, useState } from "react";
import { message } from "antd";

type UseSpeechReturn = {
  isRecording: boolean;
  transcript: string;
  startRecording: () => void;
  stopRecording: () => void;
};

const useSpeech = (): UseSpeechReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      message.error("Speech recognition is not supported in your browser");
      return;
    }
    // @ts-ignore
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
          setTranscript(finalTranscript);
        } else {
          interimTranscript += transcript;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      message.error(`Speech recognition error: ${event.error}`);
      if (event.error !== "no-speech") {
        stopRecording();
      }
    };

    recognition.onend = () => {
      if (isRecording) {
        console.log("Speech ended, restarting...");
        recognition.start();
      }
    };

    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
  };
};

export default useSpeech;
