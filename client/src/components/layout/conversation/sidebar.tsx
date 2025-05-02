import { useEffect, useMemo, useState } from "react";
import {
  PlusOutlined,
  MoreOutlined,
  FilePdfOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { App, Button, Typography, Dropdown, MenuProps, Input, Divider } from "antd";
import { createStyles } from "antd-style";
import { useConversationActions, useConversationValue } from "@/hooks/use-conversation";
import apiClient from "@/service/api";
import { Conversation } from "@/store/slices/conversation-slice";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/libs/utils";
import NewConversation from "./new-conversation";

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
}));

const SideBar = () => {
  const navigate = useNavigate();
  let { pathname } = useLocation();
  let path = pathname.slice(1);
  const { message } = App.useApp();
  const { styles } = useStyles();
  const { revalidateConversation } = useConversationActions();
  const { items, loading } = useConversationValue();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

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

  const memoNewConversationButton = useMemo(
    () => (
      <Button className="w-full" color="primary" variant="outlined" icon={<PlusOutlined />}>
        New Conversation
      </Button>
    ),
    []
  );

  return (
    <nav className="min-w-[260px] w-[260px] h-full flex flex-col bg-neutral-50">
      <Link to="/" className={styles.header}>
        <img src="logo.png" alt="logo" className={styles.logo} />
        <Typography.Text className={styles.title}>Chad PDF</Typography.Text>
      </Link>

      <NewConversation className="px-3 mb-4">{memoNewConversationButton}</NewConversation>

      <div className="overflow-y-auto flex-1 px-3 mb-12">
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
                icon: <EditOutlined />,
                onClick: () => handleRename(conv),
              },
              {
                key: "delete",
                label: "Delete",
                danger: true,
                icon: <DeleteOutlined />,
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
                  <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
              </Link>
            );
          })
        )}
      </div>
    </nav>
  );
};

export default SideBar;
