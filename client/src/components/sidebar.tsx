import React from "react";
import { Button, Typography } from "antd";
import { Conversations, ConversationsProps } from "@ant-design/x";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { createStyles } from "antd-style";
import { useConversationActions, useConversationValue } from "@/hooks/use-conversation";

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
    width: 24px;
    height: 24px;
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
  conversations: css`
    padding: 0 12px;
    flex: 1;
    overflow-y: auto;
  `,
}));

const menuConfig: ConversationsProps["menu"] = (conversation) => ({
  items: [
    {
      label: "Rename",
      key: "rename",
      icon: <EditOutlined />,
    },
    {
      label: "Delete",
      key: "delete",
      icon: <DeleteOutlined />,
      danger: true,
    },
  ],
  onClick: (menuInfo) => {
    console.log(`Click ${conversation.key} - ${menuInfo.key}`);
  },
});

const Sidebar = () => {
  const { styles } = useStyles();
  const { setCurrentConversation, addConversation } = useConversationActions();
  const { items, currentConversationKey } = useConversationValue();

  const onAddConversation = () => {
    addConversation(`New Conversation ${items.length}`);
  };

  const onConversationClick = (key: string) => setCurrentConversation(key);

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <img src="original.svg" alt="logo" className={styles.logo} />
        <Typography.Text className={styles.title}>Ant Design X</Typography.Text>
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
      <Conversations
        items={items}
        className={styles.conversations}
        activeKey={currentConversationKey}
        menu={menuConfig}
        onActiveChange={onConversationClick}
      />
    </div>
  );
};

export default Sidebar;
