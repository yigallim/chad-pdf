export const MARKDOWN_STYLES = `
  .markdown-content {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
  }

  .markdown-content > *:first-child {
    margin-top: 0 !important;
  }

  .markdown-content > *:last-child {
    margin-bottom: 0 !important;
  }
    
  .markdown-content hr {
    color: rgba(220, 220, 220);
    margin-bottom: 32px;
    margin-top: 32px;
  }

  .markdown-content blockquote {
    font-style: italic;
  }
  .markdown-content table {
    border-collapse: separate;
    border-spacing: 0;
    margin: 1rem 0;
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #ddd;
  }
  
  .markdown-content th, 
  .markdown-content td {
    border-bottom: 1px solid #ddd;
    border-right: 1px solid #ddd;
    padding: 6px 12px;
    border-left: none;
    border-top: none;
  }
  
  .markdown-content th:last-child, 
  .markdown-content td:last-child {
    border-right: none;
  }
  
  .markdown-content tr:last-child td {
    border-bottom: none;
  }
  
  .markdown-content th {
    background-color: #f2f2f2;
    font-weight: 600;
  }
  
  .markdown-content tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  
  .markdown-content tr:last-child td:first-child {
    border-bottom-left-radius: 8px;
  }
  
  .markdown-content tr:last-child td:last-child {
    border-bottom-right-radius: 8px;
  }
  
  .markdown-content tr:first-child th:first-child {
    border-top-left-radius: 8px;
  }
  
  .markdown-content tr:first-child th:last-child {
    border-top-right-radius: 8px;
  }
  
  .markdown-content pre {
    background-color: #f6f8fa;
    border-radius: 0 0 6px 6px;
    padding: 16px;
    overflow: auto;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 85%;
    position: relative;
    margin-top: 0;
    border: none;
  }
  
  .markdown-content code {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 90%;
    padding: 0.2em 0.4em;
    background-color: rgba(27, 31, 35, 0.05);
    border-radius: 3px;
  }
  
  .markdown-content pre code {
    background-color: transparent;
    padding: 0;
  }
  
  .code-block-wrapper {
    position: relative;
    margin-bottom: 16px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #e1e4e8;
  }

  .code-block-wrapper pre {
    border: none;
    margin-bottom: 0;
  }

  .code-block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f1f1f1;
    padding: 6px 12px;
    font-size: 12px;
    border-bottom: 1px solid #e1e4e8;
  }

  .code-language {
    color: #666;
    font-size: 12px;
  }

  .copy-code-button {
    background-color: transparent;
    border: 1px solid #d1d5da;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s;
  }

  .copy-code-button:hover {
    background-color: #e1e4e8;
  }

  .copy-code-button.copied {
    background-color: #28a745;
    color: white;
    border-color: #28a745;
  }

  .inline-code-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    margin: 0 2px;
  }

  .copy-inline-code-button {
    visibility: hidden;
    position: absolute;
    right: -16px;
    top: -10px;
    background: transparent;
    border: none;
    font-size: 10px;
    padding: 2px;
    cursor: pointer;
    color: #666;
    transition: color 0.2s;
  }

  .inline-code-wrapper:hover .copy-inline-code-button {
    visibility: visible;
  }

  .copy-inline-code-button:hover {
    color: #1890ff;
  }

  .copy-icon, .copy-icon-small {
    display: inline-block;
    font-size: 12px;
  }

  .copy-icon-small {
    font-size: 10px;
  }
  
  .markdown-content .MathJax {
    display: inline-block;
    position: static !important;
    height: inherit;
    line-height: inherit;
  }

  .pdf-link-button {
    background-color: #e6f7ff;
    border: 1px solid #91d5ff;
    color: #1890ff;
    padding: 2px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
    margin: 0 2px;
    transition: background-color 0.3s, border-color 0.3s;
  }

  .pdf-link-button:hover {
    background-color: #bae7ff;
    border-color: #69c0ff;
  }
`;
