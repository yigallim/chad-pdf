import markdownit from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import markdownitMathjax3 from "markdown-it-mathjax3";
import { Typography } from "antd";
import type { BubbleProps } from "@ant-design/x";
import { MARKDOWN_STYLES } from "./markdown-css";
import "highlight.js/styles/github.css";

export const md = markdownit({
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

md.use(markdownitMathjax3);

md.inline.ruler.before(
  "link",
  "pdf_link",
  function pdfLink(state, silent) {
    const startPos = state.pos;
    if (state.src.slice(startPos, startPos + 4) !== "<!--") {
      return false;
    }

    const endPos = state.src.indexOf("-->", startPos + 4);
    if (endPos === -1) {
      return false;
    }

    const commentContent = state.src.slice(startPos + 4, endPos).trim();
    if (!commentContent.startsWith("pdfnav:")) {
      return false;
    }

    const pdfNavContent = commentContent.substring("pdfnav:".length).trim();

    // Regex to extract attributes: name="...", page=..., id=...
    const nameMatch = /name="([^"]+)"/.exec(pdfNavContent);
    const pageMatch = /page=(\d+)/.exec(pdfNavContent);
    const idMatch = /id=([^\s]+)/.exec(pdfNavContent);

    if (!nameMatch || !pageMatch || !idMatch) {
      return false; // Attributes not found or malformed
    }

    const filename = nameMatch[1];
    const pageNumber = pageMatch[1];
    const pdfId = idMatch[1];

    if (!silent) {
      const token = state.push("pdf_link_open", "button", 1);
      token.attrSet("class", "pdf-link-button");
      token.attrSet("data-pdf-id", pdfId);
      token.attrSet("data-page-number", pageNumber);

      const textToken = state.push("text", "", 0);
      textToken.content = `${filename}, Page ${pageNumber}`;

      state.push("pdf_link_close", "button", -1);
    }

    state.pos = endPos + 3; // Move position past '-->'
    return true;
  },
  { alt: ["paragraph", "reference", "blockquote", "list"] }
);

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
