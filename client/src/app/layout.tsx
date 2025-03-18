import React from "react";
import "@ant-design/v5-patch-for-react-19";
import StoreProvider from "@/store/store-provider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "./globals.css";

const RootLayout = ({ children }: React.PropsWithChildren) => (
  <StoreProvider>
    <html lang="en">
      <body>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  </StoreProvider>
);

export default RootLayout;
