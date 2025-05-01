import { Card, Row, Col, Button, Typography, Spin } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { Document, Page } from "react-pdf";
import { PDFMeta } from "@/store/slices/conversation-slice";
import { withPdfPath } from "@/libs/utils";
import options from "@/libs/pdf-constant";

type PDFListProps = {
  pdfMeta: PDFMeta[];
  onSelectPDF: (index: number) => void;
  onDeletePDF: (pdfId: string) => void;
};

const PDFList = ({ pdfMeta, onSelectPDF, onDeletePDF }: PDFListProps) => {
  return (
    <div className="p-8 pt-20 h-full overflow-auto">
      <Row gutter={[24, 24]}>
        {pdfMeta.map((pdf, idx) => (
          <Col key={pdf.id} span={24} lg={12} xxl={8}>
            <Card
              size="small"
              hoverable
              onClick={() => onSelectPDF(idx)}
              style={{ cursor: "pointer", width: "100%" }}
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
                <Typography.Text>{pdf.filename}</Typography.Text>
                <Button
                  danger
                  type="dashed"
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePDF(pdf.id);
                  }}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default PDFList;
