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

function createPdfLinkButton(commentContent: string) {
  if (!commentContent.startsWith("pdfnav:")) {
    return null;
  }

  const pdfNavContent = commentContent.substring("pdfnav:".length).trim();

  const nameMatch = /name="([^"]+)"/.exec(pdfNavContent);
  const pageMatch = /page=(\d+)/.exec(pdfNavContent);
  const idMatch = /id=([^\s]+)/.exec(pdfNavContent);

  if (!nameMatch || !pageMatch || !idMatch) {
    return null;
  }

  const filename = nameMatch[1];
  const pageNumber = pageMatch[1];
  const pdfId = idMatch[1];

  return `<button class="pdf-link-button" data-pdf-id="${pdfId}" data-page-number="${pageNumber}">${filename}, Page ${pageNumber}</button>`;
}

md.inline.ruler.before("link", "pdf_link_inline", function pdfLinkInline(state, silent) {
  const startPos = state.pos;
  if (state.src.slice(startPos, startPos + 4) !== "<!--") {
    return false;
  }

  const endPos = state.src.indexOf("-->", startPos + 4);
  if (endPos === -1) {
    return false;
  }

  const commentContent = state.src.slice(startPos + 4, endPos).trim();
  const buttonHtml = createPdfLinkButton(commentContent);

  if (!buttonHtml) {
    return false;
  }

  if (!silent) {
    const token = state.push("html_inline", "", 0);
    token.content = buttonHtml;
  }

  state.pos = endPos + 3;
  return true;
});

// Add a block rule to handle PDF navigation comments on separate lines
md.block.ruler.before("html_block", "pdf_link_block", function (state, startLine, _, silent) {
  const startPos = state.bMarks[startLine] + state.tShift[startLine];
  const maxPos = state.eMarks[startLine];

  // Check if line starts with HTML comment
  if (maxPos - startPos < 7 || state.src.slice(startPos, startPos + 4) !== "<!--") {
    return false;
  }

  // Find the end of the comment
  const endPos = state.src.indexOf("-->", startPos + 4);
  if (endPos === -1 || endPos > state.eMarks[startLine]) {
    return false;
  }

  const commentContent = state.src.slice(startPos + 4, endPos).trim();
  const buttonHtml = createPdfLinkButton(commentContent);

  if (!buttonHtml) {
    return false;
  }

  if (silent) {
    return true;
  }

  const token = state.push("html_block", "", 0);
  token.map = [startLine, startLine + 1];
  token.content = buttonHtml;

  state.line = startLine + 1;
  return true;
});

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
