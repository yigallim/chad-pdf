import React from "react";
import { Attachments, Bubble, Sender, useXAgent, useXChat } from "@ant-design/x";
import { CloudUploadOutlined, PaperClipOutlined } from "@ant-design/icons";
import { Badge, Button, type GetProp } from "antd";
import Sidebar from "./sidebar";
import Header from "./header";
import { createStyles } from "antd-style";
import Content from "./content";
import { useConversationValue } from "@/hooks/use-conversation";

const roles: GetProp<typeof Bubble.List, "roles"> = {
  ai: {
    placement: "start",
    typing: { step: 5, interval: 20 },
    styles: {
      content: {
        borderRadius: 16,
      },
    },
  },
  local: {
    placement: "end",
    variant: "shadow",
  },
};

const useStyles = createStyles(({ css }) => ({
  container: css`
    height: 100%;
    display: flex;
  `,
  main: css`
    height: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
  `,
  senderContainer: css`
    max-width: 724px;
    margin: 0 auto;
    width: 100%;
    margin-bottom: 2rem;
  `,
}));

const Independent: React.FC = () => {
  const { styles } = useStyles();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [headerOpen, setHeaderOpen] = React.useState(false);
  const [content, setContent] = React.useState("");
  const [attachedFiles, setAttachedFiles] = React.useState<GetProp<typeof Attachments, "items">>(
    []
  );

  const [agent] = useXAgent({
    request: async ({ message }, { onSuccess }) => {
      onSuccess(`Mock success return. You said: ${message}`);
    },
  });

  const { onRequest, messages, setMessages } = useXChat({ agent });

  const { currentConversationKey } = useConversationValue();
  React.useEffect(() => {
    if (currentConversationKey !== undefined) {
      setMessages([]);
    }
  }, [currentConversationKey]);

  React.useEffect(() => {
    if (document.readyState === "complete") {
      setIsLoaded(true);
    } else {
      const handleLoad = () => setIsLoaded(true);
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  const onSubmit = (nextContent: string) => {
    if (!nextContent) return;
    onRequest(nextContent);
    setContent("");
  };

  const handleFileChange: GetProp<typeof Attachments, "onChange"> = (info) =>
    setAttachedFiles(info.fileList);

  const attachmentsNode = (
    <Badge dot={attachedFiles.length > 0 && !headerOpen}>
      <Button type="text" icon={<PaperClipOutlined />} onClick={() => setHeaderOpen(!headerOpen)} />
    </Badge>
  );

  const senderHeader = (
    <Sender.Header
      title="Attachments"
      open={headerOpen}
      onOpenChange={setHeaderOpen}
      styles={{
        content: {
          padding: 0,
        },
      }}
    >
      <Attachments
        beforeUpload={() => false}
        items={attachedFiles}
        onChange={handleFileChange}
        placeholder={(type) =>
          type === "drop"
            ? { title: "Drop file here" }
            : {
                icon: <CloudUploadOutlined />,
                title: "Upload files",
                description: "Click or drag files to this area to upload",
              }
        }
      />
    </Sender.Header>
  );

  if (!isLoaded) return null;

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        <Header />
        <Content messages={messages} roles={roles} />
        <div className={styles.senderContainer}>
          <Sender
            value={content}
            header={senderHeader}
            onSubmit={onSubmit}
            onChange={setContent}
            prefix={attachmentsNode}
            loading={agent.isRequesting()}
            allowSpeech
          />
        </div>
      </main>
    </div>
  );
};

export default Independent;
