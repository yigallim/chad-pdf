import { Button, Space, Tooltip, Typography, InputNumber } from "antd";
import { ZoomInOutlined, ZoomOutOutlined, UndoOutlined } from "@ant-design/icons";

type PDFControlsProps = {
  filename: string;
  currentPage: number;
  numPages: number;
  scale: number;
  onPageChange: (value: number | null) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
};

const PDFControls = ({
  filename,
  currentPage,
  numPages,
  scale,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: PDFControlsProps) => {
  return (
    <div className="flex justify-between items-center px-6 py-2 border-neutral-300 border-t relative shadow z-10">
      <Typography.Title
        level={5}
        style={{
          maxWidth: "40%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          margin: 0,
        }}
      >
        {filename}
      </Typography.Title>
      <div className="flex items-center">
        <Typography.Text className="mr-2">Page:</Typography.Text>
        <InputNumber
          min={1}
          max={numPages}
          value={currentPage}
          onChange={onPageChange}
          disabled={numPages === 0}
          style={{ width: 80 }}
        />
        <Typography.Text className="ml-2">/ {numPages}</Typography.Text>
      </div>
      <div className="flex flex-col items-center">
        <Typography.Text type="secondary">Zoom: {Math.round(scale * 100)}%</Typography.Text>
        <Space.Compact>
          <Tooltip title="Zoom Out (-25%)">
            <Button icon={<ZoomOutOutlined />} onClick={onZoomOut} disabled={scale <= 0.75} />
          </Tooltip>
          <Tooltip title="Reset Zoom (100%)">
            <Button icon={<UndoOutlined />} onClick={onResetZoom} disabled={scale === 1} />
          </Tooltip>
          <Tooltip title="Zoom In (+25%)">
            <Button icon={<ZoomInOutlined />} onClick={onZoomIn} disabled={scale >= 1.5} />
          </Tooltip>
        </Space.Compact>
      </div>
    </div>
  );
};

export default PDFControls;