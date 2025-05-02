import { useState, useEffect } from "react";
import {
  Modal,
  Typography,
  Button,
  Checkbox,
  Spin,
  Input,
  Form,
  App,
  Card,
  CheckboxChangeEvent,
} from "antd";
import { Document, Page } from "react-pdf";
import { cn, withPdfPath } from "@/libs/utils";
import options from "@/libs/pdf-constant";
import apiClient from "@/service/api";
import ConfirmDeleteButton from "@/components/ui/confirm-delete";

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

export default function ExistingPDFModal({
  open,
  onOk,
  onCancel,
  onUploadNew,
  disabledPDFIds = [],
  mode = "create",
}: ExistingPDFModalProps) {
  const isCreateMode = mode == "create";
  const { message } = App.useApp();
  const [form] = Form.useForm<{ selectedPDFIds: string[]; conversationName: string }>();
  const [loading, setLoading] = useState(false);
  const [pdfs, setPDFs] = useState<PDFItem[]>([]);

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

  const selectedPDFIds = Form.useWatch("selectedPDFIds", form) || [];
  const indeterminate = selectedPDFIds.length > 0 && selectedPDFIds.length < pdfs.length;
  const checkAll = pdfs.length > 0 && selectedPDFIds.length === pdfs.length;

  const onCheckAllChange = (e: CheckboxChangeEvent) => {
    form.setFieldValue("selectedPDFIds", e.target.checked ? pdfs.map((pdf) => pdf.id) : []);
  };

  const togglePDFSelection = (id: string) => {
    const current: string[] = form.getFieldValue("selectedPDFIds") || [];
    const next = current.includes(id) ? current.filter((pid) => pid !== id) : [...current, id];
    form.setFieldValue("selectedPDFIds", next);
  };

  const handleFinish = ({
    selectedPDFIds,
    conversationName,
  }: {
    selectedPDFIds: string[];
    conversationName: string;
  }) => {
    const selected = pdfs.filter((pdf) => selectedPDFIds.includes(pdf.id));
    if (isCreateMode) {
      onOk(selected, conversationName.trim());
    } else {
      onOk(selected);
    }
    form.resetFields();
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const handleDeletePDF = async (id: string) => {
    try {
      await apiClient.delete("/pdf", { data: { id } });
      setPDFs((prev) => prev.filter((p) => p.id !== id));
      form.setFieldValue(
        "selectedPDFIds",
        (form.getFieldValue("selectedPDFIds") as string[]).filter((pid) => pid !== id)
      );
      message.success("PDF deleted");
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Failed to delete PDF";
      message.error(msg);
    }
  };

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
        <Button key="submit" type="primary" htmlType="submit" form="existingPdfForm">
          {isCreateMode ? "Create Conversation" : "Update Conversation"}
        </Button>,
      ]}
    >
      <Form
        form={form}
        id="existingPdfForm"
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ conversationName: "", selectedPDFIds: [] }}
      >
        {isCreateMode && (
          <Form.Item
            name="conversationName"
            label="Conversation Name:"
            rules={[
              { required: true, message: "Please enter a conversation name" },
              { min: 1, max: 30, message: "Name must be 1-30 characters" },
            ]}
          >
            <Input placeholder="Eg. NLP Research" maxLength={30} allowClear />
          </Form.Item>
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
              disabled={pdfs.length === 0}
            >
              Select All
            </Checkbox>
          </div>
          <Form.Item
            name="selectedPDFIds"
            rules={[
              {
                validator: (_, val) =>
                  val && val.length > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error("Select at least one PDF")),
              },
            ]}
          >
            <div>
              <div className="max-h-[380px] overflow-y-auto border border-neutral-200 rounded-md p-2">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Spin />
                  </div>
                ) : pdfs.length === 0 ? (
                  <Typography.Text type="secondary" className="block text-center py-4">
                    No PDFs available. Please upload a new PDF.
                  </Typography.Text>
                ) : (
                  <div className="flex flex-wrap gap-3 p-2">
                    {pdfs.map((pdf) => {
                      const disabled = disabledPDFIds.includes(pdf.id);
                      return (
                        <div
                          key={pdf.id}
                          className="w-1/3 max-w-1/3"
                          style={{ width: "calc(33.33% - 12px)" }}
                        >
                          <Card
                            hoverable={!disabled}
                            onClick={() => !disabled && togglePDFSelection(pdf.id)}
                            className={cn(
                              "overflow-hidden",
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
                )}
              </div>
              <div className="mt-2">
                <Typography.Text type="secondary">
                  Selected: {selectedPDFIds.length} of {pdfs.length} PDFs
                </Typography.Text>
              </div>
            </div>
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
