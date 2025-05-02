import { BASE_API_URL } from "@/service/api";
import { InboxOutlined, DeleteOutlined, PaperClipOutlined } from "@ant-design/icons";
import { Modal, Upload, Typography, Button, App, theme } from "antd";
import type { UploadFile } from "antd";
import { useEffect, useState } from "react";

type UploadPDFModalProps = {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
};

const { Dragger } = Upload;

const UploadPDFModal = ({ open, onOk, onCancel }: UploadPDFModalProps) => {
  const { message } = App.useApp();
  const { useToken } = theme;
  const { token } = useToken();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const uploadProps = {
    accept: ".pdf",
    name: "file",
    multiple: true,
    action: BASE_API_URL + "/pdf",
    onChange(info: { file: UploadFile; fileList: UploadFile[] }) {
      const { status, response, uid, name } = info.file;

      if (status === "uploading") {
        setFileList(info.fileList);
      } else if (status === "done") {
        if (response?.existed) {
          message.warning(`${name} already exists and was not added again.`);
          setFileList((prev) => prev.filter((file) => file.uid !== uid));
        } else {
          message.success(`${name} uploaded successfully.`);
          setFileList(info.fileList);
        }
      } else if (status === "error") {
        message.error(`${name} upload failed.`);
        setFileList(info.fileList);
      }
    },
    showUploadList: false,
    fileList,
  };

  const handleDeleteFile = (uid: string) => {
    setFileList(fileList.filter((file) => file.uid !== uid));
  };

  const uploadedCount = fileList.filter((f) => f.status === "done").length;

  useEffect(() => {
    if (fileList.length !== 0) setFileList([]);
  }, [open]);

  return (
    <Modal
      centered
      title="Upload New PDF"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      destroyOnClose
      width={600}
      okText="Done"
      cancelText="Cancel"
      okButtonProps={{ disabled: uploadedCount === 0 }}
    >
      <div className="py-4 space-y-4">
        <Dragger {...uploadProps}>
          <div className="my-6">
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag PDF file to this area to upload</p>
            <p className="ant-upload-hint">
              Support for single or bulk upload. Strictly prohibited from uploading sensitive data.
            </p>
          </div>
        </Dragger>

        {fileList.length > 0 && (
          <div className="mt-4">
            <Typography.Title level={5}>Uploaded PDFs:</Typography.Title>
            <ul className="list-inside max-h-[300px] overflow-auto p-2 border-neutral-200 border rounded-xl">
              {fileList
                .filter((file) => file.status === "done" || file.status === "error")
                .map((file) => {
                  const isSuccess = file.status === "done";
                  const isError = file.status === "error";
                  const iconColor = isSuccess
                    ? token.colorSuccess
                    : isError
                    ? token.colorError
                    : undefined;
                  return (
                    <li className="flex items-center" key={file.uid}>
                      <PaperClipOutlined className="mr-2" style={{ color: iconColor }} />
                      <Typography.Text
                        type={isSuccess ? "success" : isError ? "danger" : undefined}
                      >
                        {file.name}
                      </Typography.Text>
                      <Button
                        type="text"
                        className="ml-auto"
                        icon={<DeleteOutlined style={{ color: iconColor }} />}
                        onClick={() => handleDeleteFile(file.uid)}
                      />
                    </li>
                  );
                })}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UploadPDFModal;
