import React from "react";
import { Button, Select } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { createStyles } from "antd-style";

const useStyles = createStyles(({ css }) => ({
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background-color: white;
  `,
  select: css`
    min-width: 160px;
    border: none;
  `,
  button: css`
    font-size: 18px;
    border: none;
    background: transparent;
    cursor: pointer;

    &:hover {
      color: #1890ff;
    }
  `,
}));

const Header: React.FC = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.header}>
      <Select
        variant="borderless"
        defaultValue="1"
        className={styles.select}
        size="large"
        onChange={() => {}}
        options={[
          { value: "1", label: "DeepSeek V3" },
          { value: "2", label: "GPT-4o" },
          { value: "3", label: "Gemini 2.0 Flash" },
          { value: "4", label: "Claude 3.5 Haiku" },
        ]}
      />
      <Button size="large" className={styles.button} icon={<SettingOutlined />} />
    </div>
  );
};

export default Header;
