import { Card, Row, Col, Typography, Spin, Button } from "antd";
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
};

const PDFList = ({ pdfMeta, onSelectPDF, onDeletePDF, onAddPDF }: PDFListProps) => {
  return (
    <div className="p-8 pt-20 h-full overflow-auto">
      <Row gutter={[24, 24]}>
        {pdfMeta.map((pdf, idx) => (
          <Col key={pdf.id} span={24} lg={12} xxl={8}>
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
                  }}
                >
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
          </Col>
        ))}
        <Col key="add-pdf" span={24} lg={12} xxl={8}>
          <Button
            color="primary"
            variant="dashed"
            onClick={onAddPDF}
            className="flex flex-col items-center justify-center w-full bg-indigo-50!"
            style={{
              height: 200 + 48,
            }}
          >
            <PlusOutlined style={{ fontSize: 32 }} />
            Add PDF
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default PDFList;
