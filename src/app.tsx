import DocumentGraph from "@/components/layout/document-graph";
import LeftTab from "./components/layout/left-tab";

const App = () => {
  return (
    <div className="flex h-screen">
      <LeftTab>
        <DocumentGraph className="w-full h-full" />
      </LeftTab>
      <div className="flex-1 h-full bg-gray-100"></div>
    </div>
  );
};

export default App;
