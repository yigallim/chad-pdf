import React, { useCallback } from "react";
import { Card, Checkbox, Typography, Spin } from "antd";
import { Document, Page } from "react-pdf";
import { withPdfPath } from "@/libs/utils";
import { PDFItem } from "./existing-pdf-modal";
import options from "@/libs/pdf-constant";
import ConfirmDeleteButton from "@/components/ui/confirm-delete";

type Props = {
  pdf: PDFItem;
  selected: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  loading: boolean;
};
export default React.memo(function PDFCard({
  pdf,
  selected,
  disabled,
  onToggle,
  onDelete,
  loading,
}: Props) {
  const handleClick = useCallback(
    () => !disabled && onToggle(pdf.id),
    [pdf.id, onToggle, disabled]
  );
  return (
    <Card
      hoverable={!disabled}
      onClick={handleClick}
      className={disabled ? "opacity-50 pointer-events-none" : undefined}
      style={{ width: "calc(33.33% - 12px)", padding: 8 }}
      cover={
        <div style={{ height: 160, position: "relative", background: "#fafafa" }}>
          {loading ? (
            <Spin />
          ) : (
            <Document file={withPdfPath(pdf.id)} loading={<Spin />} options={options}>
              <Page
                pageNumber={1}
                height={150}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          )}
          <Checkbox
            checked={selected}
            disabled={disabled}
            onChange={(e) => {
              e.stopPropagation();
              onToggle(pdf.id);
            }}
            style={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}
          />
        </div>
      }
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Typography.Text ellipsis={{ tooltip: pdf.filename }}>{pdf.filename}</Typography.Text>
        <ConfirmDeleteButton size="small" stopPropagation onConfirm={() => onDelete(pdf.id)} />
      </div>
    </Card>
  );
});
