import { useState } from "react";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import { useConversationActions, useConversationValue } from "@/hooks/use-conversation";
import { App, Button, Spin, Typography } from "antd";
import { useLocation } from "react-router-dom";
import apiClient from "@/service/api";

const Summary = () => {
  const { message } = App.useApp();
  const { pathname } = useLocation();
  const path = pathname.slice(1); // conversation ID
  const { items } = useConversationValue();
  const { revalidateConversation } = useConversationActions();
  const currentConversation = items.find((item) => item.id === path);
  const pdfMeta = currentConversation?.pdfMeta || [];

  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    try {
      setLoading(true);
      await apiClient.post(`/conversation/${path}/summarize-pdfs`);
      await revalidateConversation();
      message.success("PDFs summarized successfully!");
    } catch (err) {
      message.error("Failed to summarize PDFs.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto flex flex-col gap-6 px-6 lg:px-12 pt-20 pb-8 relative bg-white">
      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Spin size="large" />
        </div>
      ) : pdfMeta.length === 0 ? (
        <Typography.Text type="secondary">No PDFs available.</Typography.Text>
      ) : (
        pdfMeta.map((pdf) => (
          <div key={pdf.id} className="flex flex-col gap-2 border-b border-neutral-200 pb-4">
            <Typography.Title level={4} style={{ margin: 0 }}>
              {pdf.filename} Summary:
            </Typography.Title>
            <MarkdownRenderer markdownText={pdf.summary || "_No summary available._"} />
          </div>
        ))
      )}

      <Button
        className="sticky bottom-0 left-0 right-0 mx-6 py-5!"
        size="large"
        type="primary"
        loading={loading}
        onClick={handleSummarize}
        disabled={pdfMeta.length === 0}
      >
        Summarize PDFs
      </Button>
    </div>
  );
};

export default Summary;
