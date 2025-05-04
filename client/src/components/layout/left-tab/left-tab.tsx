import { useState } from "react";
import { Segmented } from "antd";
// import { FilePdfOutlined, ShareAltOutlined, SmileOutlined } from "@ant-design/icons";
import { FilePdfOutlined, ProfileOutlined } from "@ant-design/icons";
// import DocumentGraph from "@/components/layout/left-tab/document-graph";
import ViewPDF from "@/components/layout/left-tab/view-pdf/view-pdf";
import Summary from "./summary";
// import SentimentAnalysis from "./senitment-analysis";

// type Tab = "pdf" | "relation" | "sentiment";
type Tab = "pdf" | "summary";

const LeftTab = () => {
  const [currentTab, setCurrentTab] = useState<Tab>("pdf");
  return (
    <div className="min-w-0 h-full relative overflow-x-hidden">
      <Segmented
        options={[
          { label: "View PDF", value: "pdf", icon: <FilePdfOutlined /> },
          { label: "Documents Summary", value: "summary", icon: <ProfileOutlined /> },
          // { label: "Relation Graph", value: "relation", icon: <ShareAltOutlined /> },
          // { label: "Sentiment Analysis", value: "sentiment", icon: <SmileOutlined /> },
        ]}
        selected
        value={currentTab}
        onChange={setCurrentTab}
        className="z-10 absolute top-4 left-1/2 -translate-x-1/2 shadow-md"
      />
      {currentTab === "pdf" && <ViewPDF />}
      {currentTab === "summary" && <Summary />}
      {/* {currentTab === "relation" && <DocumentGraph className="w-full h-full" />}
      {currentTab === "sentiment" && <SentimentAnalysis />} */}
    </div>
  );
};

export default LeftTab;
