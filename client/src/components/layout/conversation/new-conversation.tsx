import { CSSProperties, ReactNode, useState, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { App } from "antd";
import apiClient from "@/service/api";
import { useConversationActions } from "@/hooks/use-conversation";
import ExistingPDFModal, { PDFItem } from "../pdf/existing-pdf-modal";
import UploadPDFModal from "../pdf/upload-pdf-modal";

type NewConversationProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const NewConversation = memo(({ children, className, style }: NewConversationProps) => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { revalidateConversation } = useConversationActions();
  const [existingPDFModalOpen, setExistingPDFModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const handleClick = useCallback(() => {
    setExistingPDFModalOpen(true);
  }, []);

  const handleUploadNewPDF = useCallback(() => {
    setExistingPDFModalOpen(false);
    setUploadModalOpen(true);
  }, []);

  const handleUploadModalOk = useCallback(() => {
    setUploadModalOpen(false);
    setExistingPDFModalOpen(true);
  }, []);

  const handleUploadModalCancel = useCallback(() => {
    setUploadModalOpen(false);
    setExistingPDFModalOpen(true);
  }, []);

  const handleExistingPDFModalOk = useCallback(
    async (selectedPDFs: PDFItem[], conversationName?: string) => {
      if (selectedPDFs.length <= 0) return;

      try {
        const { data } = await apiClient.post("/conversation", {
          label: conversationName,
          pdfMeta: selectedPDFs.map((pdf) => ({
            id: pdf.id,
          })),
        });
        setExistingPDFModalOpen(false);
        navigate("/" + data.id);
        message.success("Conversation created");
      } catch (error: any) {
        const msg =
          error.response?.data?.message || error.message || "Failed to create conversation";
        message.error(msg);
      } finally {
        revalidateConversation();
      }
    },
    [navigate, message, revalidateConversation]
  );

  const handleExistingPDFModalCancel = useCallback(() => {
    setExistingPDFModalOpen(false);
  }, []);

  return (
    <>
      <div onClick={handleClick} className={className} style={style}>
        {children}
      </div>
      <ExistingPDFModal
        open={existingPDFModalOpen}
        onOk={handleExistingPDFModalOk}
        onCancel={handleExistingPDFModalCancel}
        onUploadNew={handleUploadNewPDF}
      />
      <UploadPDFModal
        open={uploadModalOpen}
        onOk={handleUploadModalOk}
        onCancel={handleUploadModalCancel}
      />
    </>
  );
});

NewConversation.displayName = "NewConversation";

export default NewConversation;
