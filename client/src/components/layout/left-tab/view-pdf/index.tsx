import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useConversationActions, useConversationValue } from "@/hooks/use-conversation";
import apiClient from "@/service/api";
import PDFList from "./pdf-list";
import PDFViewer from "./pdf-viewer";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { Button, Empty, Typography } from "antd";

const maxWidth = 800;

const ViewPDF = () => {
  let { pathname } = useLocation();
  let path = pathname.slice(1);
  const { items } = useConversationValue();
  const { revalidateConversation } = useConversationActions();
  const [selectedPDF, setSelectedPDF] = useState<number | null>(null);

  const currentConversation = items.find((item) => item.key === path);
  const pdfMeta = currentConversation == undefined ? [] : currentConversation.pdfMeta;

  const handleDeletePDF = async (pdfId: string) => {
    if (!currentConversation) return;

    const updatedMeta = currentConversation.pdfMeta.filter((pdf) => pdf.id !== pdfId);

    try {
      await apiClient.patch("/conversation", {
        id: currentConversation.key,
        pdfMeta: updatedMeta.map((pdf) => ({ id: pdf.id })),
      });
      revalidateConversation();
    } catch (error: any) {
      const msg =
        error.response?.data?.message || error.message || "Failed to delete PDF from conversation";
      alert(msg);
    }
  };

  useEffect(() => {
    setSelectedPDF(null);
  }, [path]);

  if (pdfMeta.length == 0) {
    return (
      <div className="w-full h-full grid place-content-center">
        <Empty
          description={<Typography.Text>No Existing PDF in This Conversation</Typography.Text>}
        >
          <Button type="primary">Upload Now</Button>
        </Empty>
      </div>
    );
  }

  if (selectedPDF === null) {
    return <PDFList pdfMeta={pdfMeta} onSelectPDF={setSelectedPDF} onDeletePDF={handleDeletePDF} />;
  }

  return (
    <PDFViewer
      pdfId={pdfMeta[selectedPDF].id}
      filename={pdfMeta[selectedPDF].filename}
      onBack={() => setSelectedPDF(null)}
      maxWidth={maxWidth}
    />
  );
};

export default ViewPDF;
