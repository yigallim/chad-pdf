import markdownit from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import markdownitKatex from "markdown-it-katex";
import "katex/dist/katex.min.css";
import { Typography } from "antd";
import type { BubbleProps } from "@ant-design/x";
import { MARKDOWN_STYLES } from "./markdown-css";

const md = markdownit({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (_) {}
    }
    return "";
  },
});

md.use(markdownitKatex);

const originalCodeRenderer =
  md.renderer.rules.code_block ||
  function (tokens, idx, options, _, self) {
    return self.renderToken(tokens, idx, options);
  };

const originalInlineCodeRenderer =
  md.renderer.rules.code_inline ||
  function (tokens, idx, options, _, self) {
    return self.renderToken(tokens, idx, options);
  };

md.renderer.rules.code_block = function (tokens, idx, options, env, self) {
  const originalCode = originalCodeRenderer(tokens, idx, options, env, self);
  const code = tokens[idx].content;

  return `
    <div class="code-block-wrapper">
      <div class="code-block-header">
        <button class="copy-code-button" data-code="${encodeURIComponent(code)}">
          <span class="copy-icon">📋</span> Copy
        </button>
      </div>
      ${originalCode}
    </div>
  `;
};

md.renderer.rules.code_inline = function (tokens, idx, options, env, self) {
  const originalCode = originalInlineCodeRenderer(tokens, idx, options, env, self);
  const code = tokens[idx].content;

  return `
    <span class="inline-code-wrapper">
      ${originalCode}
      <button class="copy-inline-code-button" data-code="${encodeURIComponent(code)}">
        <span class="copy'icon-small">📋</span>
      </button>
    </span>
  `;
};

const originalFenceRenderer =
  md.renderer.rules.fence ||
  function (tokens, idx, options, _, self) {
    return self.renderToken(tokens, idx, options);
  };

md.renderer.rules.fence = function (tokens, idx, options, env, self) {
  const originalCode = originalFenceRenderer(tokens, idx, options, env, self);
  const code = tokens[idx].content;
  const lang = tokens[idx].info ? tokens[idx].info.trim() : "";

  return `
    <div class="code-block-wrapper">
      <div class="code-block-header">
        ${lang ? `<span class="code-language">${lang}</span>` : ""}
        <button class="copy-code-button" data-code="${encodeURIComponent(code)}">
          <span class="copy-icon">📋</span> Copy
        </button>
      </div>
      ${originalCode}
    </div>
  `;
};

export const renderMarkdown: BubbleProps["messageRender"] = (content) => {
  return (
    <Typography>
      <div className="markdown-content" dangerouslySetInnerHTML={{ __html: md.render(content) }} />
    </Typography>
  );
};

export { MARKDOWN_STYLES };
