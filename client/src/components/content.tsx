import React from "react";
import { Bubble, useXAgent, useXChat, Welcome } from "@ant-design/x";
import { createStyles } from "antd-style";
import { type GetProp } from "antd";
import { MessageInfo } from "@ant-design/x/es/use-x-chat";

const useStyles = createStyles(({ css }) => ({
  contentContainer: css`
    width: 100%;
    overflow: auto;
    flex: 1;
  `,
  content: css`
    max-width: 724px;
    margin: 0 auto;
    margin-bottom: 2rem;
    flex: 1;
    padding: 1.5rem;
  `,
}));

interface ContentProps {
  messages: MessageInfo<string>[];
  roles: GetProp<typeof Bubble.List, "roles">;
}

const placeholderNode = (
  <div style={{ marginTop: "2rem" }}>
    <Welcome
      variant="borderless"
      icon={<img alt="icon" src="/fmt.webp" />}
      title="Hello, I'm Ant Design X"
      description="Base on Ant Design, AGI product interface solution, create a better intelligent vision~"
    />
  </div>
);

const Content: React.FC<ContentProps> = ({ messages, roles }) => {
  const { styles } = useStyles();

  const items: GetProp<typeof Bubble.List, "items"> = messages.map(({ id, message, status }) => ({
    key: id,
    loading: status === "loading",
    role: status === "local" ? "local" : "ai",
    content: message,
  }));

  return (
    <div className={styles.contentContainer}>
      <div className={styles.content}>
        <Bubble.List
          items={items.length > 0 ? items : [{ content: placeholderNode, variant: "borderless" }]}
          roles={roles}
        />
      </div>
    </div>
  );
};

export default Content;
