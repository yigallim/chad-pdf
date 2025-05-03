import { Card, Typography, Spin, Button, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Document, Page } from "react-pdf";
import { PDFMeta } from "@/store/slices/conversation-slice";
import { withPdfPath } from "@/libs/utils";
import options from "@/libs/pdf-constant";
import ConfirmDeleteButton from "@/components/ui/confirm-delete";

type PDFListProps = {
  pdfMeta: PDFMeta[];
  onSelectPDF: (index: number) => void;
  onDeletePDF: (pdfId: string) => void;
  onAddPDF: () => void;
  pdfCount: number;
  totalWords: number;
};

const PDFList = ({
  pdfMeta,
  onSelectPDF,
  onDeletePDF,
  onAddPDF,
  pdfCount,
  totalWords,
}: PDFListProps) => {
  return (
    <div className="p-8 pt-20 h-full overflow-auto">
      <div style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">
          PDFs: {pdfCount} | Total words: {totalWords}
        </Typography.Text>
      </div>
      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        }}
      >
        {pdfMeta.map((pdf, idx) => (
          <div key={pdf.id}>
            <Card
              hoverable
              className="overflow-hidden"
              onClick={() => onSelectPDF(idx)}
              style={{ cursor: "pointer", width: "100%" }}
              styles={{
                body: {
                  padding: "8px 16px",
                },
              }}
              cover={
                <div
                  style={{
                    height: 200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#fafafa",
                    position: "relative",
                  }}
                >
                  {pdf.word_count === -1 ? (
                    <Tag
                      className="absolute! top-2 left-2 z-10"
                      color="default"
                      style={{ opacity: 0.7 }}
                    >
                      Processing...
                    </Tag>
                  ) : (
                    <Tag className="absolute! top-2 left-2 z-10" color="blue">
                      {pdf.word_count} words
                    </Tag>
                  )}
                  <Document
                    file={withPdfPath(pdf.id)}
                    loading={<Spin size="large" />}
                    options={options}
                  >
                    <Page
                      pageNumber={1}
                      height={180}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                </div>
              }
            >
              <div className="flex justify-between items-center">
                <Typography.Text className="truncate block">{pdf.filename}</Typography.Text>
                <ConfirmDeleteButton onConfirm={() => onDeletePDF(pdf.id)} stopPropagation />
              </div>
            </Card>
          </div>
        ))}
        <div key="add-pdf">
          <Button
            color="primary"
            variant="dashed"
            onClick={onAddPDF}
            className="flex flex-col items-center justify-center w-full bg-neutral-50!"
            style={{
              height: 200 + 48,
            }}
          >
            <PlusOutlined style={{ fontSize: 32 }} />
            Add PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PDFList;
