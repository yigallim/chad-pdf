import { useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { pdfjs } from "react-pdf";
import { Allotment } from "allotment";
import { motion } from "framer-motion";
import { ConfigProvider, App as AntdApp, Typography, Button } from "antd";
import { CommentOutlined, FileTextOutlined } from "@ant-design/icons";
import { geekblue } from "@ant-design/colors";
import Chat from "@/components/layout/chat/chat";
import LeftTab from "@/components/layout/left-tab/left-tab";
import SideBar from "@/components/layout/conversation/sidebar";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import NewConversation from "@/components/layout/conversation/new-conversation";
import "allotment/dist/style.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const App = () => {
  const { pathname } = useLocation();
  const atHomePage = pathname == "/";

  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const feature1Ref = useRef<HTMLDivElement>(null);
  const feature2Ref = useRef<HTMLDivElement>(null);
  const feature3Ref = useRef<HTMLDivElement>(null);

  const memoNewConversationButton = useMemo(
    () => (
      <Button
        ref={buttonRef}
        icon={<CommentOutlined />}
        type="primary"
        size="large"
        className="h-12 px-6 text-base mt-6"
      >
        Start Conversations
      </Button>
    ),
    []
  );

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
            {atHomePage ? (
              <div
                ref={containerRef}
                className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white relative overflow-hidden"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center max-w-3xl px-4 z-10"
                >
                  <div ref={iconRef} className="mb-6 inline-block p-8 bg-indigo-100 rounded-full">
                    <FileTextOutlined style={{ fontSize: 48, color: geekblue[5] }} />
                  </div>

                  <Typography.Title
                    style={{ fontWeight: 700, fontSize: 48, marginBottom: 16 }}
                    level={1}
                  >
                    Chat with any PDF
                  </Typography.Title>

                  <Typography.Paragraph className="text-lg text-gray-600 mb-8 max-w-[550px] text-center">
                    Upload your PDF documents and start a conversation. Ask questions, get
                    summaries, and extract insights from your documents with our intelligent chat
                    interface.
                  </Typography.Paragraph>

                  <NewConversation>{memoNewConversationButton}</NewConversation>

                  <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        title: "Upload PDFs",
                        description: "Import your documents with a simple drag & drop",
                        ref: feature1Ref,
                      },
                      {
                        title: "Ask Questions",
                        description: "Chat naturally with your documents using AI",
                        ref: feature2Ref,
                      },
                      {
                        title: "Get Insights",
                        description: "Extract key information and summaries instantly",
                        ref: feature3Ref,
                      },
                    ].map((feature, index) => (
                      <motion.div
                        key={index}
                        ref={feature.ref}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                        className="px-6 py-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow h-full"
                      >
                        <Typography.Title level={5}>{feature.title}</Typography.Title>
                        <Typography.Text className="text-gray-500">
                          {feature.description}
                        </Typography.Text>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <AnimatedBeam
                  containerRef={containerRef}
                  fromRef={iconRef}
                  toRef={buttonRef}
                  curvature={-0.5}
                  duration={6}
                  delay={0}
                  pathWidth={2}
                  pathOpacity={0.2}
                  gradientStartColor="#ffaa40"
                  gradientStopColor="#9c40ff"
                />

                <AnimatedBeam
                  containerRef={containerRef}
                  fromRef={buttonRef}
                  toRef={feature1Ref}
                  curvature={0.3}
                  duration={6}
                  delay={0.6}
                  pathWidth={2}
                  pathOpacity={0.2}
                  gradientStartColor="#40a9ff"
                  gradientStopColor="#9c40ff"
                />

                <AnimatedBeam
                  containerRef={containerRef}
                  fromRef={buttonRef}
                  toRef={feature2Ref}
                  curvature={0}
                  duration={6}
                  delay={0.8}
                  pathWidth={2}
                  pathOpacity={0.2}
                  gradientStartColor="#40a9ff"
                  gradientStopColor="#9c40ff"
                />

                <AnimatedBeam
                  containerRef={containerRef}
                  fromRef={buttonRef}
                  toRef={feature3Ref}
                  curvature={-0.3}
                  duration={6}
                  delay={1}
                  pathWidth={2}
                  pathOpacity={0.2}
                  gradientStartColor="#40a9ff"
                  gradientStopColor="#9c40ff"
                />
              </div>
            ) : (
              <Allotment className="h-full w-full" defaultSizes={[5, 5]}>
                <Allotment.Pane minSize={430}>
                  <LeftTab />
                </Allotment.Pane>
                <Allotment.Pane minSize={500}>
                  <Chat />
                </Allotment.Pane>
              </Allotment>
            )}
          </main>
        </div>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
