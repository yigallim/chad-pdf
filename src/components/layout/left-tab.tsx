type LeftTabProps = {
  children: React.ReactNode;
};
const LeftTab = ({ children }: LeftTabProps) => {
  return <div className="flex-1 h-full">{children}</div>;
};

export default LeftTab;
