import { Button, Flex, Input, InputRef, Select, Space, Typography, Modal, App } from "antd";
import {
  CopyOutlined,
  SendOutlined,
  UserOutlined,
  DeleteOutlined,
  AudioOutlined,
  SoundOutlined,
  PauseCircleOutlined,
} from "@ant-design/icons";
import { Bubble } from "@ant-design/x";
import { useEffect, useRef, useState } from "react";
import { MARKDOWN_STYLES } from "./markdown-css";
import { renderMarkdown } from "./markdown-util";
import { useLocation } from "react-router-dom";
import { useConversationValue } from "@/hooks/use-conversation";
import apiClient from "@/service/api";
import PubSub from "pubsub-js";
import useSpeech from "@/hooks/use-speech";
import useLocalStorage from "@/hooks/use-local-storage";
import { playBase64Mp3, stopCurrentAudio } from "@/libs/utils";

const modelAvatar: React.CSSProperties = {
  backgroundColor: "transparent",
};

const userAvatar: React.CSSProperties = {
  color: "#fff",
  backgroundColor: "#87d068",
};

type ModelBubbleProps = {
  content: string;
  loading?: boolean;
  audioPlaying: boolean;
  setAudioPlaying: React.Dispatch<React.SetStateAction<boolean>>;
};

const ModelBubble = ({ content, loading, audioPlaying, setAudioPlaying }: ModelBubbleProps) => {
  return (
    <Bubble
      styles={{
        content: {
          background: "transparent",
          paddingTop: 0,
        },
        footer: {
          marginTop: 6,
        },
      }}
      placement="start"
      loading={loading}
      content={content}
      avatar={{ icon: <img src="/logo.png" />, style: modelAvatar }}
      messageRender={renderMarkdown}
      footer={(_) => (
        <Space size={4}>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(content);
            }}
            color="default"
            variant="text"
            icon={<CopyOutlined />}
          />
          {audioPlaying ? (
            <Button
              onClick={() => {
                stopCurrentAudio();
                setAudioPlaying(false);
              }}
              danger
              variant="text"
              icon={<PauseCircleOutlined />}
              title="Stop audio"
            />
          ) : (
            <Button
              onClick={async () => {
                try {
                  setAudioPlaying(true);
                  const response = await apiClient.post("/tts", { text: content });
                  const base64 = response.data.mp3_base64;

                  playBase64Mp3(base64, () => {
                    setAudioPlaying(false);
                  });
                } catch (err) {
                  console.error("Failed to fetch TTS audio:", err);
                  setAudioPlaying(false);
                }
              }}
              color="default"
              variant="text"
              disabled={audioPlaying}
              icon={<SoundOutlined />}
              title="Play audio"
            />
          )}
        </Space>
      )}
    />
  );
};

type UserBubbleProps = {
  content: string;
  loading?: boolean;
};

const UserBubble = ({ content, loading }: UserBubbleProps) => {
  return (
    <Bubble
      styles={{
        footer: {
          marginTop: 6,
        },
      }}
      placement="end"
      loading={loading}
      content={content}
      avatar={{ icon: <UserOutlined />, style: userAvatar }}
      footer={(_) => (
        <Button
          onClick={() => {
            navigator.clipboard.writeText(content);
          }}
          color="default"
          variant="text"
          icon={<CopyOutlined />}
        />
      )}
    />
  );
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

const Chat = () => {
  const { message } = App.useApp();
  const { pathname } = useLocation();
  const path = pathname.slice(1);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<InputRef>(null);
  const [selectedModel, setSelectedModel] = useLocalStorage("selectedModel", "llama3-70b-8192");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [recordingModalVisible, setRecordingModalVisible] = useState(false);
  const { isRecording, transcript, startRecording, stopRecording } = useSpeech();
  const [audioPlaying, setAudioPlaying] = useState(false);
  const { items } = useConversationValue();
  const currentConversation = items.find((item) => item.id === path);
  const pdfMeta = currentConversation?.pdfMeta || [];
  const inputDisabled = pdfMeta.length === 0 || loading || isRecording;

  const handleClearHistory = async () => {
    if (!currentConversation || clearingHistory) return;

    setClearingHistory(true);
    try {
      await apiClient.post(`/conversation/${currentConversation.id}/clear-history`);
      setMessages([]);
      message.success("Conversation history cleared successfully");
    } catch (err: any) {
      message.error("Failed to clear conversation history");
      console.error("Error clearing conversation history:", err);
    } finally {
      setClearingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || pdfMeta.length === 0 || !currentConversation) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await apiClient.post(`/conversation/${currentConversation.id}`, {
        // " output in pure sentence, keep it concise."
        message: userMessage.content,
        model: selectedModel,
        embedding_only: false,
      });
      const history = data.history || [];
      const newMessages: Message[] = history
        .filter((entry: any) => entry.role === "user" || entry.role === "assistant")
        .map((entry: any) => ({
          role: entry.role,
          content: entry.content || "",
        }));
      setMessages(newMessages);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to send message. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentConversation && Array.isArray(currentConversation.history)) {
      const mapped: Message[] = currentConversation.history
        .filter((entry: any) => entry.role === "user" || entry.role === "assistant")
        .map((entry: any) => ({
          role: entry.role,
          content: entry.content || "",
        }));

      if (pdfMeta && pdfMeta.length > 0) {
        // const firstPdfId = pdfMeta[0].id;
        // const firstPdfFilename = pdfMeta[0].filename;
        // const mockPdfLink = `<!-- pdfnav: name="${firstPdfFilename}" page=5 id=${firstPdfId} -->`;
        // mapped.push({
        //   role: "assistant",
        //   content: `Here is a reference to page 5 of your document: ${mockPdfLink}. Click it to navigate.`,
        // });
      }
      setMessages(mapped);
    } else {
      setMessages([]);
    }
  }, [currentConversation, pdfMeta]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);

    const styleElement = document.createElement("style");
    styleElement.textContent = MARKDOWN_STYLES;
    document.head.appendChild(styleElement);

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const copyButton = target.closest(
        ".copy-code-button, .copy-inline-code-button"
      ) as HTMLElement;
      if (copyButton) {
        const code = decodeURIComponent(copyButton.getAttribute("data-code") || "");
        navigator.clipboard.writeText(code).then(() => {
          if (copyButton.classList.contains("copy-code-button")) {
            const originalText = copyButton.innerHTML;
            copyButton.classList.add("copied");
            copyButton.innerHTML = '<span class="copy-icon">✓</span> Copied!';
            setTimeout(() => {
              copyButton.classList.remove("copied");
              copyButton.innerHTML = originalText;
            }, 2000);
          }
        });
        return;
      }
      const pdfButton = target.closest(".pdf-link-button") as HTMLElement;
      if (pdfButton) {
        const pdfId = pdfButton.getAttribute("data-pdf-id");
        const pageNumber = pdfButton.getAttribute("data-page-number");
        if (pdfId && pageNumber) {
          PubSub.publish("NAVIGATE_TO_PDF", {
            pdfId,
            pageNumber: parseInt(pageNumber, 10),
          });
        }
      }
    };
    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.head.removeChild(styleElement);
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  useEffect(() => {
    if (!isRecording && transcript && currentConversation) {
      console.log("Transcript captured:", transcript);
      setLoading(true);

      const userMessage: Message = { role: "user", content: transcript };
      setMessages((prev) => [...prev, userMessage]);

      apiClient
        .post(`/conversation/${currentConversation.id}`, {
          message: transcript,
          model: selectedModel,
          embedding_only: false,
        })
        .then(({ data }) => {
          const history = data.history || [];
          const newMessages: Message[] = history
            .filter((entry: any) => entry.role === "user" || entry.role === "assistant")
            .map((entry: any) => ({
              role: entry.role,
              content: entry.content || "",
            }));
          setMessages(newMessages);
        })
        .catch((err: any) => {
          console.error("Error sending transcript:", err);
          message.error("Failed to send voice message.");
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Voice input failed. Please try again." },
          ]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isRecording, transcript, currentConversation, selectedModel]);

  return (
    <div className="flex flex-col border-l-neutral-200 border-l-4 min-w-0 h-full">
      <div className="flex items-center justify-between py-3 bg-white z-10 px-6 border-b border-neutral-200">
        <Typography.Title level={4} style={{ margin: 0 }}>
          Conversation
        </Typography.Title>
        <div className="flex items-center gap-2">
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={handleClearHistory}
            loading={clearingHistory}
            disabled={!currentConversation || messages.length === 0}
            title="Clear conversation history"
          >
            Clear History
          </Button>
          <Select
            variant="borderless"
            value={selectedModel}
            className="min-w-[160px]"
            onChange={(value) => setSelectedModel(value)}
            options={[
              { value: "llama3-70b-8192", label: "Llama-3-70B" },
              { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
              { value: "deepseek/deepseek-chat-v3-0324:free", label: "DeepSeek V3" },
            ]}
          />
        </div>
      </div>
      <div className="flex-1 w-full overflow-auto">
        <div className="max-w-[750px] mx-auto py-8 px-6">
          <Flex gap={32} vertical>
            {messages.map((msg, idx) =>
              msg.role === "user" ? (
                <UserBubble key={idx} content={msg.content} />
              ) : (
                <ModelBubble
                  key={idx}
                  content={msg.content}
                  loading={false}
                  audioPlaying={audioPlaying}
                  setAudioPlaying={setAudioPlaying}
                />
              )
            )}
            {loading && (
              <ModelBubble
                content=""
                loading={true}
                audioPlaying={audioPlaying}
                setAudioPlaying={setAudioPlaying}
              />
            )}
            <div ref={bottomRef} />
          </Flex>
        </div>
      </div>
      <div className="flex flex-col justify-center mb-8 px-6 pt-4 max-w-[750px] w-full self-center">
        {pdfMeta.length === 0 && (
          <Typography.Text type="warning" className="mb-2 block text-center">
            Please add a PDF to start chatting.
          </Typography.Text>
        )}
        <Space.Compact className="w-full" size="large">
          <Input.TextArea
            ref={inputRef}
            placeholder="Ask any question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !inputDisabled) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={inputDisabled}
            autoSize={{ minRows: 1, maxRows: 6 }}
          />
          <Button
            icon={<AudioOutlined />}
            onClick={() => setRecordingModalVisible(true)}
            disabled={inputDisabled || isRecording}
            title="Record speech"
          />
          <Button
            icon={<SendOutlined />}
            type="primary"
            onClick={handleSend}
            disabled={inputDisabled}
          />
        </Space.Compact>
      </div>

      <Modal
        title="Voice Conversation"
        open={recordingModalVisible}
        onCancel={() => setRecordingModalVisible(false)}
        footer={null}
        centered
      >
        <div className="text-center py-8">
          <div className="mb-4">
            <AudioOutlined
              style={{ fontSize: "48px", color: isRecording ? "#ff4d4f" : "#1890ff" }}
            />
          </div>
          <Typography.Title level={5}>
            {isRecording ? "Listening..." : "Click to start recording"}
          </Typography.Title>

          <div className="mt-6 flex justify-center gap-4">
            {!isRecording ? (
              <Button type="primary" icon={<AudioOutlined />} onClick={startRecording}>
                Start Recording
              </Button>
            ) : (
              <Button danger type="primary" onClick={stopRecording}>
                Stop Recording
              </Button>
            )}
            <Button onClick={() => setRecordingModalVisible(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Chat;
