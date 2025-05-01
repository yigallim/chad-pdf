import { pdfjs } from "react-pdf";
import Chat from "@/components/layout/conversation/chat";
import LeftTab from "@/components/layout/left-tab/left-tab";
import SideBar from "@/components/layout/conversation/sidebar";
import { ConfigProvider, App as AntdApp } from "antd";
import { geekblue } from "@ant-design/colors";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const App = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: geekblue[5],
        },
      }}
    >
      <AntdApp
        message={{
          maxCount: 5,
        }}
      >
        <div className="h-full w-full flex">
          <SideBar />
          <main className="flex h-full w-full min-w-[1024px] flex-1">
            <LeftTab />
            <Chat />
          </main>
        </div>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
