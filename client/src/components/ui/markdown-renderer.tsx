import { md } from "../layout/chat/markdown-util";

type MarkdownRendererProps = {
  markdownText: string;
};

const MarkdownRenderer = ({ markdownText }: MarkdownRendererProps) => {
  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: md.render(markdownText) }}
    />
  );
};

export default MarkdownRenderer;
