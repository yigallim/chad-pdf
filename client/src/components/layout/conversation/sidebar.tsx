import { useEffect, useState } from "react";
import { PlusOutlined, MoreOutlined, FilePdfOutlined } from "@ant-design/icons";
import { App, Button, Typography, Dropdown, MenuProps, Input, Divider } from "antd";
import { createStyles } from "antd-style";
import { useConversationActions, useConversationValue } from "@/hooks/use-conversation";
import UploadPDFModal from "../pdf/upload-pdf-modal";
import ExistingPDFModal from "../pdf/existing-pdf-modal";
import apiClient from "@/service/api";
import { Conversation } from "@/store/slices/conversation-slice";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/libs/utils";

type PDFItem = {
  id: string;
  filename: string;
};

const useStyles = createStyles(({ css }) => ({
  sidebar: css`
    background-color: rgba(200, 200, 200, 0.2);
    width: 280px;
    height: 100%;
    display: flex;
    flex-direction: column;
  `,
  header: css`
    display: flex;
    align-items: center;
    height: 72px;
    padding: 0 24px;
  `,
  logo: css`
    width: 36px;
    height: 36px;
    display: inline-block;
  `,
  title: css`
    font-weight: 600;
    font-size: 16px;
    margin-left: 8px;
  `,
  button: css`
    width: calc(100% - 24px);
    margin: 0 12px 16px;
  `,
}));

const SideBar = () => {
  const navigate = useNavigate();
  let { pathname } = useLocation();
  let path = pathname.slice(1);
  const { message } = App.useApp();
  const { styles } = useStyles();
  const { revalidateConversation } = useConversationActions();
  const { items, loading } = useConversationValue();
  const [existingPDFModalOpen, setExistingPDFModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  const onAddConversation = () => {
    setExistingPDFModalOpen(true);
  };

  const handleUploadNewPDF = () => {
    setExistingPDFModalOpen(false);
    setUploadModalOpen(true);
  };

  const handleUploadModalOk = () => {
    setUploadModalOpen(false);
    setExistingPDFModalOpen(true);
  };

  const handleUploadModalCancel = () => {
    setUploadModalOpen(false);
    setExistingPDFModalOpen(true);
  };

  const handleExistingPDFModalOk = async (selectedPDFs: PDFItem[], conversationName?: string) => {
    if (selectedPDFs.length <= 0) return;

    try {
      const { data } = await apiClient.post("/conversation", {
        label: conversationName,
        pdfMeta: selectedPDFs.map((pdf) => ({
          id: pdf.id,
        })),
      });
      setExistingPDFModalOpen(false);
      navigate("/" + data.id);
      message.success("Conversation renamed");
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Failed to create conversation";
      message.error(msg);
    } finally {
      revalidateConversation();
    }
  };

  const handleExistingPDFModalCancel = () => {
    setExistingPDFModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete("/conversation", { data: { id } });
      message.success("Conversation deleted");
      navigate("/");
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Failed to delete conversation";
      message.error(msg);
    } finally {
      revalidateConversation();
    }
  };

  const handleRename = (conv: Conversation) => {
    setEditingId(conv.key);
    setEditingValue(conv.label);
  };

  const finishRename = async () => {
    if (!editingId) return;

    const newLabel = editingValue.trim();
    const original = items.find((item) => item.key === editingId);
    if (!newLabel || newLabel === original?.label) {
      setEditingId(null);
      setEditingValue("");
      return;
    }

    try {
      await apiClient.patch("/conversation", { id: editingId, label: newLabel });
      message.success("Conversation renamed");
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Failed to rename";
      message.error(msg);
    } finally {
      setEditingId(null);
      setEditingValue("");
      revalidateConversation();
    }
  };

  useEffect(() => {
    revalidateConversation();
  }, []);

  useEffect(() => {
    const conversationExist = items.find((item) => item.key === path);
    if (!conversationExist && !loading) navigate("/");
  }, [pathname, loading]);

  return (
    <nav className="min-w-[260px] w-[260px] h-full bg-neutral-50">
      <div className={styles.header}>
        <img src="logo.png" alt="logo" className={styles.logo} />
        <Typography.Text className={styles.title}>Chad PDF</Typography.Text>
      </div>
      <Button
        color="primary"
        variant="outlined"
        onClick={onAddConversation}
        className={styles.button}
        icon={<PlusOutlined />}
      >
        New Conversation
      </Button>
      <div className="overflow-y-auto flex-1 px-3">
        {items.length === 0 ? (
          <div className="mt-6 text-center">
            <Typography.Text type="secondary">No conversations yet.</Typography.Text>
          </div>
        ) : (
          items.map((conv) => {
            const dropdownItems: MenuProps["items"] = [
              {
                key: "rename",
                label: "Rename",
                onClick: () => handleRename(conv),
              },
              {
                key: "delete",
                label: "Delete",
                danger: true,
                onClick: () => handleDelete(conv.key),
              },
            ];

            return (
              <Link
                to={conv.key}
                key={conv.key}
                className={cn(
                  conv.key === path ? "bg-neutral-200!" : "hover:bg-neutral-100!",
                  "relative mb-1 py-1.5 pl-4 pr-1 rounded-lg cursor-pointer transition-all! duration-300! flex justify-between items-end"
                )}
              >
                <div className="w-full">
                  {editingId === conv.key ? (
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onPressEnter={finishRename}
                      onBlur={finishRename}
                      autoFocus
                      size="small"
                      className="text-[15px] font-medium"
                    />
                  ) : (
                    <Typography.Text
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                        maxWidth: "190px",
                      }}
                      className="font-medium text-[15px]!"
                    >
                      {conv.label}
                    </Typography.Text>
                  )}
                  <Typography.Text
                    type={conv.pdfMeta.length == 0 ? "danger" : "secondary"}
                    className="text-[13px]!"
                  >
                    <FilePdfOutlined className="mr-1" />
                    {conv.pdfMeta.length}
                  </Typography.Text>
                  <Divider type="vertical" style={{}} />
                  <Typography.Text type="secondary" className="text-[13px]!">
                    {new Date(conv.createdAt * 1000).toLocaleString()}
                  </Typography.Text>
                </div>
                <Dropdown menu={{ items: dropdownItems }} trigger={["click"]}>
                  <Button
                    type="text"
                    icon={<MoreOutlined className="text-gray-500 hover:text-black mt-1" />}
                  />
                </Dropdown>
              </Link>
            );
          })
        )}
      </div>
      <ExistingPDFModal
        open={existingPDFModalOpen}
        onOk={handleExistingPDFModalOk}
        onCancel={handleExistingPDFModalCancel}
        onUploadNew={handleUploadNewPDF}
      />
      <UploadPDFModal
        open={uploadModalOpen}
        onOk={handleUploadModalOk}
        onCancel={handleUploadModalCancel}
      />
    </nav>
  );
};

export default SideBar;
