import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Typography,
  Button,
  Checkbox,
  Spin,
  Input,
  App,
  Card,
  CheckboxChangeEvent,
  Pagination,
} from "antd";
import { Document, Page } from "react-pdf";
import { cn, withPdfPath } from "@/libs/utils";
import options from "@/libs/pdf-constant";
import apiClient from "@/service/api";
import ConfirmDeleteButton from "@/components/ui/confirm-delete";
import { useConversationActions } from "@/hooks/use-conversation";

export type PDFItem = {
  id: string;
  filename: string;
};

type ExistingPDFModalProps = {
  open: boolean;
  onOk: (selectedPDFs: PDFItem[], conversationName?: string) => Promise<void>;
  onCancel: () => void;
  onUploadNew: () => void;
  disabledPDFIds?: string[];
  mode?: "create" | "add";
};

export default React.memo(function ExistingPDFModal({
  open,
  onOk,
  onCancel,
  onUploadNew,
  disabledPDFIds = [],
  mode = "create",
}: ExistingPDFModalProps) {
  const isCreateMode = mode === "create";
  const { message } = App.useApp();
  const [selectedPDFIds, setSelectedPDFIds] = useState<string[]>([]);
  const [conversationName, setConversationName] = useState("");
  const [nameError, setNameError] = useState("");
  const [selectionError, setSelectionError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pdfs, setPDFs] = useState<PDFItem[]>([]);
  const { revalidateConversation } = useConversationActions();

  const selectablePdfs = pdfs.filter((pdf) => !disabledPDFIds.includes(pdf.id));

  const pageSize = 6;
  const totalItems = pdfs.length;
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return pdfs.slice(startIndex, endIndex);
  };

  const currentPageItems = getCurrentPageItems();

  const fetchPDFs = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<PDFItem[]>("/pdf");
      setPDFs(data);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to fetch PDFs";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPDFs();
    }
  }, [open]);

  const validateForm = useCallback(() => {
    let isValid = true;

    if (isCreateMode) {
      const trimmedName = conversationName.trim();
      if (!trimmedName) {
        setNameError("Please enter a conversation name");
        isValid = false;
      } else if (trimmedName.length < 1 || trimmedName.length > 30) {
        setNameError("Name must be 1-30 characters");
        isValid = false;
      } else {
        setNameError("");
      }
    }

    if (selectedPDFIds.length === 0) {
      setSelectionError("Select at least one PDF");
      isValid = false;
    } else {
      setSelectionError("");
    }

    return isValid;
  }, [conversationName, selectedPDFIds, isCreateMode]);

  const indeterminate = selectedPDFIds.length > 0 && selectedPDFIds.length < selectablePdfs.length;
  const checkAll = selectablePdfs.length > 0 && selectedPDFIds.length === selectablePdfs.length;

  const onCheckAllChange = (e: CheckboxChangeEvent) => {
    setSelectedPDFIds(e.target.checked ? selectablePdfs.map((pdf) => pdf.id) : []);
  };

  const togglePDFSelection = (id: string) => {
    setSelectedPDFIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const selected = pdfs.filter((pdf) => selectedPDFIds.includes(pdf.id));
    if (isCreateMode) {
      onOk(selected, conversationName.trim());
    } else {
      onOk(selected);
    }
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const resetForm = () => {
    setSelectedPDFIds([]);
    setConversationName("");
    setNameError("");
    setSelectionError("");
  };

  const handleDeletePDF = async (id: string) => {
    try {
      await apiClient.delete("/pdf", { data: { id } });
      setPDFs((prev) => prev.filter((p) => p.id !== id));
      setSelectedPDFIds((prev) => prev.filter((pid) => pid !== id));
      message.success("PDF deleted");
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Failed to delete PDF";
      message.error(msg);
    } finally {
      revalidateConversation();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    if (open) {
      setCurrentPage(1);
    }
  }, [open]);

  return (
    <Modal
      centered
      title={isCreateMode ? "Select PDFs to Start Conversation" : "Add PDFs to Conversation"}
      open={open}
      onCancel={handleCancel}
      destroyOnClose
      style={{ minWidth: 800 }}
      width={800}
      footer={[
        <Button key="upload" onClick={onUploadNew}>
          Upload New PDF
        </Button>,
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          {isCreateMode ? "Create Conversation" : "Update Conversation"}
        </Button>,
      ]}
    >
      <div id="customPdfForm">
        {isCreateMode && (
          <div className="mb-4">
            <label className="block mb-1 font-medium">Conversation Name:</label>
            <Input
              value={conversationName}
              onChange={(e) => {
                setConversationName(e.target.value);
                if (nameError) validateForm();
              }}
              placeholder="Eg. NLP Research"
              maxLength={30}
              allowClear
              status={nameError ? "error" : ""}
            />
            {nameError && (
              <Typography.Text type="danger" className="mt-1 text-xs block">
                {nameError}
              </Typography.Text>
            )}
          </div>
        )}
        <div className="mb-2">
          <div className="flex justify-between items-center mb-2">
            <Typography.Title level={5} className="mb-0">
              Available PDFs:
            </Typography.Title>
            <Checkbox
              indeterminate={indeterminate}
              onChange={onCheckAllChange}
              checked={checkAll}
              disabled={selectablePdfs.length === 0}
            >
              Select All
            </Checkbox>
          </div>
          <div>
            <div className="border border-neutral-200 rounded-md p-2 h-[468px]">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Spin />
                </div>
              ) : pdfs.length === 0 ? (
                <Typography.Text type="secondary" className="block text-center py-4">
                  No PDFs available. Please upload a new PDF.
                </Typography.Text>
              ) : (
                <div className="flex flex-col justify-between h-full">
                  <div className="flex flex-wrap p-2">
                    {currentPageItems.map((pdf) => {
                      const disabled = disabledPDFIds.includes(pdf.id);
                      return (
                        <div
                          key={pdf.id}
                          className="w-1/3 max-w-1/3"
                          style={{ width: "calc(33.33%)" }}
                        >
                          <Card
                            onClick={() => !disabled && togglePDFSelection(pdf.id)}
                            className={cn(
                              "overflow-hidden cursor-pointer",
                              disabled && "opacity-50 pointer-events-none"
                            )}
                            styles={{ body: { padding: "8px 16px" } }}
                            cover={
                              <div
                                style={{
                                  height: 160,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: "#fafafa",
                                }}
                              >
                                <Document
                                  file={withPdfPath(pdf.id)}
                                  options={options}
                                  loading={<Spin />}
                                  error={
                                    <Typography.Text type="danger">
                                      Failed to load PDF
                                    </Typography.Text>
                                  }
                                >
                                  <Page
                                    pageNumber={1}
                                    height={150}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                  />
                                </Document>
                                <Checkbox
                                  className="absolute top-2 right-2 z-10"
                                  checked={selectedPDFIds.includes(pdf.id)}
                                  disabled={disabled}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    if (!disabled) togglePDFSelection(pdf.id);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            }
                          >
                            <div className="flex justify-between items-center">
                              <Typography.Text className="truncate block" title={pdf.filename}>
                                {pdf.filename}
                              </Typography.Text>
                              <ConfirmDeleteButton
                                size="small"
                                stopPropagation
                                onConfirm={() => handleDeletePDF(pdf.id)}
                              />
                            </div>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center">
                    <Pagination
                      current={currentPage}
                      total={totalItems}
                      pageSize={pageSize}
                      onChange={handlePageChange}
                      hideOnSinglePage
                      showQuickJumper
                      showSizeChanger={false}
                    />
                  </div>
                </div>
              )}
            </div>
            {selectionError && (
              <Typography.Text type="danger" className="mt-1 text-xs block">
                {selectionError}
              </Typography.Text>
            )}
            <div className="mt-2">
              <Typography.Text type="secondary">
                Selected: {selectedPDFIds.length} of {pdfs.length} PDFs
                {disabledPDFIds.length > 0 &&
                  ` (${disabledPDFIds.length} PDFs already in conversation)`}
              </Typography.Text>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
});
