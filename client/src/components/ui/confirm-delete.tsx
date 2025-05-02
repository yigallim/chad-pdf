import React from "react";
import { Button, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { ButtonProps } from "antd";

export interface ConfirmDeleteButtonProps extends Omit<ButtonProps, "onClick"> {
  onConfirm: () => void;
  confirmTitle?: React.ReactNode;
  confirmDescription?: React.ReactNode;
  stopPropagation?: boolean;
}

const ConfirmDeleteButton: React.FC<ConfirmDeleteButtonProps> = ({
  onConfirm,
  confirmTitle = "Delete",
  confirmDescription = "Are you sure you want to delete this item?",
  stopPropagation = false,
  icon = <DeleteOutlined />,
  danger = true,
  type = "text",
  ...rest
}) => {
  const handleTriggerClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (stopPropagation) {
      e.stopPropagation();
      (e.nativeEvent as any).stopImmediatePropagation?.();
    }
  };

  const handleConfirm = (e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    (e?.nativeEvent as any)?.stopImmediatePropagation?.();
    onConfirm();
  };

  const handleCancel = (e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    (e?.nativeEvent as any)?.stopImmediatePropagation?.();
  };

  return (
    <Popconfirm
      title={confirmTitle}
      description={confirmDescription}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      okText="Yes"
      cancelText="No"
      okButtonProps={{ danger: true }}
    >
      <Button {...rest} danger={danger} type={type} icon={icon} onClick={handleTriggerClick} />
    </Popconfirm>
  );
};

export default ConfirmDeleteButton;
