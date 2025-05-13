import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useConversationActions, useConversationValue } from "@/hooks/use-conversation";
import apiClient from "@/service/api";
import PDFList from "./pdf-list";
import PDFViewer from "./pdf-viewer";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { App, Button, Empty, Typography } from "antd";
import ExistingPDFModal from "@/components/layout/pdf/existing-pdf-modal";
import UploadPDFModal from "@/components/layout/pdf/upload-pdf-modal";
import { PDFMeta } from "@/store/slices/conversation-slice";
import PubSub from "pubsub-js";

const maxWidth = 800;

const ViewPDF = () => {
  let { pathname } = useLocation();
  let path = pathname.slice(1);
  const { message } = App.useApp();
  const { items } = useConversationValue();
  const { revalidateConversation } = useConversationActions();
  const [selectedPDF, setSelectedPDF] = useState<number | null>(null);
  const [targetPage, setTargetPage] = useState<number | null>(null);
  const [addPDFModalOpen, setAddPDFModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const currentConversation = items.find((item) => item.id === path);
  const pdfMeta = currentConversation == undefined ? [] : currentConversation.pdfMeta;

  const handleDeletePDF = async (pdfId: string) => {
    if (!currentConversation) return;
    const updatedMeta = currentConversation.pdfMeta.filter((pdf) => pdf.id !== pdfId);
    try {
      await apiClient.patch("/conversation", {
        id: currentConversation.id,
        pdfMeta: updatedMeta.map((pdf) => ({ id: pdf.id })),
      });
      message.success("PDF removed from conversation");
    } catch (error: any) {
      const msg =
        error.response?.data?.error || error.message || "Failed to delete PDF from conversation";
      message.error(msg);
    } finally {
      revalidateConversation();
    }
  };

  const handleAddPDFs = async (selectedPDFs: PDFMeta[]) => {
    if (!currentConversation) return;
    const newPDFs = selectedPDFs.filter(
      (pdf) => !currentConversation.pdfMeta.some((meta) => meta.id === pdf.id)
    );
    if (newPDFs.length === 0) {
      setAddPDFModalOpen(false);
      return;
    }
    try {
      await apiClient.patch("/conversation", {
        id: currentConversation.id,
        pdfMeta: [
          ...currentConversation.pdfMeta.map((pdf) => ({ id: pdf.id })),
          ...newPDFs.map((pdf) => ({ id: pdf.id })),
        ],
      });
      setAddPDFModalOpen(false);
      message.success(
        `${newPDFs.length} PDF${newPDFs.length > 1 ? "s" : ""} added to conversation`
      );
    } catch (error: any) {
      const msg =
        error.response?.data?.error || error.message || "Failed to add PDF to conversation";
      message.error(msg);
    } finally {
      revalidateConversation();
    }
  };

  const handleUploadNewPDF = () => {
    setAddPDFModalOpen(false);
    setUploadModalOpen(true);
  };

  const handleUploadModalOk = () => {
    setUploadModalOpen(false);
    setAddPDFModalOpen(true);
  };

  const handleUploadModalCancel = () => {
    setUploadModalOpen(false);
    setAddPDFModalOpen(true);
  };

  useEffect(() => {
    const token = PubSub.subscribe(
      "NAVIGATE_TO_PDF",
      (_, data: { pdfId: string; pageNumber: number }) => {
        const pdfIndex = pdfMeta.findIndex((pdf) => pdf.id === data.pdfId);
        if (pdfIndex !== -1) {
          setSelectedPDF(pdfIndex);
          setTargetPage(data.pageNumber);
        } else {
          message.warning(`PDF with ID ${data.pdfId} not found in this conversation.`);
        }
      }
    );
    return () => {
      PubSub.unsubscribe(token);
    };
  }, [pdfMeta, message]);
  useEffect(() => {
    if (selectedPDF === null) {
      setTargetPage(null);
    }
  }, [selectedPDF]);

  useEffect(() => {
    if (selectedPDF !== null && (selectedPDF < 0 || selectedPDF >= pdfMeta.length)) {
      setSelectedPDF(null);
    }
  }, [pdfMeta, selectedPDF]);

  if (pdfMeta.length == 0) {
    return (
      <div className="w-full h-full grid place-content-center">
        <Empty
          description={<Typography.Text>No Existing PDF in This Conversation</Typography.Text>}
        >
          <Button type="primary" onClick={() => setAddPDFModalOpen(true)}>
            Add PDF
          </Button>
          <ExistingPDFModal
            open={addPDFModalOpen}
            onOk={handleAddPDFs}
            onCancel={() => setAddPDFModalOpen(false)}
            onUploadNew={handleUploadNewPDF}
            disabledPDFIds={pdfMeta.map((pdf) => pdf.id)}
            mode="add"
          />
          <UploadPDFModal
            open={uploadModalOpen}
            onOk={handleUploadModalOk}
            onCancel={handleUploadModalCancel}
          />
        </Empty>
      </div>
    );
  }

  if (selectedPDF === null) {
    const pdfCount = pdfMeta.length;
    const totalWords = pdfMeta.reduce(
      (sum, pdf) => sum + (pdf.word_count > 0 ? pdf.word_count : 0),
      0
    );
    return (
      <>
        <PDFList
          pdfMeta={pdfMeta}
          onSelectPDF={setSelectedPDF}
          onDeletePDF={handleDeletePDF}
          onAddPDF={() => setAddPDFModalOpen(true)}
          pdfCount={pdfCount}
          totalWords={totalWords}
        />
        <ExistingPDFModal
          open={addPDFModalOpen}
          onOk={handleAddPDFs}
          onCancel={() => setAddPDFModalOpen(false)}
          onUploadNew={handleUploadNewPDF}
          disabledPDFIds={pdfMeta.map((pdf) => pdf.id)}
          mode="add"
          pdfMeta={pdfMeta}
        />
        <UploadPDFModal
          open={uploadModalOpen}
          onOk={handleUploadModalOk}
          onCancel={handleUploadModalCancel}
        />
      </>
    );
  }

  if (selectedPDF !== null && selectedPDF >= 0 && selectedPDF < pdfMeta.length) {
    return (
      <PDFViewer
        pdfId={pdfMeta[selectedPDF].id}
        filename={pdfMeta[selectedPDF].filename}
        onBack={() => setSelectedPDF(null)}
        maxWidth={maxWidth}
        initialPage={targetPage}
        onPageNavigated={() => setTargetPage(null)}
      />
    );
  }

  return null;
};

export default ViewPDF;
