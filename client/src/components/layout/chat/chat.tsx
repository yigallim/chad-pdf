import { Button, Flex, Input, InputRef, Select, Space, Typography } from "antd";
import { SendOutlined, UserOutlined } from "@ant-design/icons";
import { Bubble } from "@ant-design/x";
import "highlight.js/styles/github.css";
import "katex/dist/katex.min.css";
import { useEffect, useRef, useState } from "react";
import { MARKDOWN_STYLES } from "./markdown-css";
import { renderMarkdown } from "./markdown-util";
import { useLocation } from "react-router-dom";
import { useConversationValue } from "@/hooks/use-conversation";
import apiClient from "@/service/api";

const modelAvatar: React.CSSProperties = {
  backgroundColor: "transparent",
};

const userAvatar: React.CSSProperties = {
  color: "#fff",
  backgroundColor: "#87d068",
};

type BotBubbleProps = {
  content: string;
  loading?: boolean;
};

const BotBubble = ({ content, loading }: BotBubbleProps) => {
  return (
    <Bubble
      styles={{
        content: {
          background: "transparent",
          paddingTop: 0,
        },
      }}
      placement="start"
      loading={loading}
      content={content}
      avatar={{ icon: <img src="/logo.png" />, style: modelAvatar }}
      messageRender={renderMarkdown}
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
      placement="end"
      loading={loading}
      content={content}
      avatar={{ icon: <UserOutlined />, style: userAvatar }}
      messageRender={renderMarkdown}
    />
  );
};

type Message = {
  role: "user" | "model";
  content: string;
};

const Chat = () => {
  let { pathname } = useLocation();
  let path = pathname.slice(1);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<InputRef>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const { items } = useConversationValue();
  const currentConversation = items.find((item) => item.id === path);
  const pdfMeta = currentConversation == undefined ? [] : currentConversation.pdfMeta;
  const inputDisabled = pdfMeta.length === 0 || loading;

  const handleSend = async () => {
    if (!input.trim() || loading || pdfMeta.length === 0 || !currentConversation) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await apiClient.post(`/conversation/${currentConversation.id}`, {
        message: userMessage.content,
      });
      const history = data.history || [];
      const newMessages: Message[] = history
        .map((entry: any) => {
          if (entry.role === "user") {
            return { role: "user", content: entry.parts?.[0]?.text || "" };
          }
          if (entry.role === "model") {
            return {
              role: "model",
              content: (entry.parts || []).map((p: any) => p.text).join(""),
            };
          }
          return null;
        })
        .filter(Boolean) as Message[];
      setMessages(newMessages);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Failed to send message. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentConversation && Array.isArray(currentConversation.history)) {
      const mapped = currentConversation.history
        .map((entry) => {
          if (entry.role === "user") {
            return { role: "user", content: entry.parts?.[0]?.text || "" };
          }
          if (entry.role === "model") {
            return {
              role: "model",
              content: (entry.parts || []).map((p) => p.text).join(""),
            };
          }
          return null;
        })
        .filter(Boolean) as Message[];
      setMessages(mapped);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

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

    document.addEventListener("click", (e) => {
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
      }
    });

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  return (
    <div className="flex flex-col border-l-neutral-200 border-l-4 min-w-0 h-full">
      <div className="flex items-center justify-between py-3 bg-white z-10 px-6 border-b border-neutral-200">
        <Typography.Title level={4} style={{ margin: 0 }}>
          Conversation
        </Typography.Title>
        <Select
          variant="borderless"
          defaultValue="1"
          className="min-w-[160px]"
          onChange={() => {}}
          options={[
            { value: "1", label: "DeepSeek V3" },
            { value: "", label: "Gemini 2.0 Flash" },
          ]}
        />
      </div>
      <div className="flex-1 w-full overflow-auto">
        <div className="max-w-[750px] mx-auto py-8 px-6">
          <Flex gap={32} vertical>
            {messages.map((msg, idx) =>
              msg.role === "user" ? (
                <UserBubble key={idx} content={msg.content} />
              ) : (
                <BotBubble key={idx} content={msg.content} />
              )
            )}
            {loading && <BotBubble content="" loading={true} />}
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
          <Input
            ref={inputRef}
            placeholder="Ask any question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={!inputDisabled ? handleSend : undefined}
            disabled={inputDisabled}
          />
          <Button
            icon={<SendOutlined />}
            type="primary"
            onClick={handleSend}
            disabled={inputDisabled}
          />
        </Space.Compact>
      </div>
    </div>
  );
};

export default Chat;
