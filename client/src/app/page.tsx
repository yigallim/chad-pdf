"use client";
import React from "react";
import { ConfigProvider } from "antd";
import Independent from "@/components/independent";
import { geekblue } from "@ant-design/colors";

const Home = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: geekblue[5],
          //   colorPrimary: "#000000",
        },
      }}
    >
      <Independent />
    </ConfigProvider>
  );
};

export default Home;
